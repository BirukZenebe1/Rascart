from flask import Blueprint, request, jsonify, send_from_directory
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import datetime
from models import create_user
from bson.objectid import ObjectId
from image_utils import save_base64_image, delete_image
from email_utils import send_email
import os
import random
import re
import secrets
import requests

# Initialize blueprint and bcrypt
auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()
GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"

def _issue_auth_response(user):
    expires = datetime.timedelta(days=1)
    access_token = create_access_token(
        identity=str(user['_id']),
        expires_delta=expires
    )
    return {
        "message": "Login successful",
        "token": access_token,
        "user_id": str(user['_id']),
        "username": user['username'],
        "email": user['email'],
        "user_type": user.get('user_type', 'buyer'),
        "profile_photo": user.get('profile_photo', None)
    }

def _generate_unique_username(email, preferred_username=None):
    base_username = preferred_username or (email.split('@')[0] if email else "user")
    base_username = re.sub(r'[^a-zA-Z0-9_]', '', base_username)[:18] or "user"
    candidate = base_username
    attempt = 0
    while auth_bp.mongo.db.users.find_one({'username': candidate}):
        attempt += 1
        candidate = f"{base_username}{attempt}"
        if attempt > 100:
            candidate = f"user{random.randint(1000, 9999)}"
            if not auth_bp.mongo.db.users.find_one({'username': candidate}):
                break
    return candidate

def _generate_code():
    return str(random.randint(100000, 999999))

def _send_verification_email(email, code):
    subject = "Your merkatoAI verification code"
    body_text = (
        "Use the verification code below to activate your merkatoAI account.\n\n"
        f"Verification code: {code}\n"
        "Expires in: 10 minutes\n\n"
        "If you did not request this, you can ignore this email."
    )
    body_html = (
        "<html><body style='font-family:Arial,sans-serif;color:#0f172a;'>"
        "<h2 style='margin-bottom:8px;'>Verify your merkatoAI account</h2>"
        "<p>Use the code below to complete your sign up:</p>"
        f"<p style='font-size:28px;font-weight:700;letter-spacing:4px;margin:14px 0;'>{code}</p>"
        "<p style='margin:0 0 12px;'>This code expires in <b>10 minutes</b>.</p>"
        "<p style='font-size:13px;color:#475569;'>If you did not request this, you can ignore this message.</p>"
        "</body></html>"
    )
    return send_email(email, subject, body_text, body_html=body_html)

def _send_reset_email(email, code):
    subject = "Your merkatoAI password reset code"
    body_text = (
        "You requested to reset your merkatoAI password.\n\n"
        f"Reset code: {code}\n"
        "Expires in: 10 minutes\n\n"
        "If you did not request a password reset, ignore this email and keep your account secure."
    )
    body_html = (
        "<html><body style='font-family:Arial,sans-serif;color:#0f172a;'>"
        "<h2 style='margin-bottom:8px;'>Reset your merkatoAI password</h2>"
        "<p>Use this one-time code to continue:</p>"
        f"<p style='font-size:28px;font-weight:700;letter-spacing:4px;margin:14px 0;'>{code}</p>"
        "<p style='margin:0 0 12px;'>This code expires in <b>10 minutes</b>.</p>"
        "<p style='font-size:13px;color:#475569;'>If you did not request this change, ignore this email.</p>"
        "</body></html>"
    )
    return send_email(email, subject, body_text, body_html=body_html)

