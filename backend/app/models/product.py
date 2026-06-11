import uuid
from sqlalchemy import Column, String, Numeric, Integer, DateTime, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    # quantity field is removed in V2, stock is computed from ledger
    
    # AI Forecasting Fields
    expected_runout_date = Column(DateTime(timezone=True), nullable=True)
    recommended_reorder_quantity = Column(Integer, nullable=True)
    supplier_recommendation = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

