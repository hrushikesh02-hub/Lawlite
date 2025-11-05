let currentView = 'login';
let registeredEmail = ''; // For OTP verification

// ----- Password Toggle -----
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ----- Login -----
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Signing In<span class="loading"></span>';

    try {
        const response = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.status === 200) {
            showNotification(result.message || 'Login successful!', 'success');
            
            // Update session manager with user data
            if (typeof sessionManager !== 'undefined' && result.user) {
                await sessionManager.login(result.user);
            } else {
                // Fallback: Get user data if not provided in login response
                const userResponse = await fetch('http://127.0.0.1:5000/user', {
                    credentials: 'include'
                });
                
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    if (typeof sessionManager !== 'undefined') {
                        await sessionManager.login(userData);
                    }
                }
            }
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = '/Frontend/home/index.html';
            }, 1500);
            
        } else {
            showNotification(result.error || 'Login failed', 'error');
        }
    } catch (err) {
        console.error('Login error:', err);
        showNotification('An error occurred while logging in', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
    }
}

// ----- Register -----
async function handleRegister() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const ageValue = document.getElementById('age').value;
    const age = ageValue ? parseInt(ageValue) : null;
    const gender = document.getElementById('gender').value || null;
    const phone = document.getElementById('phone').value.trim() || null;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    const btn = document.getElementById('registerBtn');

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    if (password !== confirmPassword) { 
        showNotification('Passwords do not match', 'error'); 
        return; 
    }
    if (!agreeTerms) { 
        showNotification('Please agree to the Terms & Conditions', 'error'); 
        return; 
    }

    const registerData = { 
        first_name: firstName, 
        last_name: lastName, 
        age, 
        gender, 
        phone, 
        email, 
        password 
    };

    btn.disabled = true;
    btn.innerHTML = 'Creating Account<span class="loading"></span>';

    try {
        const response = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });
        const result = await response.json();

        if (response.status === 201) {
            registeredEmail = email; // Save email for OTP modal
            document.getElementById('verifyEmailAddress').textContent = email;
            openVerificationModal();
            showNotification('Registration successful! Please verify your email.', 'success');
        } else {
            showNotification(result.error || 'Registration failed', 'error');
        }
    } catch (err) {
        console.error('Register error:', err);
        showNotification('An error occurred while registering', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
    }
}

// ----- Switch Forms -----
function switchToRegister() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('registerContainer').classList.remove('hidden');
    currentView = 'register';
}

function switchToLogin() {
    document.getElementById('registerContainer').classList.add('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
    currentView = 'login';
    resetRegistrationForm();
}

function resetRegistrationForm() {
    const fields = ['firstName', 'lastName', 'age', 'gender', 'phone', 'email', 'password', 'confirmPassword'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const agreeEl = document.getElementById('agreeTerms');
    if (agreeEl) agreeEl.checked = false;
    const strengthDiv = document.getElementById('passwordStrength');
    if (strengthDiv) strengthDiv.style.display = 'none';
    const matchDiv = document.getElementById('passwordMatch');
    if (matchDiv) matchDiv.style.display = 'none';
}

// ----- Password Validation -----
function formatPhoneInput() {
    const input = document.getElementById('phone');
    if (input) input.value = input.value.replace(/\D/g, '').slice(0, 10);
}

function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthDiv = document.getElementById('passwordStrength');
    if (!strengthDiv) return;

    if (!password) { strengthDiv.style.display = 'none'; return; }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    strengthDiv.style.display = 'block';
    
    if (strength < 3) {
        strengthDiv.className = 'password-strength weak';
        strengthDiv.textContent = '⚠ Weak password';
    } else if (strength < 5) {
        strengthDiv.className = 'password-strength medium';
        strengthDiv.textContent = '✓ Medium password';
    } else {
        strengthDiv.className = 'password-strength strong';
        strengthDiv.textContent = '✓ Strong password';
    }
}

function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchDiv = document.getElementById('passwordMatch');
    if (!matchDiv) return;

    if (!confirmPassword) { 
        matchDiv.style.display = 'none'; 
        return; 
    }

    matchDiv.style.display = 'block';
    
    if (password === confirmPassword) {
        matchDiv.className = 'password-match success';
        matchDiv.textContent = '✓ Passwords match';
    } else {
        matchDiv.className = 'password-match error';
        matchDiv.textContent = '✗ Passwords do not match';
    }
}

// ----- OTP Modal -----
function openVerificationModal() {
    document.getElementById('verificationModal').classList.add('active');
    document.getElementById('otpInput').focus();
}

function closeVerificationModal() {
    document.getElementById('verificationModal').classList.remove('active');
    document.getElementById('otpInput').value = '';
    document.getElementById('otpError').style.display = 'none';
}

