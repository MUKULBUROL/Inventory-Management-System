import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, func, ForeignKey, Enum as SQLEnum
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
    __tablename__ = "inventory_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False, index=True)
    
    event_type = Column(SQLEnum(EventType), nullable=False)
    
    quantity_change = Column(Integer, nullable=False)
    before_value = Column(Integer, nullable=False)
    after_value = Column(Integer, nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Could be system generated
    reason = Column(String, nullable=True)
    reference_id = Column(String, nullable=True) # e.g. Order ID, Transfer ID
    
    ip_address = Column(String, nullable=True)
    device_info = Column(String, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
