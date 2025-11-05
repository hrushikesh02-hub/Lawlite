from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import smtplib
from email.message import EmailMessage
import random
from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = "hrushikeshnikhilthombare"
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:Lawlite%4007@localhost/lawlite"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False  # Set to True in production with HTTPS

# CORS setup for frontend on 5500
CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5500"])

db = SQLAlchemy(app)

# ===== User Model =====
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(120), nullable=False)
    last_name = db.Column(db.String(120), nullable=False)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    phone = db.Column(db.String(30))
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    otp = db.Column(db.String(6), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        """Convert user object to dictionary for JSON response"""
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "age": self.age,
            "gender": self.gender,
            "phone": self.phone,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# ===== Send OTP Email =====
def send_otp_email(to_email, otp):
    try:
        EMAIL_ADDRESS = "officiallawlite07@gmail.com"       # Replace with your Gmail
        EMAIL_PASSWORD = "ataj ympa drkb ujix"             # Gmail App Password

        msg = EmailMessage()
        msg.set_content(f"Your OTP for Lawlite registration is: {otp}\n\nThis OTP will expire in 10 minutes.")
        msg["Subject"] = "Lawlite OTP Verification"
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)
        print(f"OTP sent successfully to {to_email}")
        return True
    except Exception as e:
        print("Email sending failed:", e)
        return False

# ===== Routes =====
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "LawLite Flask Server is running!",
        "endpoints": {
            "register": "/register (POST)",
            "verify-otp": "/verify-otp (POST)", 
            "login": "/login (POST)",
            "check-auth": "/check-auth (GET)",
            "user": "/user (GET, PUT)",
            "logout": "/logout (POST)"
        }
    })

# ----- Register -----
@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        print("Registration data received:", data)
        
        # Validate required fields
        required_fields = ["first_name", "last_name", "email", "password"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Validate email format
        email = data["email"].strip().lower()
        if "@" not in email or "." not in email:
            return jsonify({"error": "Invalid email format"}), 400

        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "Email already registered"}), 409

        # Validate password length
        if len(data["password"]) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400

        # Hash password
        hashed_pw = generate_password_hash(data["password"])
        
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        print(f"Generated OTP for {email}: {otp}")

        # Create new user
        new_user = User(
            first_name=data["first_name"].strip(),
            last_name=data["last_name"].strip(),
            age=data.get("age"),
            gender=data.get("gender"),
            phone=data.get("phone"),
            email=email,
            password=hashed_pw,
            otp=otp
        )

        db.session.add(new_user)
        db.session.commit()
        print(f"User created with ID: {new_user.id}")

        # Send OTP email
        if not send_otp_email(email, otp):
            # Rollback if email sending fails
            db.session.delete(new_user)
            db.session.commit()
            return jsonify({"error": "Failed to send OTP email. Please try again."}), 500

        return jsonify({
            "message": "User registered successfully. OTP sent to email.",
            "user_id": new_user.id,
            "email": email
        }), 201

    except Exception as e:
        print("Register Error:", e)
        db.session.rollback()
        return jsonify({"error": "Internal Server Error"}), 500

