import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, CheckConstraint, func, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class EventType(str, enum.Enum):
    STOCK_RECEIVED = "StockReceived"
    STOCK_RESERVED = "StockReserved"
    STOCK_RELEASED = "StockReleased"
    STOCK_TRANSFERRED = "StockTransferred"
    STOCK_ADJUSTED = "StockAdjusted"
    STOCK_DAMAGED = "StockDamaged"
    STOCK_RETURNED = "StockReturned"
    STOCK_SOLD = "StockSold"

class InventoryEvent(Base):
    """
    InventoryEvent represents a single immutable ledger event tracking stock changes.
    Enforces double-entry ledger-style inventory bookkeeping where stock level is 
    calculated by accumulating historical event deltas.
    """
    __tablename__ = "inventory_events"

    # Database-level integrity safeguard to prevent stock from dropping below zero.
    # Concurrency and race conditions (e.g. flash sales) will trigger a PostgreSQL 
    # IntegrityError if check is violated, forcing transaction rollback.
    __table_args__ = (
        CheckConstraint("after_value >= 0", name="check_after_value_non_negative"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False, index=True)
    
    event_type = Column(SQLEnum(EventType), nullable=False)
    
    quantity_change = Column(Integer, nullable=False) # Positive (stock in) or negative (stock out)
    before_value = Column(Integer, nullable=False)    # Aggregated stock value before event
    after_value = Column(Integer, nullable=False)     # Aggregated stock value after event
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # ID of user triggering the change
    reason = Column(String, nullable=True)                          # Context reason (e.g. 'Order Confirmed')
    reference_id = Column(String, nullable=True)                    # Link to order UUID or transfer UUID
    
    ip_address = Column(String, nullable=True)                      # Auditing field for IP
    device_info = Column(String, nullable=True)                     # Auditing field for browser/client device
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
