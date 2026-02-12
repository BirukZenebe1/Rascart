"""
Migration script to separate existing single database into buyer and seller databases

WARNING: Backup your database before running this script!

Usage:
    python migrate_to_separate_dbs.py
"""

from pymongo import MongoClient
from datetime import datetime

# Configuration
OLD_DB_URI = "mongodb://localhost:27017/personashop"
BUYERS_DB_URI = "mongodb://localhost:27017/personashop_buyers"
SELLERS_DB_URI = "mongodb://localhost:27017/personashop_sellers"

def migrate_data():
    print("=" * 60)
    print("DATABASE MIGRATION: Single DB → Separate Buyer/Seller DBs")
    print("=" * 60)
    print()
    
    # Connect to databases
    print("📡 Connecting to databases...")
    old_client = MongoClient(OLD_DB_URI)
    old_db = old_client.get_database()
    
    buyers_client = MongoClient(BUYERS_DB_URI)
    buyers_db = buyers_client.get_database()
    
    sellers_client = MongoClient(SELLERS_DB_URI)
    sellers_db = sellers_client.get_database()
    
    print("✓ Connected successfully\n")
    
    # Get counts
    total_users = old_db.users.count_documents({})
    print(f"📊 Found {total_users} total users in old database\n")
    
    if total_users == 0:
        print("⚠️  No users found. Nothing to migrate.")
        return
    
    # Confirm before proceeding
    confirm = input("⚠️  This will copy data to new databases. Continue? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Migration cancelled.")
        return
    
    print("\n🔄 Starting migration...\n")
    
    # Migrate buyers
    print("1️⃣  Migrating BUYERS...")
    buyers = list(old_db.users.find({'user_type': 'buyer'}))
    if buyers:
        buyers_db.users.insert_many(buyers)
        print(f"   ✓ Migrated {len(buyers)} buyers to personashop_buyers.users")
    else:
        print("   ℹ️  No buyers to migrate")
    
    # Migrate style profiles (buyer-only)
    style_profiles = list(old_db.style_profiles.find({}))
    if style_profiles:
        buyers_db.style_profiles.insert_many(style_profiles)
        print(f"   ✓ Migrated {len(style_profiles)} style profiles to personashop_buyers.style_profiles")
    
    # Migrate orders if they exist (buyer-only)
    if 'orders' in old_db.list_collection_names():
        orders = list(old_db.orders.find({}))
        if orders:
            buyers_db.orders.insert_many(orders)
            print(f"   ✓ Migrated {len(orders)} orders to personashop_buyers.orders")
    
    print()
    
    # Migrate sellers
    print("2️⃣  Migrating SELLERS...")
    sellers = list(old_db.users.find({'user_type': 'seller'}))
    if sellers:
        sellers_db.users.insert_many(sellers)
        print(f"   ✓ Migrated {len(sellers)} sellers to personashop_sellers.users")
    else:
        print("   ℹ️  No sellers to migrate")
    
    # Migrate seller profiles
    seller_profiles = list(old_db.seller_profiles.find({}))
    if seller_profiles:
        sellers_db.seller_profiles.insert_many(seller_profiles)
        print(f"   ✓ Migrated {len(seller_profiles)} seller profiles to personashop_sellers.seller_profiles")
    
    # Migrate products (seller-owned)
    products = list(old_db.products.find({}))
    if products:
        sellers_db.products.insert_many(products)
        print(f"   ✓ Migrated {len(products)} products to personashop_sellers.products")
    
    print()
    
    # Summary
    print("=" * 60)
    print("✅ MIGRATION COMPLETE!")
    print("=" * 60)
    print()
    print("📊 Summary:")
    print(f"   Buyers Database (personashop_buyers):")
    print(f"      - Users: {buyers_db.users.count_documents({})}")
    print(f"      - Style Profiles: {buyers_db.style_profiles.count_documents({})}")
    print(f"      - Orders: {buyers_db.orders.count_documents({}) if 'orders' in buyers_db.list_collection_names() else 0}")
    print()
    print(f"   Sellers Database (personashop_sellers):")
    print(f"      - Users: {sellers_db.users.count_documents({})}")
    print(f"      - Seller Profiles: {sellers_db.seller_profiles.count_documents({})}")
    print(f"      - Products: {sellers_db.products.count_documents({})}")
    print()
    print("⚠️  IMPORTANT: Update your .env file with new database URIs!")
    print("⚠️  OLD database (personashop) is still intact - you can delete it after testing")
    print()

def rollback():
    """Rollback migration by dropping new databases"""
    print("\n⚠️  ROLLBACK: This will DELETE the new databases!")
    confirm = input("Are you sure? Type 'DELETE' to confirm: ")
    
    if confirm != 'DELETE':
        print("Rollback cancelled.")
        return
    
    buyers_client = MongoClient(BUYERS_DB_URI)
    sellers_client = MongoClient(SELLERS_DB_URI)
    
    buyers_client.drop_database('personashop_buyers')
    sellers_client.drop_database('personashop_sellers')
    
    print("✓ New databases deleted. Old database is still intact.")

if __name__ == '__main__':
    print("\n🔧 MongoDB Database Migration Tool\n")
    print("Options:")
    print("  1. Migrate data to separate databases")
    print("  2. Rollback (delete new databases)")
    print("  3. Cancel")
    print()
    
    choice = input("Choose option (1/2/3): ")
    
    if choice == '1':
        migrate_data()
    elif choice == '2':
        rollback()
    else:
        print("Cancelled.")