from pydantic import BaseModel, Field, field_validator
from typing import Optional, Annotated
from decimal import Decimal
from uuid import UUID
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    sku: str = Field(..., min_length=2, max_length=50)
    price: Decimal = Field(..., gt=Decimal("0.00"), decimal_places=2)
    quantity: int = Field(..., ge=0)

class ProductCreate(ProductBase):
    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v: str) -> str:
        return v.strip().upper()

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    sku: Optional[str] = Field(None, min_length=2, max_length=50)
    price: Optional[Annotated[Decimal, Field(gt=Decimal("0.00"), decimal_places=2)]] = None
    quantity: Optional[int] = Field(None, ge=0)

    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip().upper()
        return v

class ProductResponse(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v),
            Decimal: lambda v: float(v)
        }
