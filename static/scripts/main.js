const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Configuration object
const config = {
    gridSize: 40,
    gridColor: '#334155',
    particleCount: 50,
    particleSpeedMin: 0.5,
    particleSpeedMax: 5,
    particleColors: ['#30B852', '#00741dff', '#94a3b8'],
    trailLength: 100,
    backgroundColor: '#000',
    rippleDuration: 2000,
    rippleMaxRadius: 200
};

// Grid tracking system
const occupiedLines = {
    horizontal: new Set(),
    vertical: new Set()
};

// For random hacking characters
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':,./<>?";

function createGrid() {
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(51, 65, 85, 1)');
    gradient.addColorStop(1, 'rgba(51, 65, 85, 0)');
    ctx.strokeStyle = gradient;

    for (let y = 0; y < canvas.height; y += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    for (let x = 0; x < canvas.width; x += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
}

class Particle {
    constructor() {
        this.color = config.particleColors[Math.floor(Math.random() * config.particleColors.length)];
        this.speed = Math.random() * (config.particleSpeedMax - config.particleSpeedMin) + config.particleSpeedMin;
        this.reset();
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > config.trailLength) this.trail.shift();

        if (this.active) {
            if (this.direction === 'horizontal') {
                this.x += this.speed;
                if (this.x > canvas.width) {
                    this.active = false;
                    occupiedLines.horizontal.delete(this.y);
                }
            } else {
                this.y += this.speed;
                if (this.y > canvas.height) {
                    this.active = false;
                    occupiedLines.vertical.delete(this.x);
                }
            }
        } else {
            const allTrailPointsOffScreen = this.trail.every(point =>
                (this.direction === 'horizontal' && point.x > canvas.width) ||
                (this.direction === 'vertical' && point.y > canvas.height)
            );

            if (allTrailPointsOffScreen) {
                this.reset();
            }
        }
    }

    draw() {
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = (i / this.trail.length);
            ctx.fillStyle = this.color.replace('1)', `${alpha})`);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    findAvailableLine() {
        const maxAttempts = 100;
        let attempts = 0;

        while (attempts < maxAttempts) {
            if (Math.random() > 0.5) {
                // Try horizontal
                const y = Math.round(Math.random() * canvas.height / config.gridSize) * config.gridSize;
                if (!occupiedLines.horizontal.has(y)) {
                    this.direction = 'horizontal';
                    this.x = 0;
                    this.y = y;
                    occupiedLines.horizontal.add(y);
                    return true;
                }
            } else {
                // Try vertical
                const x = Math.round(Math.random() * canvas.width / config.gridSize) * config.gridSize;
                if (!occupiedLines.vertical.has(x)) {
                    this.direction = 'vertical';
                    this.x = x;
                    this.y = 0;
                    occupiedLines.vertical.add(x);
                    return true;
                }
            }
            attempts++;
        }
        return false;
    }

    reset() {
        if (this.findAvailableLine()) {
            this.trail = [];
            this.active = true;
            this.speed = Math.random() * (config.particleSpeedMax - config.particleSpeedMin) + config.particleSpeedMin;
        } else {
            this.active = false;
            this.trail = [];
        }
    }
}

const particles = Array(config.particleCount).fill().map(() => new Particle());

// Ripple effect handler
let ripples = [];
class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = config.rippleMaxRadius;
        this.startTime = Date.now();
    }

    update() {
        const elapsed = Date.now() - this.startTime;
        this.radius = (elapsed / config.rippleDuration) * this.maxRadius;
    }

    draw() {
        const alpha = 1 - (this.radius / this.maxRadius);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw random characters along the ripple
        if (Math.random() < 4.3) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.font = "16px monospace";
            const char = characters[Math.floor(Math.random() * characters.length)];
            ctx.fillText(char, this.x + (Math.random() - 0.5) * this.radius * 2, this.y + (Math.random() - 0.5) * this.radius * 2);
        }
    }

    isComplete() {
        return this.radius >= this.maxRadius;
    }
}

