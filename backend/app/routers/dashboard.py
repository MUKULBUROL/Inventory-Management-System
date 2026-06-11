from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.core.database import get_db
from app.core.cache import cache_response
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.product import ProductResponse

from app.api import deps

from app.core.database import SessionLocal

router = APIRouter(prefix="/dashboard", tags=["Dashboard"], dependencies=[Depends(deps.get_current_user)])

@router.get("", response_model=Dict[str, Any])
@cache_response(ttl_seconds=5)
def get_dashboard_stats(db: Session = Depends(get_db)):
    from app.services.inventory_service import InventoryLedgerService
    from app.models.approval import ApprovalRequest, ApprovalStatus
    
    total_products = db.query(func.count(Product.id)).scalar()
    total_customers = db.query(func.count(Customer.id)).scalar()
    total_orders = db.query(func.count(Order.id)).scalar()
    pending_approvals = db.query(func.count(ApprovalRequest.id)).filter(ApprovalRequest.status == ApprovalStatus.PENDING).scalar()
    
    products = db.query(Product).all()
    
    inventory_value = 0.0
    low_stock_serialized = []
    
    # In a real enterprise app, this would be computed via SQL views or materialized views
    for p in products:
        available_stock = InventoryLedgerService.get_available_stock(db, p.id)
        inventory_value += float(p.price) * available_stock
        
        if available_stock < 10:
            low_stock_serialized.append({
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "price": float(p.price),
                "available_stock": available_stock,
                "created_at": p.created_at,
                "updated_at": p.updated_at
            })
            
    # Sort low stock
    low_stock_serialized.sort(key=lambda x: x["available_stock"])
    
    # Arbitrary mock values for demo
    dead_stock_value = inventory_value * 0.05
    health_score = 85 if total_products > 0 else 100
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "inventory_value": inventory_value,
        "dead_stock_value": dead_stock_value,
        "inventory_health_score": health_score,
        "pending_approvals": pending_approvals,
        "low_stock_products": low_stock_serialized[:10] # Top 10 lowest
    }
