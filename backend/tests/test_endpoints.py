import pytest
from decimal import Decimal

def test_product_endpoints(client):
    # 1. Create product
    payload = {
        "name": "Mechanical Keyboard",
        "sku": "KEY-MECH",
        "price": 89.99,
        "quantity": 10
    }
    response = client.post("/api/v1/products", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Mechanical Keyboard"
    assert data["sku"] == "KEY-MECH"
    assert data["price"] == 89.99
    assert data["quantity"] == 10
    product_id = data["id"]

    # 2. Get products (with search query filtering)
    response = client.get("/api/v1/products?search=MECH")
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 1
    assert products[0]["id"] == product_id

    # 3. Update product stock level
    update_payload = {
        "quantity": 15
    }
    response = client.put(f"/api/v1/products/{product_id}", json=update_payload)
    assert response.status_code == 200
    assert response.json()["quantity"] == 15

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
    # 1. Setup mock product and customer profiles
    prod_resp = client.post("/api/v1/products", json={
        "name": "Low Stock Mouse",
        "sku": "MOU-LOW",
        "price": 25.00,
        "quantity": 4  # low stock (qty < 10)
    })
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
