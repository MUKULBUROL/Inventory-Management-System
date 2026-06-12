import pytest
from fastapi import HTTPException
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderItemCreate
from app.services.order_service import OrderService
from decimal import Decimal

from app.models.warehouse import Warehouse
from app.services.inventory_service import InventoryLedgerService
from app.models.inventory_event import EventType

def test_create_order_success(db_session):
    # 1. Setup mock customer, product & warehouse
    customer = Customer(name="Test Customer", email="test@example.com")
    product = Product(name="Test Keyboard", sku="KEY-123", price=Decimal("100.00"))
    warehouse = Warehouse(name="Main Warehouse", location="HQ")
    
    db_session.add_all([customer, product, warehouse])
    db_session.flush() # Generate UUIDs
    
    # Record initial stock level in the ledger
    InventoryLedgerService.record_event(
        db=db_session,
        product_id=product.id,
        warehouse_id=warehouse.id,
        event_type=EventType.STOCK_RECEIVED,
        quantity_change=10
    )
    db_session.commit()

    # 2. Execute order checkout service
    order_data = OrderCreate(
        customer_id=customer.id,
        items=[OrderItemCreate(product_id=product.id, quantity=3)]
    )
    
    order = OrderService.create_order(db_session, order_data)

    # 3. Verify order metrics and database state updates
    assert order.id is not None
    assert order.customer_id == customer.id
    assert order.total_amount == Decimal("300.00")
    assert order.status == "completed"
    assert len(order.items) == 1
    assert order.items[0].product_id == product.id
    assert order.items[0].quantity == 3
    assert order.items[0].unit_price == Decimal("100.00")

    # Assert stock is decremented via ledger
    stock = InventoryLedgerService.get_available_stock(db_session, product.id, warehouse.id)
    assert stock == 7

def test_create_order_insufficient_stock(db_session):
    customer = Customer(name="Test Customer", email="test2@example.com")
    product = Product(name="Low Stock Item", sku="ITEM-LOW", price=Decimal("10.00"))
    warehouse = Warehouse(name="Main Warehouse", location="HQ")
    
    db_session.add_all([customer, product, warehouse])
    db_session.flush()
    
    # Record stock level
    InventoryLedgerService.record_event(
        db=db_session,
        product_id=product.id,
        warehouse_id=warehouse.id,
        event_type=EventType.STOCK_RECEIVED,
        quantity_change=2
    )
    db_session.commit()

    order_data = OrderCreate(
        customer_id=customer.id,
        items=[OrderItemCreate(product_id=product.id, quantity=5)]
    )

    with pytest.raises(HTTPException) as exc_info:
        OrderService.create_order(db_session, order_data)
        
    assert exc_info.value.status_code == 400
    assert "Insufficient inventory" in exc_info.value.detail

def test_cancel_order_restores_stock(db_session):
    # 1. Setup mock data & checkout order
    customer = Customer(name="Test Customer", email="test3@example.com")
    product = Product(name="Laptop", sku="LAP-999", price=Decimal("1000.00"))
    warehouse = Warehouse(name="Main Warehouse", location="HQ")
    
    db_session.add_all([customer, product, warehouse])
    db_session.flush()
    
    # Record stock level
    InventoryLedgerService.record_event(
        db=db_session,
        product_id=product.id,
        warehouse_id=warehouse.id,
        event_type=EventType.STOCK_RECEIVED,
        quantity_change=5
    )
    db_session.commit()

    order_data = OrderCreate(
        customer_id=customer.id,
        items=[OrderItemCreate(product_id=product.id, quantity=2)]
    )
    order = OrderService.create_order(db_session, order_data)
    
    stock_after_order = InventoryLedgerService.get_available_stock(db_session, product.id, warehouse.id)
    assert stock_after_order == 3

    # 2. Cancel order
    OrderService.cancel_order(db_session, str(order.id))

    # 3. Verify soft cancel state and stock recovery
    db_session.refresh(order)
    
    assert order.status == "cancelled"
    stock_after_cancel = InventoryLedgerService.get_available_stock(db_session, product.id, warehouse.id)
    assert stock_after_cancel == 5 # Restored

