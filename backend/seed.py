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
from app.models.user import User, UserRole
from app.core.security import get_password_hash
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

        # 0. Add Reviewer User
        reviewer = User(
            email="reviewer@ethara.com",
            hashed_password=get_password_hash("Ethara2026!"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(reviewer)
        db.flush()

        # 1. Add Customers
        cust1 = Customer(name="Alice Smith", email="alice@example.com", phone="+1-555-0100")
        cust2 = Customer(name="Bob Johnson", email="bob@example.com", phone="+1-555-0200")
        cust3 = Customer(name="Charlie Brown", email="charlie@example.com", phone="+1-555-0300")
        
        db.add_all([cust1, cust2, cust3])
        db.flush() # flush to generate UUIDs

        # 2. Add Warehouse
        from app.models.warehouse import Warehouse
        from app.services.inventory_service import InventoryLedgerService
        from app.models.inventory_event import EventType

        wh = Warehouse(name="Main Warehouse", location="HQ")
        db.add(wh)
        db.flush()

        # 3. Add Products (Removed legacy quantity keyword)
        p1 = Product(name="MacBook Pro 16-inch (M3 Max)", sku="MAC-001", price=Decimal("3499.00"))
        p2 = Product(name="Herman Miller Ergonomic Chair", sku="CHR-002", price=Decimal("1200.00"))
        p3 = Product(name="42U Server Rack Cabinet", sku="SRV-003", price=Decimal("850.00"))     # Low stock
        p4 = Product(name="Cisco Catalyst 9300 Switch", sku="NET-004", price=Decimal("4500.00"))    # Low stock
        p5 = Product(name="Logitech MX Master 3S Mouse", sku="MOU-005", price=Decimal("99.99"))     # Out of stock
        p6 = Product(name="Dell UltraSharp 32 4K USB-C Hub Monitor", sku="MON-006", price=Decimal("899.99"))
        p7 = Product(name="APC Smart-UPS 1500VA", sku="UPS-007", price=Decimal("520.00"))
        p8 = Product(name="Ubiquiti UniFi AP AC Pro", sku="WIF-008", price=Decimal("149.00"))
        p9 = Product(name="Seagate IronWolf 16TB NAS HDD", sku="HDD-009", price=Decimal("280.00"))
        p10 = Product(name="Yeti Blue USB Microphone", sku="MIC-010", price=Decimal("129.99"))

        db.add_all([p1, p2, p3, p4, p5, p6, p7, p8, p9, p10])
        db.flush()

        # Seed initial product stocks via Ledger
        initial_stocks = {
            p1.id: 15,
            p2.id: 45,
            p3.id: 4,
            p4.id: 8,
            p5.id: 0,
            p6.id: 25,
            p7.id: 12,
            p8.id: 30,
            p9.id: 50,
            p10.id: 20
        }
        for prod_id, qty in initial_stocks.items():
            if qty > 0:
                InventoryLedgerService.record_event(
                    db=db,
                    product_id=prod_id,
                    warehouse_id=wh.id,
                    event_type=EventType.STOCK_RECEIVED,
                    quantity_change=qty,
                    reason="Initial Seeding Stock"
                )

        # 4. Add Orders
        # Order 1: Alice buys 1 MacBook and 2 Chairs
        total1 = p1.price * 1 + p2.price * 2
        order1 = Order(customer_id=cust1.id, total_amount=total1, status="completed")
        item1_1 = OrderItem(order=order1, product_id=p1.id, quantity=1, unit_price=p1.price)
        item1_2 = OrderItem(order=order1, product_id=p2.id, quantity=2, unit_price=p2.price)
        
        # Deduct quantities via Ledger
        InventoryLedgerService.record_event(
            db=db, product_id=p1.id, warehouse_id=wh.id,
            event_type=EventType.STOCK_SOLD, quantity_change=-1, reason="Order placed"
        )
        InventoryLedgerService.record_event(
            db=db, product_id=p2.id, warehouse_id=wh.id,
            event_type=EventType.STOCK_SOLD, quantity_change=-2, reason="Order placed"
        )

        # Order 2: Bob buys 1 Switch and 1 Server Rack
        total2 = p4.price * 1 + p3.price * 1
        order2 = Order(customer_id=cust2.id, total_amount=total2, status="completed")
        item2_1 = OrderItem(order=order2, product_id=p4.id, quantity=1, unit_price=p4.price)
        item2_2 = OrderItem(order=order2, product_id=p3.id, quantity=1, unit_price=p3.price)
        
        # Deduct quantities via Ledger
        InventoryLedgerService.record_event(
            db=db, product_id=p4.id, warehouse_id=wh.id,
            event_type=EventType.STOCK_SOLD, quantity_change=-1, reason="Order placed"
        )
        InventoryLedgerService.record_event(
            db=db, product_id=p3.id, warehouse_id=wh.id,
            event_type=EventType.STOCK_SOLD, quantity_change=-1, reason="Order placed"
        )

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
