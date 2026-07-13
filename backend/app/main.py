import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter, Histogram

# Prometheus metrics setup
REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "endpoint", "http_status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency", ["endpoint"])

# Custom Exceptions
class MonetizationError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class PaymentError(MonetizationError):
    pass

class WebhookVerificationError(MonetizationError):
    pass

class SubscriptionError(MonetizationError):
    pass

# Mock services health check helpers
async def check_db_health() -> bool:
    # Under real conditions, executes "SELECT 1" on Supabase/PostgreSQL connection pool
    return True

async def check_redis_health() -> bool:
    # Under real conditions, executes redis_client.ping()
    return True

async def check_stripe_health() -> bool:
    # Under real conditions, fetches a mock Stripe price/customer via API
    return True

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB connection pool, Redis clients, Stripe configuration
    print("[STARTUP] Initializing monetization services, database connections, and cache pools...")
    yield
    # Shutdown: Close database pools, Redis clients, clean up locks
    print("[SHUTDOWN] Terminating connection pools and flushing buffers...")

# Environment checks
IS_DEV = os.getenv("ENV", "development").lower() == "development"

app = FastAPI(
    title="Antigravity Monetization Engine",
    description="Backend API mapping sub-ledgers, metered billing, subscriptions, and affiliate systems.",
    version="3.0",
    docs_url="/docs" if IS_DEV else None,
    redoc_url="/redoc" if IS_DEV else None,
    openapi_url="/openapi.json" if IS_DEV else None,
    lifespan=lifespan
)

# Register routers
from routers import subscriptions, stripe_webhooks
app.include_router(subscriptions.router)
app.include_router(stripe_webhooks.router)

# 1. CORS Middleware
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://app.antigravity.dev").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 2. Trusted Host Middleware
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,api.antigravity.dev,testserver").split(",")
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=ALLOWED_HOSTS
)

# 3. GZip Middleware
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000
)

# Custom Exception Handlers
@app.exception_handler(MonetizationError)
async def monetization_error_handler(request: Request, exc: MonetizationError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.__class__.__name__, "message": exc.message}
    )

# Middleware for request tracing and metric recording
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.monotonic()
    response = await call_next(request)
    duration = time.monotonic() - start_time
    
    endpoint = request.url.path
    method = request.method
    status_code = response.status_code
    
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, http_status=status_code).inc()
    REQUEST_LATENCY.labels(endpoint=endpoint).observe(duration)
    
    response.headers["X-Process-Time"] = f"{duration:.4f}s"
    return response

# 4. Health Check Endpoint
@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    db_ok = await check_db_health()
    redis_ok = await check_redis_health()
    stripe_ok = await check_stripe_health()
    
    overall_status = "HEALTHY" if (db_ok and redis_ok and stripe_ok) else "DEGRADED"
    
    return {
        "status": overall_status,
        "timestamp": time.time(),
        "services": {
            "database": "UP" if db_ok else "DOWN",
            "redis_cache": "UP" if redis_ok else "DOWN",
            "stripe_api": "UP" if stripe_ok else "DOWN"
        }
    }

# 5. Prometheus Metrics Endpoint
@app.get("/metrics")
async def metrics_endpoint():
    return JSONResponse(
        content=generate_latest().decode("utf-8"),
        media_type=CONTENT_TYPE_LATEST
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=IS_DEV)
