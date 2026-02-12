from datetime import datetime

# User model structure
def create_user(username, email, password_hash, user_type='buyer'):
    """
    Create a new user
    user_type: 'buyer' or 'seller'
    """
    return {
        "username": username,
        "email": email,
        "password": password_hash,
        "user_type": user_type,  # 'buyer' or 'seller'
        "profile_photo": None,  # Path to profile photo
        "created_at": datetime.now(),
        "style_profile": None,  # Only for buyers
        "cart": [],  # Only for buyers
        "orders": [],  # Only for buyers
        "seller_profile": None,  # Only for sellers
        "is_active": True
    }

# Seller profile model structure
def create_seller_profile(user_id, business_name, business_description='', business_email='', phone=''):
    """
    Create a seller profile
    """
    return {
        "user_id": user_id,
        "business_name": business_name,
        "business_description": business_description,
        "business_email": business_email,
        "phone": phone,
        "verified": False,  # Admin verification status
        "rating": 0.0,
        "total_sales": 0,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

# Product model structure - NOW WITH SELLER
def create_product(seller_id, name, description, price, image_url, categories, attributes, stock=0):
    """
    Create a new product
    seller_id: The ObjectId of the seller who owns this product
    """
    return {
        "seller_id": seller_id,  # Reference to seller
        "name": name,
        "description": description,
        "price": price,
        "image_url": image_url,
        "categories": categories,
        "attributes": attributes,
        "stock": stock,
        "is_active": True,  # Sellers can deactivate products
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "views": 0,
        "sales_count": 0
    }

# Style profile model structure
def create_style_profile(user_id, preferences=None, ai_analysis=None, style_board=None):
    """
    Create a new style profile for a user
    preferences: Dict of user's style preferences from questionnaire
    ai_analysis: OpenAI's analysis of the user's style
    style_board: A collection of visual elements representing the style
    """
    return {
        "user_id": user_id,
        "preferences": preferences or {},
        "ai_analysis": ai_analysis or {},
        "style_board": style_board or [],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }