from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from app.models.inventory_event import EventType
from app.models.approval import ApprovalType, ApprovalStatus

class InventoryEventBase(BaseModel):
    product_id: UUID
    warehouse_id: UUID
    event_type: EventType
    quantity_change: int
    before_value: int
    after_value: int
    reason: Optional[str] = None
    reference_id: Optional[str] = None

class InventoryEventCreate(InventoryEventBase):
    pass

class InventoryEventResponse(InventoryEventBase):
    id: UUID
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    device_info: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v)
        }

class ApprovalRequestBase(BaseModel):
    type: ApprovalType
    details: Dict[str, Any]

class ApprovalRequestCreate(ApprovalRequestBase):
    pass

class ApprovalRequestResponse(ApprovalRequestBase):
    id: UUID
    status: ApprovalStatus
    requested_by: int
    approved_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v)
        }