function animate() {
    createGrid();

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // Update and draw ripples
    ripples = ripples.filter(ripple => !ripple.isComplete()); // Remove completed ripples
    ripples.forEach(ripple => {
        ripple.update();
        ripple.draw();
    });

    requestAnimationFrame(animate);
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear occupied lines
    occupiedLines.horizontal.clear();
    occupiedLines.vertical.clear();

    // Reset all particles
    particles.forEach(particle => particle.reset());
});

// Add ripple on click
canvas.addEventListener('click', (event) => {
    const x = event.clientX;
    const y = event.clientY;
    ripples.push(new Ripple(x, y));
});

const triadContent = {
    confidentiality: {
        header: "Confidentiality",
        text: "<p>Confidentiality involves restricting access to data strictly to authorised personnel. Users are responsible for maintaining the secrecy of their logical (e.g., passwords) and physical access (e.g., ID cards) credentials. To stay safe, it is important to limit data sharing and restrict availability to only those who need it.</p><p>It is important to note that logical restrictions are not the only type of restriction. Unwanted access to a building can give an intruder opportunities to obtain sensitive information. To counter this, organizations should use door codes. They should not be written down, and staff must make sure nobody is watching before typing in the code. Staff could also wear ID badges within the building to differentiate between workers and visitors. You should not wear your ID outside of work, as it creates more opportunities for people to get your code.</p><p>Logical restrictions can be placed by using passwords. A strong password is at least 8 characters long, contains upper and lower case letters, numbers, and special symbols. Once again, passwords should not be shared with anyone and should be changed immediately if compromised. A good rule of thumb is to change your password every 90 days.</p>"
    },
    integrity: {
        header: "Integrity",
        text: "<p>Integrity ensures that information is accurate and has not been modified by unauthorized persons or processes. The integrity of your data determines how trustworthy the organization may be. The United Kingdom, as part of the Data Protection Act of 2018, required organizations to implement measures to ensure data is kept accurate and up to date. In organizations, employees should assign themselves specific roles to uphold data integrity. This will prevent inefficiencies and promote accountability.</p>"
    },
    availability: {
        header: "Availability",
        text: "<p>Availability ensures that information and systems are accessible to authorized users when needed. For data to be readily available, it needs to be stored in a logical, secure system. It is in the user's best interest to file documents on a desktop so they can be easily located when needed. However, it should be secure and not left open to unauthorized access.</p><p>Backups should be implemented to make sure data is never irretrievably lost. Some methods of storage are more vulnerable than others. For example, information on portable storage devices, such as USBs, is particularly vulnerable.</p><p>It is an organization's responsibility to implement a contingency plan to recover from quick attacks. This makes sure the service is still available and faces minimal disruption. Getting systems up and running as soon as possible is a top priority to ensure there is no excessive interruption.</p>"
    }
};

function showContent(type) {
    const content = triadContent[type];
    const box = document.getElementById('content-box');
    box.classList.remove('show');
    void box.offsetWidth;
    document.getElementById('content-header').textContent = content.header;
    document.getElementById('content-text').innerHTML = content.text;
    box.classList.add('show');
}

function hideContent() {
    const box = document.getElementById('content-box');
    box.classList.remove('show');
    setTimeout(() => {
        box.style.display = 'none';
    }, 400);
}

document.getElementById('confidentiality-btn').addEventListener('click', () => showContent('confidentiality'));
document.getElementById('integrity-btn').addEventListener('click', () => showContent('integrity'));
document.getElementById('availability-btn').addEventListener('click', () => showContent('availability'));

class RangeSlider {
    constructor(element, settings) {
        this.settings = Object.assign({
            clsCircular: 'c-rng--circular',
            clsCircularOutput: 'c-rng--circular-output',
            clsOutput: 'c-rng__output',
            clsOutputWrapper: 'c-rng--output',
            clsRangeTicks: 'c-rng--ticks',
            clsWrapper: 'c-rng__wrapper',
            offset: -90,
            varPercent: '--rng-percent',
            varPercentUpper: '--rng-percent-upper',
            varThumb: '--rng-thumb-w',
            varUnit: '--rng-unit',
            varValue: '--rng-value'
        }, stringToType(settings));

        this.range = element;
        this.initRange(this.range);
    }

