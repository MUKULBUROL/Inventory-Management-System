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
    total_products = db.query(func.count(Product.id)).scalar()
    total_customers = db.query(func.count(Customer.id)).scalar()
    total_orders = db.query(func.count(Order.id)).scalar()
    
    # Define "low stock" as quantity < 10
    low_stock = db.query(Product).filter(Product.quantity < 10).order_by(Product.quantity.asc()).all()
    
    # Serialize products
    low_stock_serialized = [
        {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "price": float(p.price),
            "quantity": p.quantity,
            "created_at": p.created_at,
            "updated_at": p.updated_at
        } for p in low_stock
    ]
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_serialized
    }
