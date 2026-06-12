import redis.asyncio as redis
import json
from functools import wraps
from typing import Any, Callable
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize redis connection pool
try:
    redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
except Exception as e:
    logger.error(f"Failed to initialize Redis client: {e}")
    redis_client = None

def cache_response(ttl_seconds: int = 5):
    """
    Decorator to cache FastAPI endpoint responses in Redis.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            if not redis_client:
                import asyncio
                from starlette.concurrency import run_in_threadpool
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                return await run_in_threadpool(func, *args, **kwargs)
                
            # Create a cache key based on the function name
            cache_key = f"cache:{func.__name__}"
            
            try:
                cached_value = await redis_client.get(cache_key)
                if cached_value:
                    return json.loads(cached_value)
            except Exception as e:
                logger.warning(f"Redis cache read error: {e}")
                
            # Not in cache or error reading, compute the result
            from starlette.concurrency import run_in_threadpool
            import asyncio
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = await run_in_threadpool(func, *args, **kwargs)
            
            try:
                # Store in cache
                if isinstance(result, dict):
                    # For dashboard response we use fastapi's jsonable_encoder to convert datetime 
                    # and Decimal objects to basic JSON-compatible Python types before serialization.
                    from fastapi.encoders import jsonable_encoder
                    serialized_data = jsonable_encoder(result)
                    await redis_client.set(cache_key, json.dumps(serialized_data), ex=ttl_seconds)
            except Exception as e:
                logger.warning(f"Redis cache write error: {e}")
                
            return result
        return wrapper
    return decorator

