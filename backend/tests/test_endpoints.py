import pytest
from decimal import Decimal

def test_product_endpoints(client):
    # 1. Create product without legacy quantity field
    payload = {
        "name": "Mechanical Keyboard",
        "sku": "KEY-MECH",
        "price": 89.99
    }
    response = client.post("/api/v1/products", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Mechanical Keyboard"
    assert data["sku"] == "KEY-MECH"
    assert data["price"] == 89.99
    assert data["available_stock"] == 0  # Starts at zero
    product_id = data["id"]

    # 2. Get products (with search query filtering)
    response = client.get("/api/v1/products?search=MECH")
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 1
    assert products[0]["id"] == product_id

    # 3. Adjust product stock level using the ledger endpoint
    adjust_payload = {
        "product_id": product_id,
        "quantity_change": 10,
        "reason": "Initial stocking"
    }
    response = client.post("/api/v1/inventory/adjust", json=adjust_payload)
    assert response.status_code == 200
    assert response.json()["after_value"] == 10

    # Verify stock level is updated when fetching product details
    response = client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    assert response.json()["available_stock"] == 10

    # 4. Modify stock level to 15 by adding 5 more items
    adjust_payload_2 = {
        "product_id": product_id,
        "quantity_change": 5,
        "reason": "Replenishment"
    }
    response = client.post("/api/v1/inventory/adjust", json=adjust_payload_2)
    assert response.status_code == 200
    assert response.json()["after_value"] == 15

    # Verify updated stock level
    response = client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    assert response.json()["available_stock"] == 15

def test_customer_endpoints(client):
    # 1. Register customer
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "+1-555-9000"
    }
    response = client.post("/api/v1/customers", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane@example.com"
    customer_id = data["id"]

    # 2. List customers
    response = client.get("/api/v1/customers")
    assert response.status_code == 200
    customers = response.json()
    assert len(customers) == 1
    assert customers[0]["id"] == customer_id

def test_dashboard_metrics(client):
    # 1. Setup mock product without legacy quantity field
    prod_resp = client.post("/api/v1/products", json={
        "name": "Low Stock Mouse",
        "sku": "MOU-LOW",
        "price": 25.00
    })
    assert prod_resp.status_code == 201
    product_id = prod_resp.json()["id"]

    # Adjust stock to 4 (which is low stock, i.e., qty < 10)
    adjust_resp = client.post("/api/v1/inventory/adjust", json={
        "product_id": product_id,
        "quantity_change": 4,
        "reason": "Initial small stock"
    })
    assert adjust_resp.status_code == 200

    client.post("/api/v1/customers", json={
        "name": "Tester",
        "email": "tester@example.com"
    })
    
    # 2. Query stats endpoint
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_products"] == 1
    assert data["total_customers"] == 1
    assert len(data["low_stock_products"]) == 1
    assert data["low_stock_products"][0]["sku"] == "MOU-LOW"
    assert data["low_stock_products"][0]["available_stock"] == 4