    /**
    * @function initRange
    * @param {Node} range
    * @description Initialize: Create elements, add eventListeners etc.
    */
    initRange(range) {
        const circular = this.settings.range.includes('circular');
        range.id = range.id || uuid();

        this.lower = this.settings.range.includes('upper') ? range.parentNode.querySelector(`[data-range*="lower"]`) : null;
        this.max = parseInt(range.max, 10) || 100;
        this.min = parseInt(range.min, 10);
        this.multiplier = 100 / (this.max - this.min);
        this.output = this.settings.range.includes('output') || circular ? document.createElement('output') : null;
        this.ticks = parseInt(range.dataset.ticks, 10);
        this.upper = this.settings.range.includes('lower') ? range.parentNode.querySelector(`[data-range*="upper"]`) : null;
        const isMulti = (this.lower || this.upper);
        this.wrapper = isMulti ? range.parentNode : document.createElement('div');

        /* output */
        if (this.output) {
            this.output.className = circular ? this.settings.clsCircularOutput : this.settings.clsOutput;
            this.output.for = range.id;

            if (isMulti) {
                this.wrapper.insertBefore(this.output, range);
            }
            else {
                this.wrapper.classList.add(circular ? this.settings.clsCircular : this.settings.clsOutputWrapper);
                this.wrapper.appendChild(this.output);
            }
        }

        /* wrapper */
        if (!isMulti) {
            range.parentNode.insertBefore(this.wrapper, range);
            this.wrapper.appendChild(range);
        }
        if (range.dataset.modifier) {
            this.wrapper.classList.add(range.dataset.modifier)
        }

        this.wrapper.classList.add(this.settings.clsWrapper);
        this.wrapper.style.setProperty(this.settings.varThumb, getComputedStyle(range).getPropertyValue(this.settings.varThumb));

        /* ticks */
        if (this.ticks) {
            const ticks = [...Array(this.ticks).keys()];
            const svg = `
				<svg class="${this.settings.clsRangeTicks}" width="100%" height="100%">
				${ticks.map((index) => {
                return `<rect x="${(100 / this.ticks) * index}%" y="5" width="1" height="100%"></rect>`
            }).join('')
                }
				<rect x="100%" y="5" width="1" height="100%"></rect>
			</svg>`;
            this.wrapper.insertAdjacentHTML('afterbegin', svg);
        }

        /* circular */
        if (circular) {
            range.hidden = true;
            this.setCenter();
            this.output.setAttribute('tabindex', 0);
            this.output.addEventListener('keydown', (event) => {
                switch (event.key) {
                    case 'ArrowLeft': case 'ArrowDown': event.preventDefault(); this.range.stepDown(); this.updateCircle(); break;
                    case 'ArrowRight': case 'ArrowUp': event.preventDefault(); this.range.stepUp(); this.updateCircle(); break;
                    default: break;
                }
            });
            this.output.addEventListener('pointerdown', (event) => {
                event.preventDefault();
                const pointerMove = (e) => this.updateCircle(this.rotate(e.pageX, e.pageY));
                const pointerUp = () => {
                    document.removeEventListener('pointermove', pointerMove);
                    document.removeEventListener('pointerup', pointerUp);
                };
                document.addEventListener('pointermove', pointerMove);
                document.addEventListener('pointerup', pointerUp);
            });

            window.addEventListener('resize', () => this.setCenter());
            window.addEventListener('scroll', () => this.setCenter());

            this.updateCircle();

            this.range.addEventListener('input', () => this.updateCircle());
        }
        else {
            range.addEventListener('input', () => { return this.updateRange() });
        }

        /* TODO: Send init event ? */
        range.dispatchEvent(new Event('input'));
    }

    /**
    * @function rotate
    * @param {Number} x
    * @param {Number} y
    * @description  Returns angle from center of circle to current mouse x and y
    */
    rotate(x, y) {
        return Math.atan2(y - this.center.y, x - this.center.x) * 180 / Math.PI
    }

    /**
    * @function setCenter
    * @description Calculates center of circular range
    */
    setCenter() {
        const rect = this.wrapper.getBoundingClientRect();
        this.center = {
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top + rect.height / 2 + window.scrollY
        }
    }

