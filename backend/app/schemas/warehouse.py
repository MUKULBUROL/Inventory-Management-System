from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class WarehouseBase(BaseModel):
    name: str
    location: Optional[str] = None
    capacity: Optional[int] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None

class WarehouseResponse(WarehouseBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v)
        }
