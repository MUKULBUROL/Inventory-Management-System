import sys
import os
import random
import uuid
from decimal import Decimal
import datetime

# Add the current directory to python path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem

# Config
NUM_CUSTOMERS = 10000
NUM_PRODUCTS = 5000
NUM_ORDERS = 50000

def generate_massive_data():
    print(f"Starting massive seed...")
    db: Session = SessionLocal()
    
    try:
        print(f"Generating {NUM_CUSTOMERS} customers...")
        customers = []
        for i in range(NUM_CUSTOMERS):
            customers.append(
                Customer(
                    id=str(uuid.uuid4()),
                    name=f"Customer {i} {uuid.uuid4().hex[:4]}",
                    email=f"customer{i}_{uuid.uuid4().hex[:8]}@example.com",
                    phone=f"+1-555-{random.randint(1000, 9999)}",
                    created_at=datetime.datetime.utcnow()
                )
            )
        
        # Chunk insert to avoid memory issues
        chunk_size = 5000
        for i in range(0, len(customers), chunk_size):
            db.bulk_save_objects(customers[i:i+chunk_size])
        db.commit()
        print("Customers seeded.")

        # Setup/verify default warehouse
        from app.models.warehouse import Warehouse
        from app.models.inventory_event import InventoryEvent, EventType
        wh = db.query(Warehouse).first()
        if not wh:
            wh = Warehouse(name="Main Warehouse", location="HQ")
            db.add(wh)
            db.commit()

        print(f"Generating {NUM_PRODUCTS} products...")
        products = []
        events = []
        for i in range(NUM_PRODUCTS):
            p_id = str(uuid.uuid4())
            qty = random.randint(500, 5000)
            products.append(
                Product(
                    id=p_id,
                    name=f"Dummy Product {i} {uuid.uuid4().hex[:4]}",
                    sku=f"SKU-{uuid.uuid4().hex[:10]}",
                    price=Decimal(f"{random.uniform(10.0, 500.0):.2f}"),
                    created_at=datetime.datetime.utcnow()
                )
            )
            # Create corresponding inventory event mapping initial stock receipt
            events.append(
                InventoryEvent(
                    id=str(uuid.uuid4()),
                    product_id=p_id,
                    warehouse_id=wh.id,
                    event_type=EventType.STOCK_RECEIVED,
                    quantity_change=qty,
                    before_value=0,
                    after_value=qty,
                    reason="Initial Seeding Stock",
                    timestamp=datetime.datetime.utcnow()
                )
            )
            
        for i in range(0, len(products), chunk_size):
            db.bulk_save_objects(products[i:i+chunk_size])
        db.commit()
        print("Products seeded.")

        print(f"Generating and bulk saving stock ledger events...")
        for i in range(0, len(events), chunk_size):
            db.bulk_save_objects(events[i:i+chunk_size])
        db.commit()
        print("Stock ledger seeded.")


        print(f"Generating {NUM_ORDERS} orders and items...")
        
        # Load IDs to memory for quick random choice
        cust_ids = [c.id for c in db.query(Customer.id).all()]
        prod_data = db.query(Product.id, Product.price).all()
        
        orders = []
        order_items = []
        
        for i in range(NUM_ORDERS):
            order_id = str(uuid.uuid4())
            cust_id = random.choice(cust_ids)
            
            # Select 1 to 5 random products for this order
            num_items = random.randint(1, 5)
            selected_prods = random.sample(prod_data, num_items)
            
            total_amount = Decimal("0.00")
            
            for prod_id, prod_price in selected_prods:
                qty = random.randint(1, 3)
                total_amount += prod_price * qty
                
                order_items.append(
                    OrderItem(
                        id=str(uuid.uuid4()),
                        order_id=order_id,
                        product_id=prod_id,
                        quantity=qty,
                        unit_price=prod_price
                    )
                )
            
            orders.append(
                Order(
                    id=order_id,
                    customer_id=cust_id,
                    total_amount=total_amount,
                    status="completed",
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 365))
                )
            )

        # Bulk save orders and items
        for i in range(0, len(orders), chunk_size):
            db.bulk_save_objects(orders[i:i+chunk_size])
            
        for i in range(0, len(order_items), chunk_size):
            db.bulk_save_objects(order_items[i:i+chunk_size])
            
        db.commit()
        print(f"Successfully seeded {NUM_ORDERS} orders.")
        
    except Exception as e:
        db.rollback()
        print(f"Error during massive seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    generate_massive_data()
