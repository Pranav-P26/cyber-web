import pyotp
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sys
import os
from dotenv import load_dotenv

load_dotenv()

def generate_otp():
    secret = os.getenv('TOTP_SECRET')

    totp = pyotp.TOTP(secret, digits=6)
    return totp.now()

def send_otp_email(otp, recipient_email):
    sender_email = os.getenv('GMAIL_USER')
    sender_password = os.getenv('GMAIL_APP_PASSWORD')
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))

    # Create message
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = recipient_email
    message["Subject"] = "Your OTP Code"

    body = f"Your OTP code is: {otp}\n\nThis code will expire in 30 seconds."
    message.attach(MIMEText(body, "plain"))

    try:
        # Create SMTP session
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)

        # Send email
        text = message.as_string()
        server.sendmail(sender_email, recipient_email, text)
        server.quit()

        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python otp_generator.py <email_address>")
        print("Example: python otp_generator.py user@example.com")
        sys.exit(1)

    recipient_email = sys.argv[1]

    # Generate OTP
    otp = generate_otp()

    if otp is None:
        print("Failed to generate OTP - check TOTP_SECRET in .env file")
        sys.exit(1)

    # Send OTP via email
    success = send_otp_email(otp, recipient_email)

    if success:
        print(f"Generated OTP: {otp} sent to {recipient_email}")
    else:
        print("Failed to send OTP")

if __name__ == "__main__":
    main()