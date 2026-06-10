import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.product import Product
from decimal import Decimal

def add_more_products():
    db: Session = SessionLocal()
    try:
        print("Adding more products with high quantities...")
        
        products = [
            Product(name="Smartphone Pro Max", sku="PHN-700", price=Decimal("1099.99"), quantity=500),
            Product(name="Tablet Mini", sku="TAB-800", price=Decimal("399.50"), quantity=300),
            Product(name="Smart Watch Series 5", sku="WTCH-900", price=Decimal("299.00"), quantity=400),
            Product(name="Bluetooth Speaker", sku="SPK-1000", price=Decimal("89.99"), quantity=600),
            Product(name="Gaming Console NextGen", sku="GMC-1100", price=Decimal("499.99"), quantity=150),
            Product(name="VR Headset", sku="VRH-1200", price=Decimal("299.99"), quantity=250),
        ]
        
        # also increase quantity of existing products
        existing = db.query(Product).all()
        for p in existing:
            p.quantity += 1000

        db.add_all(products)
        db.commit()
        print("Added more products successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error during addition: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_more_products()