# ----- Verify OTP -----
@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        otp_input = data.get("otp", "").strip()
        
        print(f"OTP verification attempt for: {email}")

        if not email or not otp_input:
            return jsonify({"error": "Email and OTP required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        if user.otp != otp_input:
            return jsonify({"error": "Invalid OTP"}), 401

        # OTP verified successfully
        user.otp = None
        db.session.commit()
        
        print(f"OTP verified successfully for: {email}")
        
        return jsonify({
            "message": "OTP verified successfully",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        print("OTP Verification Error:", e)
        db.session.rollback()
        return jsonify({"error": "Internal Server Error"}), 500

# ----- Login -----
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        
        print(f"Login attempt for: {email}")

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        if not check_password_hash(user.password, password):
            return jsonify({"error": "Invalid credentials"}), 401

        # Check if OTP is still pending (user not fully verified)
        if user.otp is not None:
            return jsonify({"error": "Please verify your email with OTP first"}), 403

        # Login successful - set session
        session["user_id"] = user.id
        session.permanent = True
        
        print(f"Login successful for user: {user.id}")
        
        return jsonify({
            "message": "Login successful",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        print("Login Error:", e)
        return jsonify({"error": "Internal Server Error"}), 500

# ----- Check Authentication -----
@app.route("/check-auth", methods=["GET"])
def check_auth():
    try:
        print("Checking authentication...")
        print("Session data:", dict(session))
        
        if "user_id" in session:
            user_id = session["user_id"]
            user = User.query.get(user_id)
            
            if user:
                print(f"User authenticated: {user.email}")
                return jsonify({
                    "authenticated": True,
                    "user": user.to_dict()
                }), 200
        
        print("No active session found")
        return jsonify({"authenticated": False}), 200
        
    except Exception as e:
        print("Auth check error:", e)
        return jsonify({"authenticated": False}), 200

# ----- Get User Profile -----
@app.route("/user", methods=["GET"])
def get_user():
    try:
        if "user_id" not in session:
            return jsonify({"error": "Not authenticated"}), 401
            
        user_id = session["user_id"]
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        print(f"Returning user data for: {user.email}")
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        print("Get user error:", e)
        return jsonify({"error": "Internal Server Error"}), 500

# ----- Update User Profile -----
@app.route("/user", methods=["PUT"])
def update_user():
    try:
        if "user_id" not in session:
            return jsonify({"error": "Not authenticated"}), 401
            
        user_id = session["user_id"]
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        data = request.get_json()
        print(f"Updating user {user_id} with data:", data)
        
        # Update fields if provided
        update_fields = []
        
        if "first_name" in data and data["first_name"]:
            user.first_name = data["first_name"].strip()
            update_fields.append("first_name")
            
        if "last_name" in data and data["last_name"]:
            user.last_name = data["last_name"].strip()
            update_fields.append("last_name")
            
        if "email" in data and data["email"]:
            new_email = data["email"].strip().lower()
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({"error": "Email already in use"}), 409
            user.email = new_email
            update_fields.append("email")
            
        if "age" in data:
            user.age = data["age"] if data["age"] else None
            update_fields.append("age")
            
        if "gender" in data:
            user.gender = data["gender"] if data["gender"] else None
            update_fields.append("gender")
            
        if "phone" in data:
            user.phone = data["phone"] if data["phone"] else None
            update_fields.append("phone")
            
        db.session.commit()
        
        print(f"User {user_id} updated successfully. Updated fields: {update_fields}")
        
        return jsonify({
            "message": "Profile updated successfully",
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        print("Update user error:", e)
        db.session.rollback()
        return jsonify({"error": "Internal Server Error"}), 500

# ----- Logout -----
@app.route("/logout", methods=["POST"])
def logout():
    try:
        user_id = session.pop("user_id", None)
        print(f"User {user_id} logged out")
        
        return jsonify({"message": "Logged out successfully"}), 200
        
    except Exception as e:
        print("Logout error:", e)
        return jsonify({"error": "Internal Server Error"}), 500

# ----- Resend OTP -----
@app.route("/resend-otp", methods=["POST"])
def resend_otp():
    try:
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        
        if not email:
            return jsonify({"error": "Email required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Generate new OTP
        new_otp = str(random.randint(100000, 999999))
        user.otp = new_otp
        db.session.commit()
        
        print(f"Resent OTP for {email}: {new_otp}")

        # Send new OTP email
        if not send_otp_email(email, new_otp):
            return jsonify({"error": "Failed to send OTP email"}), 500

        return jsonify({"message": "OTP resent successfully"}), 200

    except Exception as e:
        print("Resend OTP Error:", e)
        db.session.rollback()
        return jsonify({"error": "Internal Server Error"}), 500

# ----- Health Check -----
@app.route("/health", methods=["GET"])
def health_check():
    try:
        # Test database connection
        User.query.limit(1).all()
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }), 500

# ===== Error Handlers =====
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# ===== Run App =====
if __name__ == "__main__":
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully")
            print("Available endpoints:")
            print("  GET  / - Server info")
            print("  POST /register - User registration")
            print("  POST /verify-otp - OTP verification") 
            print("  POST /login - User login")
            print("  GET  /check-auth - Check authentication")
            print("  GET  /user - Get user profile")
            print("  PUT  /user - Update user profile")
            print("  POST /logout - User logout")
            print("  POST /resend-otp - Resend OTP")
            print("  GET  /health - Health check")
        except Exception as e:
            print("Database initialization error:", e)
    
    print("Starting LawLite server on http://127.0.0.1:5000")
    app.run(debug=True, host="127.0.0.1", port=5000)