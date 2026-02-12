import os
from flask_pymongo import PyMongo

class DatabaseConfig:
    """
    Configuration for separate buyer and seller databases
    """
    def __init__(self, app):
        # Get MongoDB connection details from environment
        mongo_host = os.environ.get("MONGO_HOST", "localhost")
        mongo_port = os.environ.get("MONGO_PORT", "27017")
        
        # Configure Buyer Database
        app.config["MONGO_URI_BUYERS"] = os.environ.get(
            "MONGO_URI_BUYERS",
            f"mongodb://{mongo_host}:{mongo_port}/personashop_buyers"
        )
        
        # Configure Seller Database
        app.config["MONGO_URI_SELLERS"] = os.environ.get(
            "MONGO_URI_SELLERS",
            f"mongodb://{mongo_host}:{mongo_port}/personashop_sellers"
        )
        
        # Initialize database connections
        self.buyers_db = PyMongo(app, uri=app.config["MONGO_URI_BUYERS"])
        self.sellers_db = PyMongo(app, uri=app.config["MONGO_URI_SELLERS"])
        
    def get_buyers_db(self):
        """Get buyer database connection"""
        return self.buyers_db.db
    
    def get_sellers_db(self):
        """Get seller database connection"""
        return self.sellers_db.db
    
    def test_connections(self):
        """Test both database connections"""
        try:
            # Test buyers database
            self.buyers_db.db.command('ping')
            print("✓ Buyers database connected successfully")
            
            # Test sellers database
            self.sellers_db.db.command('ping')
            print("✓ Sellers database connected successfully")
            
            return True
        except Exception as e:
            print(f"✗ Database connection error: {e}")
            return False