    /**
    * @function updateCircle
    * @param {Number} start
    * @description  Updates CSS Custom Props/coniuc-gradient when circular-input is modified
    */
    updateCircle(start) {
        if (start) {
            let angle = start;
            let rad = 360 / (this.max - this.min);
            let end = angle - this.settings.offset;
            if (end < 0) end += 360;
            let newValue = Math.max(this.min, Math.min(this.max, Math.ceil(end / rad)));
            let oldValue = this.range.valueAsNumber;
            this.range.value = newValue;

            if (oldValue !== newValue && !isAdjusting) {
                adjustSliders(this.range, oldValue, newValue);
            }
        }

        let rad = 360 / (this.max - this.min);
        let angle = rad * this.range.valueAsNumber + this.settings.offset;
        let end = angle - this.settings.offset;
        if (end < 0) end += 360;
        this.wrapper.dataset.value = this.range.value;
        this.wrapper.style.setProperty('--angle', `${angle}deg`);
        this.wrapper.style.setProperty('--gradient-end', `${end}deg`);
    }

    /**
    * @function updateRange
    * @description Updates CSS Custom Props when range-input is modified
    */
    updateRange() {
        if (this.lower) { /* Active is `upper` */
            if (this.lower.valueAsNumber > this.range.valueAsNumber) {
                this.range.value = this.lower.valueAsNumber;
                return;
            }
        }
        if (this.upper) { /* Active is `lower` */
            if (this.upper.valueAsNumber < this.range.valueAsNumber) {
                this.range.value = this.upper.valueAsNumber;
                return;
            }
        }

        const value = (this.range.valueAsNumber - this.min) * this.multiplier;
        this.range.style.setProperty(this.settings.varPercent, `${value}%`);
        this.range.style.setProperty(this.settings.varValue, `${this.range.valueAsNumber}`);

        if (this.lower) {
            this.lower.style.setProperty(this.settings.varPercentUpper, `${value}%`);
        }

        if (this.output) {
            this.output.style.setProperty(this.settings.varUnit, `${value}`);
            this.output.innerText = this.range.value;
        }
    }
}

/* Helper methods */
function stringToType(obj) {
    const object = Object.assign({}, obj);
    Object.keys(object).forEach(key => {
        if (typeof object[key] === 'string' && object[key].charAt(0) === ':') {
            object[key] = JSON.parse(object[key].slice(1));
        }
    });
    return object;
}

function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => {
        return (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
    }
    );
}

const elements = document.querySelectorAll('[data-range]');
const sliderInstances = new Map();
elements.forEach(element => {
    const instance = new RangeSlider(element, element.dataset);
    sliderInstances.set(element, instance);
})

const circularRanges = document.querySelectorAll('[data-range="circular"]');
let isAdjusting = false;

function adjustSliders(changedRange, oldValue, newValue) {
    if (isAdjusting) return;

    const ranges = Array.from(circularRanges);
    const index = ranges.indexOf(changedRange);
    if (index === -1) return;

    const delta = newValue - oldValue;
    if (delta === 0) return;

    isAdjusting = true;

    const currentVals = [parseInt(ranges[0].value), parseInt(ranges[1].value), parseInt(ranges[2].value)];

    if (index === 0) {
        ranges[1].value = Math.max(0, Math.min(100, currentVals[1] - delta));
        ranges[2].value = Math.max(0, Math.min(100, currentVals[2] - delta));
    } else if (index === 1) {
        ranges[0].value = Math.max(0, Math.min(100, currentVals[0] - delta));
        ranges[2].value = Math.max(0, Math.min(100, currentVals[2] - delta));
    } else if (index === 2) {
        ranges[0].value = Math.max(0, Math.min(100, currentVals[0] - delta));
        ranges[1].value = Math.max(0, Math.min(100, currentVals[1] - delta));
    }

    ranges.forEach(r => sliderInstances.get(r)?.updateCircle());

    isAdjusting = false;
}

