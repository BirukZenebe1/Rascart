from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure MongoDB
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/personashop")
mongo = PyMongo(app)

# Test MongoDB connection
try:
    mongo.db.command('ping')
    print("MongoDB connected successfully!")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    exit(1)

# Configure JWT
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret-key-change-in-production")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# Import blueprints
from auth import auth_bp
from style_profile import style_bp
from product import product_bp
from seller import seller_bp

# Attach MongoDB to blueprints
auth_bp.mongo = mongo
style_bp.mongo = mongo
product_bp.mongo = mongo
seller_bp.mongo = mongo

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(style_bp, url_prefix='/api/style')
app.register_blueprint(product_bp, url_prefix='/api/products')
app.register_blueprint(seller_bp, url_prefix='/api/seller')

# Test route
@app.route('/api/test', methods=['GET'])
def test_route():
    return jsonify({"message": "Backend is working!"})

# Database test route
@app.route('/api/db-test', methods=['GET'])
def db_test():
    try:
        # Try to count users
        user_count = mongo.db.users.count_documents({})
        return jsonify({
            "message": "Database connection successful!",
            "user_count": user_count
        })
    except Exception as e:
        return jsonify({
            "error": "Database connection failed",
            "details": str(e)
        }), 500

# Start the server
if __name__ == '__main__':
    app.run(debug=True, port=5001)