from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.api import deps
from app.models.inventory_event import InventoryEvent
from app.schemas.inventory import InventoryEventResponse

router = APIRouter(prefix="/inventory", tags=["Inventory Ledger"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # In a real app we might handle incoming messages, but here it's mainly for pushing events
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/events/{product_id}", response_model=List[InventoryEventResponse])
def get_product_ledger(product_id: UUID, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    events = db.query(InventoryEvent).filter(InventoryEvent.product_id == product_id).order_by(InventoryEvent.timestamp.desc()).all()
    return events

from pydantic import BaseModel

class AdjustStockRequest(BaseModel):
    product_id: UUID
    quantity_change: int
    reason: str

@router.post("/adjust", response_model=InventoryEventResponse)
def adjust_stock(req: AdjustStockRequest, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    from app.services.inventory_service import InventoryLedgerService
    from app.models.warehouse import Warehouse
    from app.models.inventory_event import EventType

    # Get or create default warehouse
    default_warehouse = db.query(Warehouse).first()
    if not default_warehouse:
        default_warehouse = Warehouse(name="Main Warehouse", location="HQ")
        db.add(default_warehouse)
        db.flush()

    event = InventoryLedgerService.record_event(
        db=db,
        product_id=req.product_id,
        warehouse_id=default_warehouse.id,
        event_type=EventType.STOCK_ADJUSTED,
        quantity_change=req.quantity_change,
        user_id=current_user.id,
        reason=req.reason
    )
    db.commit()
    db.refresh(event)
    return event