// ----- Verify OTP -----
async function verifyEmail() {
    const otp = document.getElementById('otpInput').value.trim();
    const otpError = document.getElementById('otpError');
    const verifyBtn = document.getElementById('verifyBtn');

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        otpError.textContent = 'Please enter a valid 6-digit code.';
        otpError.style.display = 'block';
        return;
    }

    verifyBtn.disabled = true;
    verifyBtn.innerHTML = 'Verifying<span class="loading"></span>';

    try {
        const response = await fetch('http://127.0.0.1:5000/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: registeredEmail, otp })
        });
        const result = await response.json();

        if (response.status === 200) {
            showNotification(result.message || 'Email verified successfully!', 'success');
            closeVerificationModal();
            
            // Auto-login after successful verification
            const password = document.getElementById('password').value;
            if (password) {
                showNotification('Auto-logging you in...', 'info');
                setTimeout(() => {
                    document.getElementById('loginEmail').value = registeredEmail;
                    document.getElementById('loginPassword').value = password;
                    handleLogin();
                }, 1000);
            } else {
                switchToLogin();
            }
        } else {
            otpError.textContent = result.error || 'Invalid OTP. Please try again.';
            otpError.style.display = 'block';
        }
    } catch (err) {
        console.error('OTP verification error:', err);
        otpError.textContent = 'An error occurred. Please try again.';
        otpError.style.display = 'block';
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = 'Verify Email';
    }
}

// ----- Resend OTP -----
async function resendVerificationCode() {
    const resendBtn = document.getElementById('resendBtn');
    const countdownEl = document.getElementById('resendCountdown');
    
    resendBtn.disabled = true;
    resendBtn.innerHTML = 'Resending<span class="loading"></span>';

    try {
        const response = await fetch('http://127.0.0.1:5000/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: registeredEmail })
        });
        const result = await response.json();

        if (response.status === 200) {
            showNotification(result.message || 'OTP resent successfully!', 'success');
            
            // Start countdown timer (30 seconds)
            let countdown = 30;
            if (countdownEl) {
                countdownEl.style.display = 'inline';
                countdownEl.textContent = ` (${countdown}s)`;
                
                const timer = setInterval(() => {
                    countdown--;
                    countdownEl.textContent = ` (${countdown}s)`;
                    
                    if (countdown <= 0) {
                        clearInterval(timer);
                        countdownEl.style.display = 'none';
                        resendBtn.disabled = false;
                        resendBtn.innerHTML = 'Resend Code';
                    }
                }, 1000);
            }
        } else {
            showNotification(result.error || 'Failed to resend OTP', 'error');
            resendBtn.disabled = false;
            resendBtn.innerHTML = 'Resend Code';
        }
    } catch (err) {
        console.error('Resend OTP error:', err);
        showNotification('An error occurred while resending OTP', 'error');
        resendBtn.disabled = false;
        resendBtn.innerHTML = 'Resend Code';
    }
}

// ----- Notification System -----
function showNotification(message, type) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .custom-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 10px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 400px;
            }
            .custom-notification.success {
                background: #10b981;
            }
            .custom-notification.error {
                background: #ef4444;
            }
            .custom-notification.warning {
                background: #f59e0b;
            }
            .custom-notification.info {
                background: #3b82f6;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: auto;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || 'ℹ';
}

// ----- Enter Key Submit -----
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        if (currentView === 'login') {
            handleLogin();
        } else if (currentView === 'register') {
            handleRegister();
        } else if (document.getElementById('verificationModal').classList.contains('active')) {
            verifyEmail();
        }
    }
});

// ----- OTP Input Auto-focus and Auto-submit -----
function handleOtpInput() {
    const otpInput = document.getElementById('otpInput');
    const otpError = document.getElementById('otpError');
    
    // Clear error when user starts typing
    if (otpError.style.display === 'block') {
        otpError.style.display = 'none';
    }
    
    // Auto-submit when 6 digits are entered
    if (otpInput.value.length === 6 && /^\d+$/.test(otpInput.value)) {
        verifyEmail();
    }
}

// ----- Initialize Page -----
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page initialized');
    
    // Check if user is already logged in
    if (typeof sessionManager !== 'undefined' && sessionManager.isLoggedIn()) {
        showNotification('You are already logged in! Redirecting...', 'info');
        setTimeout(() => {
            window.location.href = '/Frontend/home/index.html';
        }, 2000);
    }
    
    // Setup OTP input listener
    const otpInput = document.getElementById('otpInput');
    if (otpInput) {
        otpInput.addEventListener('input', handleOtpInput);
    }
    
    // Setup modal close on outside click
    const verificationModal = document.getElementById('verificationModal');
    if (verificationModal) {
        verificationModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeVerificationModal();
            }
        });
    }
    
    // Setup escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && verificationModal.classList.contains('active')) {
            closeVerificationModal();
        }
    });
});

// ----- Enhanced Phone Input Formatting -----
function formatPhoneInput() {
    const input = document.getElementById('phone');
    if (!input) return;

    // Remove all non-numeric characters
    let value = input.value.replace(/[^0-9]/g, '');

    // Limit to 10 digits max
    value = value.slice(0, 10);

    input.value = value;
}


// ----- Age Validation -----
function validateAge() {
    const ageInput = document.getElementById('age');
    if (!ageInput) return;
    
    const age = parseInt(ageInput.value);
    if (age < 18) {
        showNotification('You must be at least 18 years old to register', 'warning');
        ageInput.value = '';
    } else if (age > 120) {
        showNotification('Please enter a valid age', 'warning');
        ageInput.value = '';
    }
}