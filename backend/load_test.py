import asyncio
import httpx
import time
import random
import argparse
import statistics
import json
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

API_BASE_URL = "http://localhost:8001/api/v1"

# Metrics storage
latencies = {
    "GET_products": [],
    "GET_dashboard": [],
    "POST_orders": []
}
errors = {
    "GET_products": 0,
    "GET_dashboard": 0,
    "POST_orders": 0
}

success_count = 0
failure_count = 0

async def fetch_token():
    """Fetch JWT token for load testing."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(
                f"{API_BASE_URL}/auth/login",
                data={"username": "admin@example.com", "password": "password123"}
            )
            if resp.status_code == 200:
                return resp.json()["access_token"]
            else:
                logger.error(f"Failed to authenticate: {resp.text}")
                return None
        except Exception as e:
            logger.error(f"Error fetching token: {e}")
            return None

async def fetch_data_ids(token: str):
    """Fetch available product and customer IDs from the API."""
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(headers=headers, timeout=60.0) as client:
        try:
            prod_resp = await client.get(f"{API_BASE_URL}/products")
            cust_resp = await client.get(f"{API_BASE_URL}/customers")
            
            if prod_resp.status_code == 200 and cust_resp.status_code == 200:
                products = prod_resp.json()
                customers = cust_resp.json()
                product_ids = [p["id"] for p in products]
                customer_ids = [c["id"] for c in customers]
                return product_ids, customer_ids
            else:
                logger.error("Failed to fetch initial data. Make sure backend is seeded.")
                return [], []
        except Exception as e:
            logger.error(f"Error fetching data: {e}")
            return [], []

async def worker(worker_id: int, duration: int, product_ids: list, customer_ids: list, token: str):
    global success_count, failure_count
    
    end_time = time.time() + duration
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        while time.time() < end_time:
            # Decide action: 50% dashboard, 30% products, 20% order placement
            action_choice = random.random()
            
            start_req = time.time()
            try:
                if action_choice < 0.5:
                    resp = await client.get(f"{API_BASE_URL}/dashboard")
                    latency = time.time() - start_req
                    latencies["GET_dashboard"].append(latency)
                    if resp.status_code == 200:
                        success_count += 1
                    else:
                        errors["GET_dashboard"] += 1
                        failure_count += 1
                        
                elif action_choice < 0.8:
                    resp = await client.get(f"{API_BASE_URL}/products")
                    latency = time.time() - start_req
                    latencies["GET_products"].append(latency)
                    if resp.status_code == 200:
                        success_count += 1
                    else:
                        errors["GET_products"] += 1
                        failure_count += 1
                        
                else:
                    if not product_ids or not customer_ids:
                        continue
                    
                    # Try to place an order
                    cust_id = random.choice(customer_ids)
                    prod_id = random.choice(product_ids)
                    payload = {
                        "customer_id": cust_id,
                        "items": [
                            {"product_id": prod_id, "quantity": random.randint(1, 2)}
                        ]
                    }
                    resp = await client.post(f"{API_BASE_URL}/orders", json=payload)
                    latency = time.time() - start_req
                    latencies["POST_orders"].append(latency)
                    
                    # 400 is acceptable if it's "Out of stock" (which means lock/constraint worked)
                    if resp.status_code in [200, 201, 400]:
                        success_count += 1
                    else:
                        errors["POST_orders"] += 1
                        failure_count += 1
            
            except Exception as e:
                failure_count += 1
                # Log occasional errors
                if random.random() < 0.05:
                    logger.warning(f"Worker {worker_id} request error: {e}")
            
            # Short sleep to prevent completely overwhelming localhost OS network stack
            await asyncio.sleep(random.uniform(0.1, 0.5))

def generate_report(duration_seconds: int, num_workers: int):
    logger.info("========== LOAD TEST REPORT ==========")
    total_reqs = success_count + failure_count
    logger.info(f"Test Duration: {duration_seconds}s")
    logger.info(f"Workers: {num_workers}")
    logger.info(f"Total Requests: {total_reqs}")
    logger.info(f"Successes: {success_count} | Failures: {failure_count}")
    
    if total_reqs > 0:
        logger.info(f"Overall throughput: {total_reqs / duration_seconds:.2f} req/sec")
    
    report_data = {
        "duration": duration_seconds,
        "workers": num_workers,
        "total_requests": total_reqs,
        "success": success_count,
        "failure": failure_count,
        "endpoints": {}
    }

    for action, lats in latencies.items():
        if lats:
            avg = statistics.mean(lats)
            p95 = statistics.quantiles(lats, n=20)[18] if len(lats) >= 20 else max(lats)
            max_lat = max(lats)
            logger.info(f"[{action}] Count: {len(lats)} | Errors: {errors[action]} | Avg Latency: {avg:.3f}s | p95: {p95:.3f}s | Max: {max_lat:.3f}s")
            report_data["endpoints"][action] = {
                "count": len(lats),
                "errors": errors[action],
                "avg_latency_sec": round(avg, 3),
                "p95_latency_sec": round(p95, 3),
                "max_latency_sec": round(max_lat, 3)
            }
            
    with open("performance_report.json", "w") as f:
        json.dump(report_data, f, indent=2)
    logger.info("Report saved to performance_report.json")


async def main():
    parser = argparse.ArgumentParser(description="Async Load Tester")
    parser.add_argument("--duration", type=int, default=10, help="Duration in seconds")
    parser.add_argument("--workers", type=int, default=10, help="Number of concurrent workers")
    args = parser.parse_args()

    logger.info(f"Starting load test for {args.duration} seconds with {args.workers} workers...")
    
    logger.info("Authenticating...")
    token = await fetch_token()
    if not token:
        logger.error("Could not obtain JWT token. Cannot proceed with load test.")
        return

    product_ids, customer_ids = await fetch_data_ids(token)
    if not product_ids or not customer_ids:
        logger.error("Missing products or customers in database. Please run seed.py first.")
        return
        
    logger.info(f"Found {len(product_ids)} products and {len(customer_ids)} customers.")

    tasks = []
    for i in range(args.workers):
        tasks.append(asyncio.create_task(worker(i, args.duration, product_ids, customer_ids, token)))

    await asyncio.gather(*tasks)
    
    logger.info("Load test completed. Generating report...")
    generate_report(args.duration, args.workers)

if __name__ == "__main__":
    asyncio.run(main())
