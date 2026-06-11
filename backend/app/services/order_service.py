from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.order import OrderCreate
from decimal import Decimal

class OrderService:
    @staticmethod
    def create_order(db: Session, order_data: OrderCreate) -> Order:
        """
        Creates an order inside an atomic transaction.
        Uses pessimistic locking (with_for_update) on products to prevent concurrency issues/race conditions.
        """
        # 1. Verify Customer Exists
        customer = db.query(Customer).filter(Customer.id == order_data.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {order_data.customer_id} not found."
            )

        total_amount = Decimal("0.00")
        order_items = []

        try:
            # 2. Iterate and process each product item (Locking row by row, sorted to prevent deadlocks)
            sorted_items = sorted(order_data.items, key=lambda x: str(x.product_id))
            for item in sorted_items:
                # SELECT ... FOR UPDATE locks the product row until the transaction commits or rolls back
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product with ID {item.product_id} not found."
                    )
                
                # Check sufficient stock
                if product.quantity < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Insufficient inventory for product '{product.name}' (SKU: {product.sku}). "
                            f"Requested: {item.quantity}, Available: {product.quantity}."
                        )
                    )
                
                # Deduct stock (PostgreSQL will validate quantity >= 0 through the CheckConstraint as well)
                product.quantity -= item.quantity
                
                # Calculate price for this line item
                item_total = product.price * Decimal(item.quantity)
                total_amount += item_total
                
                # Instantiate OrderItem
                db_order_item = OrderItem(
                    product_id=product.id,
                    quantity=item.quantity,
                    unit_price=product.price
                )
                order_items.append(db_order_item)
            
            # 3. Create the Order
            db_order = Order(
                customer_id=customer.id,
                total_amount=total_amount,
                status="completed", # Completed upon creation since inventory was secured
                items=order_items
            )
            
            db.add(db_order)
            db.commit()
            db.refresh(db_order)
            return db_order

        except HTTPException as he:
            db.rollback()
            raise he
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to place order due to database error: {str(e)}"
            )

    @staticmethod
    def cancel_order(db: Session, order_id: str) -> None:
        """
        Cancels an order and transitions its status to 'cancelled'.
        Restores the items back into inventory stock atomically.
        """
        import uuid
        if isinstance(order_id, str):
            order_id = uuid.UUID(order_id)

        # Fetch the order with lock
        order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID {order_id} not found."
            )

        try:
            # If the order is already cancelled, do nothing
            if order.status != "cancelled":
                for item in order.items:
                    # Lock product and increment stock
                    product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                    if product:
                        product.quantity += item.quantity
                
                # Mark as cancelled to preserve audit history
                order.status = "cancelled"
                db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to cancel order: {str(e)}"
            )
