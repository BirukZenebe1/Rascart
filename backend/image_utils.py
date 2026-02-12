import os
import base64
from datetime import datetime
from werkzeug.utils import secure_filename

# Allowed image extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    """Check if file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_base64_image(base64_string, filename_prefix='profile'):
    """
    Save a base64 encoded image to the uploads folder
    Returns the filename if successful, None otherwise
    """
    try:
        # Create uploads directory if it doesn't exist
        upload_folder = os.path.join(os.path.dirname(__file__), 'uploads', 'profiles')
        os.makedirs(upload_folder, exist_ok=True)
        
        # Remove data URL prefix if present
        if 'base64,' in base64_string:
            base64_string = base64_string.split('base64,')[1]
        
        # Decode base64 string
        image_data = base64.b64decode(base64_string)
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{filename_prefix}_{timestamp}.png"
        filepath = os.path.join(upload_folder, filename)
        
        # Save image
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        # Return the relative path that can be served
        return f"/uploads/profiles/{filename}"
    
    except Exception as e:
        print(f"Error saving image: {e}")
        return None

def delete_image(image_path):
    """Delete an image file"""
    try:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting image: {e}")
        return False