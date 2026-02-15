from datetime import datetime

def create_user(username, email, password_hash, user_type='buyer'):
    """
    Create a new user
    user_type: 'buyer' or 'seller'
    """
    return {
        "username": username,
        "email": email,
        "password": password_hash,
        "user_type": user_type,
        "is_verified": False,
        "verification_code": None,
        "verification_expires": None,
        "reset_code": None,
        "reset_expires": None,
        "personalization_state": "default",
        "is_personalized": False,
        "profile_photo": None,
        "created_at": datetime.now(),
        "style_profile": None,
        "preferred_payment_method": "",
        "payment_verified": False,
        "cart": [],
        "orders": [],
        "seller_profile": None,
        "is_active": True
    }

def create_order(user_id, items, total, payment_method, promo_code=None, discount=0):
    return {
        "user_id": user_id,
        "items": items,
        "total": total,
        "payment_method": payment_method,
        "promo_code": promo_code,
        "discount": discount,
        "status": "placed",
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

def create_promo_code(code, discount_type, discount_value, expires_at=None, usage_limit=None):
    return {
        "code": code.upper(),
        "discount_type": discount_type,  # "percent" or "amount"
        "discount_value": discount_value,
        "expires_at": expires_at,
        "usage_limit": usage_limit,
        "used_count": 0,
        "is_active": True,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

def create_message_thread(product_id, buyer_id, seller_id):
    return {
        "product_id": product_id,
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "messages": [],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

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
        "verified": False,
        "rating": 0.0,
        "total_sales": 0,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

def create_product(
    seller_id,
    name,
    description,
    price,
    image_url,
    categories,
    attributes,
    stock=0,
    product_type='',
    preferred_contact='',
    payment_method=''
):
    """
    Create a new product
    seller_id: The ObjectId of the seller who owns this product
    """
    return {
        "seller_id": seller_id,
        "name": name,
        "description": description,
        "price": price,
        "image_url": image_url,
        "product_type": product_type,
        "preferred_contact": preferred_contact,
        "payment_method": payment_method,
        "categories": categories,
        "attributes": attributes,
        "stock": stock,
        "is_active": True,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "views": 0,
        "sales_count": 0
    }

def create_style_profile(user_id, preferences=None, ai_analysis=None, style_board=None):
    """
    Create a new style profile for a user
    """
    return {
        "user_id": user_id,
        "preferences": preferences or {},
        "ai_analysis": ai_analysis or {},
        "style_board": style_board or [],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
