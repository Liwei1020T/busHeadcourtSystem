import time
import functools
import hashlib
import json
from typing import Dict, Any, Tuple

# Global cache storage: {cache_key: (result, expiry_timestamp)}
_CACHE: Dict[str, Tuple[Any, float]] = {}

def generate_cache_key(func_name: str, *args, **kwargs) -> str:
    """Generate a consistent cache key from function arguments."""
    # Create a sorted list of kwargs for consistency
    key_parts = [func_name]

    # Add args to key
    for arg in args:
        key_parts.append(str(arg))

    # Add kwargs to key (sorted by key name)
    for k, v in sorted(kwargs.items()):
        # Skip 'db' session objects or other unhashable types if possible
        # This is a naive check; in FastAPI, 'db' is usually a dependency.
        # We assume service functions won't cache on 'db' object identity but on query params.
        if k == 'db':
            continue
        key_parts.append(f"{k}:{v}")

    # Hash the key string for compact storage
    key_str = "|".join(key_parts)
    return hashlib.md5(key_str.encode()).hexdigest()

def ttl_cache(ttl_seconds: int = 60):
    """
    Decorator to cache function results for a specific TTL.
    Ignores the 'db' argument in cache key generation.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Prune expired entries periodically (naive approach: check on write)
            # A background task would be better, but overkill for this.

            key = generate_cache_key(func.__name__, *args, **kwargs)
            now = time.time()

            # Check cache hit
            if key in _CACHE:
                result, expiry = _CACHE[key]
                if now < expiry:
                    return result
                else:
                    del _CACHE[key]

            # Cache miss - execute function
            result = func(*args, **kwargs)

            # Store in cache
            _CACHE[key] = (result, now + ttl_seconds)
            return result

        return wrapper
    return decorator

def clear_cache():
    """Clear all cached entries."""
    _CACHE.clear()
