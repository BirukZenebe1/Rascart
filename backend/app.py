from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables (skip .env in Lambda to avoid overriding AWS env vars)
if not os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    load_dotenv()

# Initialize Flask app
frontend_build_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build')
app = Flask(__name__, static_folder=frontend_build_dir, static_url_path='/')
CORS(app)  # Enable CORS for all routes

# Configure MongoDB
mongo_uri = os.environ.get("MONGO_URI")
if not mongo_uri and os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    raise RuntimeError("MONGO_URI is required in Lambda environment")
if not mongo_uri:
    mongo_uri = "mongodb://localhost:27017/personashop"
if "serverSelectionTimeoutMS" not in mongo_uri:
    separator = "&" if "?" in mongo_uri else "?"
    mongo_uri = f"{mongo_uri}{separator}serverSelectionTimeoutMS=5000&connectTimeoutMS=5000"
app.config["MONGO_URI"] = mongo_uri
mongo = PyMongo(app)

# Test MongoDB connection (skip blocking ping in Lambda)
try:
    if not os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        mongo.db.command('ping')
        print("MongoDB connected successfully!")
except Exception as e:
    # Do not exit on startup; allow app to serve health endpoints.
    print(f"MongoDB connection failed: {e}")

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
from promos import promos_bp
from orders import orders_bp
from messages import messages_bp

# Attach MongoDB to blueprints
auth_bp.mongo = mongo
style_bp.mongo = mongo
product_bp.mongo = mongo
seller_bp.mongo = mongo
promos_bp.mongo = mongo
orders_bp.mongo = mongo
messages_bp.mongo = mongo

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(style_bp, url_prefix='/api/style')
app.register_blueprint(product_bp, url_prefix='/api/products')
app.register_blueprint(seller_bp, url_prefix='/api/seller')
app.register_blueprint(promos_bp, url_prefix='/api/promos')
app.register_blueprint(orders_bp, url_prefix='/api/orders')
app.register_blueprint(messages_bp, url_prefix='/api/messages')

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

# Serve React frontend when built
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path.startswith('api/'):
        return jsonify({"error": "API route not found"}), 404

    # Serve static asset if it exists in build directory.
    target_path = os.path.join(frontend_build_dir, path)
    if path and os.path.exists(target_path):
        return send_from_directory(frontend_build_dir, path)

    index_path = os.path.join(frontend_build_dir, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(frontend_build_dir, 'index.html')

    return jsonify({"message": "Frontend build not found. Build the frontend to serve UI."}), 404

# Start the server
if __name__ == '__main__':
    app.run(debug=True, port=int(os.environ.get("PORT", 5001)))