document.getElementById('encrypt-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const resultDiv = document.getElementById('encrypt-result');

    try {
        const response = await fetch('/encrypt', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Create a download link
            const downloadLink = document.createElement('a');
            downloadLink.href = data.download_url;
            downloadLink.download = '';
            downloadLink.click();
            resultDiv.innerHTML = `<p style="color: #30B852;">File encrypted! Download started.</p>`;
        } else {
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">Error: ${data.error || 'Unknown error'}</p>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #ff6b6b;">Error: ${error.message}</p>`;
    }
});

// decrypt
document.getElementById('decrypt-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const resultDiv = document.getElementById('decrypt-result');
    try {
        const response = await fetch('/decrypt', {
            method: 'POST',
            body: formData
        });
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = {error: 'Server returned invalid response'};
        }   
        if (response.ok && !data.error) {
            resultDiv.innerHTML = `<p style="color: #30B852;">${data.message}</p>`;
        } else {
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">Error: ${data.error || 'Unknown error'}</p>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #ff6b6b;">Error: ${error.message}</p>`;
    }
});

// Password Strength Checker
const passwordInput = document.getElementById('password-check');
const togglePasswordBtn = document.getElementById('toggle-password');
const strengthResult = document.getElementById('strength-result');

function calculatePasswordStrength(password) {
    let C = 0;
    if (/[a-z]/.test(password)) C += 26;
    if (/[A-Z]/.test(password)) C += 26;
    if (/[0-9]/.test(password)) C += 10;
    if (/[^a-zA-Z0-9]/.test(password)) C += 33;

    // Password length (N)
    const N = password.length;

    const S = Math.pow(C, N);

    const entropy = Math.log2(S);
    const A = 170000000000;
    const secondsPerYear = 6.308e7;
    const yearsToBreak = S / (A * secondsPerYear);

    return {
        entropy,
        yearsToBreak,
        characterSet: {
            size: C,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /[0-9]/.test(password),
            special: /[^a-zA-Z0-9]/.test(password)
        }
    };
}

function formatTimeToBreak(years) {
    if (years < 1/365) {
        return 'Instantly';
    } else if (years < 1) {
        return `${Math.round(years * 365)} days`;
    } else if (years < 1000) {
        return `${Math.round(years)} years`;
    } else if (years < 1000000) {
        return `${Math.round(years/1000)}k years`;
    } else if (years < 1000000000) {
        return `${Math.round(years/1000000)}M years`;
    } else {
        return `${Math.round(years/1000000000)}B years`;
    }
}

function updateStrengthDisplay(password) {
    if (!password) {
        strengthResult.style.display = 'none';
        return;
    }

    const strength = calculatePasswordStrength(password);
    strengthResult.style.display = 'block';

    const entropyElement = strengthResult.querySelector('.entropy-score');
    entropyElement.innerHTML = `Password Entropy: ${Math.round(strength.entropy)} bits`;

    const timeElement = strengthResult.querySelector('.crack-time');
    timeElement.innerHTML = `Time to crack: ${formatTimeToBreak(strength.yearsToBreak)}`;

    const setsElement = strengthResult.querySelector('.character-sets');
    const sets = [];
    if (strength.characterSet.lowercase) sets.push('lowercase');
    if (strength.characterSet.uppercase) sets.push('uppercase');
    if (strength.characterSet.numbers) sets.push('numbers');
    if (strength.characterSet.special) sets.push('special characters');
    
    setsElement.innerHTML = `Character sets used (${strength.characterSet.size}): ${sets.join(', ')}`;
}

passwordInput.addEventListener('input', (e) => {
    updateStrengthDisplay(e.target.value);
});

togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePasswordBtn.textContent = type === 'password' ? 'Show' : 'Hide';
});
const authContent = {
    mfa: {
        header: "Multi-Factor Authentication",
        table: `
            <table>
                <thead>
                    <tr>
                        <th>Aspect</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Definition</strong></td>
                        <td>MFA requires users to provide two or more verification factors to gain access to a resource, combining something you know (password), something you have (phone/token), and/or something you are (biometrics).</td>
                    </tr>
                    <tr>
                        <td><strong>Common Methods</strong></td>
                        <td>SMS codes, authenticator apps (Google Authenticator, Microsoft Authenticator), hardware tokens, biometric scans, push notifications.</td>
                    </tr>
                    <tr>
                        <td><strong>Appropriate</strong></td>
                        <td>Security is of a higher priority than user experience and throughput, users are willing to provide an additional means of contact, and organizations are able to provide a range of options for how a user can verify themselves.</td>
                    </tr>
                    <tr>
                        <td><strong>Inappropriate</strong></td>
                        <td>User experience and throughput is a higher priority than security, users don't want to have additional contact information associated with your website, and users are not confident using mobile devices, and are unlikely to understand authentication messages.</td>
                    </tr>
                    <tr>
                        <td><strong>Example Scenario</strong></td>
                        <td>You are a large online marketplace, with customers who buy and sell goods through your website. Due to the growth in password attacks (such as credential stuffing against many online platforms), you’d like to reassure your customers by adding extra security, so you decide to implement MFA on your accounts.</td>
                    </tr>
                </tbody>
            </table>
        `
    },
    sso: {
        header: "Federated Single Sign-On",
        table: `
            <table>
                <thead>
                    <tr>
                        <th>Aspect</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Definition</strong></td>
                        <td>SSO allows users to access multiple applications and services with a single set of credentials. Federated SSO extends this across different organizations and domains.</td>
                    </tr>
                    <tr>
                        <td><strong>Common Protocols</strong></td>
                        <td>SAML (Security Assertion Markup Language), OAuth 2.0, OpenID Connect, Kerberos.</td>
                    </tr>
                    <tr>
                        <td><strong>Appropriate</strong></td>
                        <td>Ease of use is particularly important, there is confidence in the OIDC provider's security posture and trustworthiness, users are comfortable with their connection to your service being known to the OIDC provider, and the expected downtime of the OIDC provider(s) is acceptable.</td>
                    </tr>
                    <tr>
                        <td><strong>Inappropriate</strong></td>
                        <td>Assurance of account security is critical, users do not want their connection to your service being known to the OIDC provider, and availability or security requirements are higher than those of the OIDC provider(s) available</td>
                    </tr>
                    <tr>
                        <td><strong>Example Scenario</strong></td>
                        <td>You are a major hotel chain with properties across the globe. Many of your customers have not stayed with you before, which means they would like to be able to sign-in quickly, and book a hotel stay without having to set up a new account.</td>
                    </tr>
                </tbody>
            </table>
        `
    },
    fido2: {
        header: "FIDO2",
        table: `
            <table>
                <thead>
                    <tr>
                        <th>Aspect</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Definition</strong></td>
                        <td>FIDO2 is a set of standards that enables passwordless authentication using public-key cryptography, biometrics, or security keys.</td>
                    </tr>
                    <tr>
                        <td><strong>Authentication Methods</strong></td>
                        <td>Hardware security keys, platform authenticators (Windows Hello, Touch ID, Face ID), USB/NFC/Bluetooth devices.</td>
                    </tr>
                    <tr>
                        <td><strong>Appropriate</strong></td>
                        <td>Security is more critical than ease of use, the organization has a security-conscious user base, who understand the need for high security, the organization is in a position to provide users with an authenticator app or security token, and is not reliant on users doing this, and if a user loses their access token, you have time to recover their accounts.</td>
                    </tr>
                    <tr>
                        <td><strong>Inappropriate</strong></td>
                        <td>Security isn't highly critical, and user experience and throughput are of equal importance, users don't consider security of the account important, and are deterred by the need for a second factor, users are unlikely to own a smartphone, or would be reluctant to purchase their own security tokens, and if a user loses their access token, you need to recover their accounts immediately.</td>
                    </tr>
                    <tr>
                        <td><strong>Example Scenarios</strong></td>
                        <td>As a major video gaming company running multiple online games, your customers' accounts hold real world value in digital assets (such as virtual items, levels, and in-game currency). There have been cases where cyber criminals have used leaked password databases to hack individual accounts and have stolen these digital assets from legitimate users, causing reputational damage to your company. The company decides to manufacture branded FIDO2 USB tokens and provide them to users who have attained a high level. This will encourage users to use them more often, as it can be seen as a status symbol.</td>
                    </tr>
                </tbody>
            </table>
        `
    },
    magic: {
        header: "Magic Links / OTP",
        table: `
            <table>
                <thead>
                    <tr>
                        <th>Aspect</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Definition</strong></td>
                        <td>Magic links are unique, time-limited URLs sent via email or SMS. OTP (One-Time Passwords) are temporary codes generated for single-use authentication.</td>
                    </tr>
                    <tr>
                        <td><strong>Delivery Methods</strong></td>
                        <td>Email magic links, SMS OTP codes, authenticator app time-based codes (TOTP), push notifications with codes.</td>
                    </tr>
                    <tr>
                        <td><strong>Appropriate</strong></td>
                        <td>Security isn’t highly critical, and user experience and throughput is of equal importance, users are willing to provide an additional means of contact, such as email or phone number, and users are likely to be confident using mobile devices, and able to identify an unexpected or false request.</td>
                    </tr>
                    <tr>
                        <td><strong>Inappropriate</strong></td>
                        <td>Security is the most important factor, and the security posture of the mobile network or email provider is inappropriate, users are reluctant to provide an additional means of contact, such as email or phone number, or users are unlikely to be confident using mobile devices, and users aren't confident using mobile devices, and are unlikely to understand authentication messages.</td>
                    </tr>
                    <tr>
                        <td><strong>Example Scenarios</strong></td>
                        <td>You run a market comparison site. Your customers use your website a couple of times a year when they need to look for the best deals on insurance, utilities or broadband. Since they don't use your site frequently, you decide to implement magic links so they can log on quickly without having to remember a password.</td>
                    </tr>
                </tbody>
            </table>
        `
    }
};

