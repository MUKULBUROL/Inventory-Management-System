from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from uuid import UUID
from app.models.inventory_event import InventoryEvent, EventType
from app.models.product import Product

class InventoryLedgerService:
    @staticmethod
    def record_event(
        db: Session,
        product_id: UUID,
        warehouse_id: UUID,
        event_type: EventType,
        quantity_change: int,
        user_id: Optional[int] = None,
        reason: Optional[str] = None,
        reference_id: Optional[str] = None
    ) -> InventoryEvent:
        # Get current aggregated stock to determine before and after values
        current_stock = InventoryLedgerService.get_available_stock(db, product_id, warehouse_id)
        
        event = InventoryEvent(
            product_id=product_id,
            warehouse_id=warehouse_id,
            event_type=event_type,
            quantity_change=quantity_change,
            before_value=current_stock,
            after_value=current_stock + quantity_change,
            user_id=user_id,
            reason=reason,
            reference_id=reference_id
        )
        db.add(event)
        # Flush to get the event ID if needed, but committing is up to the caller
        db.flush()
        return event

    @staticmethod
    def get_stock_by_event_types(db: Session, product_id: UUID, warehouse_id: Optional[UUID], positive_events: List[EventType], negative_events: List[EventType]) -> int:
        query = db.query(func.sum(InventoryEvent.quantity_change)).filter(InventoryEvent.product_id == product_id)
        if warehouse_id:
            query = query.filter(InventoryEvent.warehouse_id == warehouse_id)
            
        positive_sum = db.query(func.sum(InventoryEvent.quantity_change)).filter(
            InventoryEvent.product_id == product_id,
            InventoryEvent.event_type.in_(positive_events)
        )
        if warehouse_id:
            positive_sum = positive_sum.filter(InventoryEvent.warehouse_id == warehouse_id)
        pos = positive_sum.scalar() or 0
        
        negative_sum = db.query(func.sum(InventoryEvent.quantity_change)).filter(
            InventoryEvent.product_id == product_id,
            InventoryEvent.event_type.in_(negative_events)
        )
        if warehouse_id:
            negative_sum = negative_sum.filter(InventoryEvent.warehouse_id == warehouse_id)
        neg = negative_sum.scalar() or 0
        
        return pos - abs(neg)

    @staticmethod
    def get_available_stock(db: Session, product_id: UUID, warehouse_id: Optional[UUID] = None) -> int:
        # Available = Received + Returned + Adjusted(Positive) - Sold - Reserved - Damaged
        positive = [EventType.STOCK_RECEIVED, EventType.STOCK_RETURNED, EventType.STOCK_ADJUSTED]
        negative = [EventType.STOCK_SOLD, EventType.STOCK_RESERVED, EventType.STOCK_DAMAGED]
        return InventoryLedgerService.get_stock_by_event_types(db, product_id, warehouse_id, positive, negative)

    @staticmethod
    def get_reserved_stock(db: Session, product_id: UUID, warehouse_id: Optional[UUID] = None) -> int:
        positive = [EventType.STOCK_RESERVED]
        negative = [EventType.STOCK_RELEASED, EventType.STOCK_SOLD] # Assuming sold releases reservation
        return InventoryLedgerService.get_stock_by_event_types(db, product_id, warehouse_id, positive, negative)