# User Registration
@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not all(k in data for k in ['username', 'email', 'password']):
            return jsonify({"error": "Missing required fields"}), 400
        if not data.get('terms_accepted'):
            return jsonify({"error": "You must accept the terms and conditions"}), 400
        
        existing_user = auth_bp.mongo.db.users.find_one({'email': data['email']})
        if existing_user:
            return jsonify({"error": "Email already registered"}), 409
        
        existing_username = auth_bp.mongo.db.users.find_one({'username': data['username']})
        if existing_username:
            return jsonify({"error": "Username already taken"}), 409
        
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        user_type = data.get('user_type', 'buyer')
        if user_type not in ['buyer', 'seller']:
            user_type = 'buyer'
        
        new_user = create_user(
            username=data['username'],
            email=data['email'],
            password_hash=hashed_password,
            user_type=user_type
        )

        verification_code = _generate_code()
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
        new_user['verification_code'] = verification_code
        new_user['verification_expires'] = expires_at
        
        user_id = auth_bp.mongo.db.users.insert_one(new_user).inserted_id

        _send_verification_email(new_user['email'], verification_code)
        
        new_user.pop('password', None)
        new_user['_id'] = str(user_id)
        
        if 'created_at' in new_user:
            new_user['created_at'] = new_user['created_at'].isoformat()
        
        return jsonify({
            "message": "User registered. Verification code sent to email.",
            "user": new_user,
            "verification_required": True
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# User Login
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not all(k in data for k in ['email', 'password']):
            return jsonify({"error": "Missing email or password"}), 400
        
        user = auth_bp.mongo.db.users.find_one({'email': data['email']})
        
        if user and bcrypt.check_password_hash(user['password'], data['password']):
            if not user.get('is_verified'):
                return jsonify({"error": "Email not verified", "verification_required": True}), 403
            return jsonify(_issue_auth_response(user)), 200
        else:
            return jsonify({"error": "Invalid email or password"}), 401
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/oauth/google', methods=['POST'])
def oauth_google():
    try:
        data = request.get_json() or {}
        id_token = data.get('id_token') or data.get('credential')
        user_type = data.get('user_type', 'buyer')
        if user_type not in ['buyer', 'seller']:
            user_type = 'buyer'

        if not id_token:
            return jsonify({"error": "Google ID token is required"}), 400

        token_check = requests.get(
            GOOGLE_TOKENINFO_URL,
            params={"id_token": id_token},
            timeout=10
        )
        if token_check.status_code != 200:
            return jsonify({"error": "Invalid Google token"}), 401

        payload = token_check.json()
        expected_aud = os.environ.get('GOOGLE_CLIENT_ID', '').strip()
        if expected_aud and payload.get('aud') != expected_aud:
            return jsonify({"error": "Google token audience mismatch"}), 401

        email = payload.get('email', '').strip().lower()
        email_verified = str(payload.get('email_verified', 'false')).lower() == 'true'
        if not email or not email_verified:
            return jsonify({"error": "Google account email is not verified"}), 400

        user = auth_bp.mongo.db.users.find_one({'email': email})
        if user:
            updates = {
                'is_verified': True,
                'oauth_provider': 'google'
            }
            if not user.get('profile_photo') and payload.get('picture'):
                updates['profile_photo'] = payload.get('picture')
            auth_bp.mongo.db.users.update_one({'_id': user['_id']}, {'$set': updates})
            user = auth_bp.mongo.db.users.find_one({'_id': user['_id']})
            return jsonify(_issue_auth_response(user)), 200

        preferred_username = payload.get('name') or payload.get('given_name')
        username = _generate_unique_username(email, preferred_username)
        random_password = secrets.token_urlsafe(24)
        password_hash = bcrypt.generate_password_hash(random_password).decode('utf-8')

        new_user = create_user(
            username=username,
            email=email,
            password_hash=password_hash,
            user_type=user_type
        )
        new_user['is_verified'] = True
        new_user['oauth_provider'] = 'google'
        if payload.get('picture'):
            new_user['profile_photo'] = payload.get('picture')

        inserted_id = auth_bp.mongo.db.users.insert_one(new_user).inserted_id
        user = auth_bp.mongo.db.users.find_one({'_id': inserted_id})
        return jsonify(_issue_auth_response(user)), 200
    except requests.RequestException:
        return jsonify({"error": "Unable to verify Google token"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/oauth/config', methods=['GET'])
def oauth_config():
    google_client_id = os.environ.get('GOOGLE_CLIENT_ID', '').strip()
    return jsonify({
        "google_client_id": google_client_id,
        "google_enabled": bool(google_client_id),
        "apple_enabled": False
    }), 200

@auth_bp.route('/oauth/apple', methods=['POST'])
def oauth_apple():
    return jsonify({
        "error": "Apple Sign-In is not configured yet. Add Apple OAuth credentials and enable it in backend."
    }), 501

# Get current user profile
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    try:
        current_user_id = get_jwt_identity()
        user = auth_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user.pop('password', None)
        user['_id'] = str(user['_id'])
        
        if user.get('seller_profile'):
            user['seller_profile'] = str(user['seller_profile'])
        if user.get('style_profile'):
            user['style_profile'] = str(user['style_profile'])
        if user.get('orders'):
            user['orders'] = [str(order_id) for order_id in user['orders']]
        if user.get('verification_expires'):
            user['verification_expires'] = user['verification_expires'].isoformat()
        if user.get('reset_expires'):
            user['reset_expires'] = user['reset_expires'].isoformat()
        
        if 'created_at' in user:
            user['created_at'] = user['created_at'].isoformat()
        
        return jsonify({"user": user}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update current user profile
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        user_id = ObjectId(current_user_id)

        user = auth_bp.mongo.db.users.find_one({'_id': user_id})
        if not user:
            return jsonify({"error": "User not found"}), 404

        updates = {}

        if 'username' in data:
            username = (data.get('username') or '').strip()
            if not username:
                return jsonify({"error": "Username cannot be empty"}), 400
            existing_username = auth_bp.mongo.db.users.find_one({
                'username': username,
                '_id': {'$ne': user_id}
            })
            if existing_username:
                return jsonify({"error": "Username already taken"}), 409
            updates['username'] = username

        if 'email' in data and (data.get('email') or '').strip().lower() != (user.get('email') or '').strip().lower():
            return jsonify({"error": "Email address cannot be changed once set"}), 400

        if 'preferred_payment_method' in data:
            payment_method = (data.get('preferred_payment_method') or '').strip()
            allowed_methods = ['card', 'bank_transfer', 'mobile_money', 'cash_on_delivery', 'paypal']
            if payment_method and payment_method not in allowed_methods:
                return jsonify({"error": "Invalid payment method"}), 400
            updates['preferred_payment_method'] = payment_method
            updates['payment_verified'] = True if payment_method else False

        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400

        auth_bp.mongo.db.users.update_one({'_id': user_id}, {'$set': updates})

        updated_user = auth_bp.mongo.db.users.find_one({'_id': user_id})
        updated_user.pop('password', None)
        updated_user['_id'] = str(updated_user['_id'])

        if updated_user.get('seller_profile'):
            updated_user['seller_profile'] = str(updated_user['seller_profile'])
        if updated_user.get('style_profile'):
            updated_user['style_profile'] = str(updated_user['style_profile'])
        if updated_user.get('orders'):
            updated_user['orders'] = [str(order_id) for order_id in updated_user['orders']]
        if 'created_at' in updated_user:
            updated_user['created_at'] = updated_user['created_at'].isoformat()
        if updated_user.get('verification_expires'):
            updated_user['verification_expires'] = updated_user['verification_expires'].isoformat()
        if updated_user.get('reset_expires'):
            updated_user['reset_expires'] = updated_user['reset_expires'].isoformat()

        return jsonify({
            "message": "Profile updated successfully",
            "user": updated_user
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Upload profile photo
@auth_bp.route('/profile/photo', methods=['POST'])
@jwt_required()
def upload_profile_photo():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400
        
        user = auth_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user.get('profile_photo'):
            old_photo_path = os.path.join(
                os.path.dirname(__file__),
                user['profile_photo'].lstrip('/')
            )
            delete_image(old_photo_path)
        
        filename_prefix = f"user_{current_user_id}"
        image_path = save_base64_image(data['image'], filename_prefix)
        
        if not image_path:
            return jsonify({"error": "Failed to save image"}), 500
        
        auth_bp.mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {'profile_photo': image_path}}
        )
        
        return jsonify({
            "message": "Profile photo updated successfully",
            "profile_photo": image_path
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Delete profile photo
@auth_bp.route('/profile/photo', methods=['DELETE'])
@jwt_required()
def delete_profile_photo():
    try:
        current_user_id = get_jwt_identity()
        
        user = auth_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user.get('profile_photo'):
            photo_path = os.path.join(
                os.path.dirname(__file__),
                user['profile_photo'].lstrip('/')
            )
            delete_image(photo_path)
        
        auth_bp.mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$unset': {'profile_photo': ''}}
        )
        
        return jsonify({"message": "Profile photo deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Serve uploaded images
@auth_bp.route('/uploads/<path:filename>')
def serve_upload(filename):
    upload_folder = os.path.join(os.path.dirname(__file__), 'uploads')
    return send_from_directory(upload_folder, filename)

# Verify email
@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    try:
        data = request.get_json() or {}
        email = data.get('email')
        code = data.get('code')
        if not email or not code:
            return jsonify({"error": "Email and code are required"}), 400

        user = auth_bp.mongo.db.users.find_one({'email': email})
        if not user:
            return jsonify({"error": "User not found"}), 404

        if user.get('is_verified'):
            return jsonify({"message": "Email already verified"}), 200

        if user.get('verification_code') != code:
            return jsonify({"error": "Invalid code"}), 400

        expires = user.get('verification_expires')
        if expires and expires < datetime.datetime.utcnow():
            return jsonify({"error": "Code expired"}), 400

        auth_bp.mongo.db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'is_verified': True}, '$unset': {'verification_code': '', 'verification_expires': ''}}
        )
        return jsonify({"message": "Email verified successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Forgot password
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json() or {}
        email = data.get('email')
        if not email:
            return jsonify({"error": "Email is required"}), 400

        user = auth_bp.mongo.db.users.find_one({'email': email})
        if not user:
            return jsonify({"error": "User not found"}), 404

        reset_code = _generate_code()
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
        auth_bp.mongo.db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'reset_code': reset_code, 'reset_expires': expires_at}}
        )
        _send_reset_email(email, reset_code)
        return jsonify({"message": "Reset code sent"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Reset password
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json() or {}
        email = data.get('email')
        code = data.get('code')
        new_password = data.get('new_password')
        if not email or not code or not new_password:
            return jsonify({"error": "Email, code, and new password are required"}), 400

        user = auth_bp.mongo.db.users.find_one({'email': email})
        if not user:
            return jsonify({"error": "User not found"}), 404
        if user.get('reset_code') != code:
            return jsonify({"error": "Invalid code"}), 400
        expires = user.get('reset_expires')
        if expires and expires < datetime.datetime.utcnow():
            return jsonify({"error": "Code expired"}), 400

        hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        auth_bp.mongo.db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'password': hashed_password, 'is_verified': True}, '$unset': {'reset_code': '', 'reset_expires': '', 'verification_code': '', 'verification_expires': ''}}
        )
        return jsonify({"message": "Password updated"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
