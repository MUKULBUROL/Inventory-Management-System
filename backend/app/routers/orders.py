from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.models.order import Order, OrderItem
from app.services.order_service import OrderService
from app.schemas.order import OrderCreate, OrderResponse

from app.api import deps

router = APIRouter(prefix="/orders", tags=["Orders"], dependencies=[Depends(deps.get_current_user)])

def serialize_order(order: Order) -> dict:
    """Helper to convert Order DB model to OrderResponse Pydantic structure"""
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.name if order.customer else "Deleted Customer",
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "Deleted Product",
                "sku": item.product.sku if item.product else "N/A",
                "quantity": item.quantity,
                "unit_price": item.unit_price
            } for item in order.items
        ]
    }

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    db_order = OrderService.create_order(db, order_in)
    return serialize_order(db_order)

@router.get("", response_model=List[OrderResponse])
def read_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    # Use joinedload to optimize queries and avoid N+1 queries
    orders = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product) # Wait! OrderItem is imported inside order.py
    ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    return [serialize_order(o) for o in orders]

@router.get("/{order_id}", response_model=OrderResponse)
def read_order(order_id: UUID, db: Session = Depends(get_db)):
    order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    return serialize_order(order)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: UUID, db: Session = Depends(get_db)):
    OrderService.cancel_order(db, str(order_id))
    return None