function showAuthContent(type) {
    const content = authContent[type];
    if (!content) return;
    
    const box = document.getElementById('auth-content-box');
    box.classList.remove('show');
    void box.offsetWidth; // Force reflow
    
    document.getElementById('auth-content-header').textContent = content.header;
    document.getElementById('auth-content-table').innerHTML = content.table;
    
    box.classList.add('show');
}

// Add event listener to the authentication select
const authSelect = document.getElementById('auth-select');
if (authSelect) {
    authSelect.addEventListener('change', function() {
        if (this.value) {
            showAuthContent(this.value);
        }
    });
}

// Sign In Form Handler
document.getElementById('signin-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const resultDiv = document.getElementById('signin-result');

    resultDiv.innerHTML = '<p style="color: #30B852;">Sending OTP...</p>';

    try {
        const response = await fetch('/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">Error: Server returned invalid response</p>`;
            return;
        }

        if (response.ok && data.success) {
            resultDiv.innerHTML = `<p style="color: #30B852;">OTP sent successfully to ${email}!</p>`;
            document.getElementById('otp-section').style.display = 'block';
            document.getElementById('email').value = '';
        } else {
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">Error: ${data.error || 'Failed to send OTP'}</p>`;
        }
    } catch (error) {
        console.error('Network error:', error);
        resultDiv.innerHTML = `<p style="color: #ff6b6b;">Network error: ${error.message}</p>`;
    }
});

// OTP Verification Form Handler
document.getElementById('otp-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const otp = document.getElementById('otp').value;
    const resultDiv = document.getElementById('signin-result');

    // Clear previous result
    resultDiv.innerHTML = '<p style="color: #30B852;">Verifying OTP...</p>';

    try {
        const response = await fetch('/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ otp: otp })
        });

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">Error: Server returned invalid response</p>`;
            return;
        }

        if (response.ok && data.success) {
            resultDiv.innerHTML = `<p style="color: #30B852;">OTP verified successfully! Welcome!</p>`;
            document.getElementById('otp-section').style.display = 'none';
            document.getElementById('otp').value = '';
        } else {
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">Invalid OTP. Please try again.</p>`;
        }
    } catch (error) {
        console.error('Network error:', error);
        resultDiv.innerHTML = `<p style="color: #ff6b6b;">Error: ${error.message}</p>`;
    }
});

animate();