from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal
from uuid import UUID
from datetime import datetime

class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0, description="Quantity ordered must be greater than zero")

class OrderCreate(BaseModel):
    customer_id: UUID
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least one product")

class OrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: Optional[str] = None
    sku: Optional[str] = None
    quantity: int
    unit_price: Decimal

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v),
            Decimal: lambda v: float(v)
        }

class OrderResponse(BaseModel):
    id: UUID
    customer_id: UUID
    customer_name: Optional[str] = None
    total_amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v),
            Decimal: lambda v: float(v)
        }
