import sys
import os
# Add the current directory to python path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from decimal import Decimal

def seed_database():
    print("Initializing tables...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if products already exist
        if db.query(Product).count() > 0:
            print("Database already contains data, skipping seed.")
            return

        print("Seeding database with mock data...")

        # 1. Add Customers
        cust1 = Customer(name="Alice Smith", email="alice@example.com", phone="+1-555-0100")
        cust2 = Customer(name="Bob Johnson", email="bob@example.com", phone="+1-555-0200")
        cust3 = Customer(name="Charlie Brown", email="charlie@example.com", phone="+1-555-0300")
        
        db.add_all([cust1, cust2, cust3])
        db.flush() # flush to generate UUIDs

        # 2. Add Products
        p1 = Product(name="Enterprise Workstation Laptop", sku="LAP-100", price=Decimal("1249.99"), quantity=15)
        p2 = Product(name="Mechanical Keyboard (Brown Switches)", sku="KEY-200", price=Decimal("89.99"), quantity=45)
        p3 = Product(name="Wireless Ergonomic Mouse", sku="MOU-300", price=Decimal("45.50"), quantity=4)     # Low stock
        p4 = Product(name="4K Ultra-Wide Monitor 34\"", sku="MON-400", price=Decimal("499.00"), quantity=8)    # Low stock
        p5 = Product(name="Active Noise Cancelling Headphones", sku="HPH-500", price=Decimal("150.00"), quantity=0) # Out of stock
        p6 = Product(name="USB-C Docking Station Multiport", sku="DKS-600", price=Decimal("120.00"), quantity=25)

        db.add_all([p1, p2, p3, p4, p5, p6])
        db.flush()

        # 3. Add Orders
        # Order 1: Alice buys 1 Laptop and 2 Keyboards
        total1 = p1.price * 1 + p2.price * 2
        order1 = Order(customer_id=cust1.id, total_amount=total1, status="completed")
        item1_1 = OrderItem(order=order1, product_id=p1.id, quantity=1, unit_price=p1.price)
        item1_2 = OrderItem(order=order1, product_id=p2.id, quantity=2, unit_price=p2.price)
        
        # Deduct quantities
        p1.quantity -= 1
        p2.quantity -= 2

        # Order 2: Bob buys 1 Monitor and 1 Mouse
        total2 = p4.price * 1 + p3.price * 1
        order2 = Order(customer_id=cust2.id, total_amount=total2, status="completed")
        item2_1 = OrderItem(order=order2, product_id=p4.id, quantity=1, unit_price=p4.price)
        item2_2 = OrderItem(order=order2, product_id=p3.id, quantity=1, unit_price=p3.price)
        
        # Deduct quantities
        p4.quantity -= 1
        p3.quantity -= 1

        db.add_all([order1, order2, item1_1, item1_2, item2_1, item2_2])
        
        db.commit()
        print("Database seed completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
