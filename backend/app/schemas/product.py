from pydantic import BaseModel, Field, field_validator
from typing import Optional, Annotated
from decimal import Decimal
from uuid import UUID
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    sku: str = Field(..., min_length=2, max_length=50)
    price: Decimal = Field(..., gt=Decimal("0.00"), decimal_places=2)

class ProductCreate(ProductBase):
    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v: str) -> str:
        return v.strip().upper()

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    sku: Optional[str] = Field(None, min_length=2, max_length=50)
    price: Optional[Annotated[Decimal, Field(gt=Decimal("0.00"), decimal_places=2)]] = None

    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip().upper()
        return v

class ProductResponse(ProductBase):
    id: UUID
    expected_runout_date: Optional[datetime] = None
    recommended_reorder_quantity: Optional[int] = None
    supplier_recommendation: Optional[str] = None
    
    # Computed from Ledger
    available_stock: int = 0
    reserved_stock: int = 0
    in_transit_stock: int = 0
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v),
            Decimal: lambda v: float(v)
        }
