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
        from app.models.warehouse import Warehouse
        from app.services.inventory_service import InventoryLedgerService
        from app.models.inventory_event import EventType

        wh = db.query(Warehouse).first()
        if not wh:
            wh = Warehouse(name="Main Warehouse", location="HQ")
            db.add(wh)
            db.flush()
        
        products = [
            Product(name="Smartphone Pro Max", sku="PHN-700", price=Decimal("1099.99")),
            Product(name="Tablet Mini", sku="TAB-800", price=Decimal("399.50")),
            Product(name="Smart Watch Series 5", sku="WTCH-900", price=Decimal("299.00")),
            Product(name="Bluetooth Speaker", sku="SPK-1000", price=Decimal("89.99")),
            Product(name="Gaming Console NextGen", sku="GMC-1100", price=Decimal("499.99")),
            Product(name="VR Headset", sku="VRH-1200", price=Decimal("299.99")),
        ]
        db.add_all(products)
        db.flush()

        # Record stock for new products
        new_quantities = {
            products[0].id: 500,
            products[1].id: 300,
            products[2].id: 400,
            products[3].id: 600,
            products[4].id: 150,
            products[5].id: 250,
        }
        for p_id, qty in new_quantities.items():
            InventoryLedgerService.record_event(
                db=db, product_id=p_id, warehouse_id=wh.id,
                event_type=EventType.STOCK_RECEIVED, quantity_change=qty,
                reason="Initial Seeding Stock"
            )
        
        # Also increase stock of existing products via ledger receipt
        existing = db.query(Product).all()
        for p in existing:
            # Check if this product is one of the newly added ones
            if p.id not in new_quantities:
                InventoryLedgerService.record_event(
                    db=db, product_id=p.id, warehouse_id=wh.id,
                    event_type=EventType.STOCK_RECEIVED, quantity_change=1000,
                    reason="Stock replenishment"
                )

        db.commit()
        print("Added more products successfully!")

        
    except Exception as e:
        db.rollback()
        print(f"Error during addition: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_more_products()
