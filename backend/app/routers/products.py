from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

from app.api import deps

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    # Check if SKU already exists
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product_in.sku}' already exists."
        )
    
    db_product = Product(**product_in.model_dump())
    try:
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return populate_product_stock(db, db_product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error: check constraints or SKU duplicates."
        )

from app.services.inventory_service import InventoryLedgerService

def populate_product_stock(db: Session, product: Product) -> dict:
    product_dict = {c.name: getattr(product, c.name) for c in product.__table__.columns}
    product_dict["available_stock"] = InventoryLedgerService.get_available_stock(db, product.id)
    product_dict["reserved_stock"] = InventoryLedgerService.get_reserved_stock(db, product.id)
    product_dict["in_transit_stock"] = 0 # Future implementation
    return product_dict

@router.get("", response_model=List[ProductResponse])
def read_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Search by product name or SKU"),
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    query = db.query(Product)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | 
            (Product.sku.ilike(f"%{search}%"))
        )
    products = query.order_by(Product.name).offset(skip).limit(limit).all()
    return [populate_product_stock(db, p) for p in products]

@router.get("/{product_id}", response_model=ProductResponse)
def read_product(product_id: UUID, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return populate_product_stock(db, product)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: UUID, product_in: ProductUpdate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    
    update_data = product_in.model_dump(exclude_unset=True)
    
    # Check SKU uniqueness if SKU is being updated
    if "sku" in update_data and update_data["sku"] != product.sku:
        existing = db.query(Product).filter(Product.sku == update_data["sku"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{update_data['sku']}' already exists."
            )
            
    for field, value in update_data.items():
        setattr(product, field, value)
        
    try:
        db.commit()
        db.refresh(product)
        return populate_product_stock(db, product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database update failed due to constraint violation."
        )

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: UUID, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    try:
        db.delete(product)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete product. It may be linked to existing orders. Error: {str(e)}"
        )
