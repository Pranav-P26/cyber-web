from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
from cryptography.fernet import Fernet
import os
from io import BytesIO
import pyotp
import subprocess
import sys
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# In-memory storage for OTPs (in production, use Redis or database)
otp_storage = {}

# Ensure the keys directory exists
os.makedirs('keys', exist_ok=True)
app = Flask(__name__, static_folder="static", static_url_path="/static")
CORS(app, resources={r"/*": {"origins": "*"}})

# Generate or load the key
key_file = 'keys/filekey.key'
if not os.path.exists(key_file):
    key = Fernet.generate_key()
    with open(key_file, 'wb') as f:
        f.write(key)

# Load the key from the .key file
with open(key_file, 'rb') as f:
    key = f.read()

# Create a Fernet object using the key
fernet = Fernet(key)

@app.route('/')
def home():
    return send_file("index.html")

@app.route('/encrypt', methods=['POST'])
def encrypt_file():
    file_path = request.form.get('filepath')
    print(f"File path: {file_path}")

    if not file_path:
        print("No file path")
        return jsonify({'error': 'No file path provided'}), 400
    
    if not os.path.exists(file_path):
        print("File does not exist")
        return jsonify({'error': 'File does not exist'}), 400
    
    if not os.path.isfile(file_path):
        print("Path is not a file")
        return jsonify({'error': 'Path must be a file, not a directory'}), 400
    
    try:
        print("Opening file")
        # Open the file to be encrypted in binary read mode
        with open(file_path, 'rb') as f:
            original = f.read()
        print(f"Read {len(original)} bytes")
        
        # Encrypt the file content
        encrypted = fernet.encrypt(original)
        print("Encrypted")
        
        # Save encrypted file to uploads folder
        filename = os.path.basename(file_path) + ".encrypted"
        temp_path = os.path.join('uploads', filename)
        os.makedirs('uploads', exist_ok=True)
        
        with open(temp_path, 'wb') as f:
            f.write(encrypted)
        
        print(f"Saved to {temp_path}")
        
        # Return the download URL instead of the file
        return jsonify({
            'success': True,
            'download_url': f'/download/{filename}',
            'message': f'File encrypted successfully'
        }), 200
    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/decrypt', methods=['POST'])
def decrypt_file():
    file_path = request.form.get('filepath')
    print(f"Decrypt file path: {file_path}")

    if not file_path:
        print("No file path")
        return jsonify({'error': 'No file path provided'}), 400
    
    if not os.path.exists(file_path):
        print("File does not exist")
        return jsonify({'error': 'File does not exist'}), 400
    
    if not os.path.isfile(file_path):
        print("Path is not a file")
        return jsonify({'error': 'Path must be a file, not a directory'}), 400
    
    try:
        print("Loading key")
        # Load the key
        with open('keys/filekey.key', 'rb') as f:
            key = f.read()

        # Create a Fernet object
        fernet = Fernet(key)

        print("Reading encrypted file")
        # Read the encrypted data from the file
        with open(file_path, 'rb') as f:
            encrypted = f.read()

        print("Decrypting")
        try:
            decrypted = fernet.decrypt(encrypted)
            print(f"Decrypted {len(decrypted)} bytes")
        except Exception as decrypt_error:
            print(f"Decryption failed: {decrypt_error}")
            return jsonify({'error': 'Invalid encryption key or corrupted file'}), 400

        print("Writing decrypted data")
        if file_path.endswith('.encrypted'):
            output_path = file_path[:-10]
        else:
            output_path = file_path + '.decrypted'
        
        with open(output_path, 'wb') as f:
            f.write(decrypted)
        
        if file_path.endswith('.encrypted'):
            os.remove(file_path)
            print(f"Removed encrypted file: {file_path}")
        
        return jsonify({'message': f'File decrypted successfully to {output_path}'}), 200
    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400

    email = data['email']
    if '@' not in email:
        return jsonify({'error': 'Invalid email format'}), 400

    secret = os.getenv('TOTP_SECRET')
    if not secret:
        return jsonify({'error': 'OTP configuration error'}), 500

    totp = pyotp.TOTP(secret, digits=6)
    otp = totp.now()

    otp_storage[email] = {
        'otp': otp,
        'expires': time.time() + 30
    }

    result = subprocess.run([sys.executable, 'otp_generator.py', email], 
                          capture_output=True, text=True)

    if result.returncode == 0:
        return jsonify({'success': True, 'message': 'OTP sent successfully'}), 200
    else:
        return jsonify({'error': 'Failed to send OTP'}), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    if not data or not data.get('otp'):
        return jsonify({'error': 'OTP is required'}), 400

    otp = data['otp']
    if not otp.isdigit() or len(otp) != 6:
        return jsonify({'error': 'Invalid OTP format'}), 400

    current_time = time.time()
    
    # Find and validate OTP
    for email, otp_data in list(otp_storage.items()):
        if current_time > otp_data['expires']:
            del otp_storage[email]
        elif otp_data['otp'] == otp and current_time <= otp_data['expires']:
            del otp_storage[email]
            return jsonify({'success': True, 'message': 'OTP verified successfully'}), 200
    
    return jsonify({'error': 'Invalid or expired OTP'}), 400

@app.route('/download/<filename>')
def download_file(filename):
    file_path = os.path.join('uploads', filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True, download_name=filename)
    return jsonify({'error': 'File not found'}), 404

@app.errorhandler(404)
def not_found(error):
    response = jsonify({'error': 'Endpoint not found'})
    response.headers['Content-Type'] = 'application/json'
    return response, 404

@app.errorhandler(500)
def internal_error(error):
    response = jsonify({'error': 'Internal server error'})
    response.headers['Content-Type'] = 'application/json'
    return response, 500

@app.errorhandler(Exception)
def handle_exception(error):
    print(f"Unhandled exception: {error}")
    response = jsonify({'error': 'An unexpected error occurred'})
    response.headers['Content-Type'] = 'application/json'
    return response, 500

if __name__ == "__main__":
    app.run(debug=True)