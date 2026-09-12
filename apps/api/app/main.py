from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.rate_limit import limiter
from app.routers import (
    ai,
    ai_assistant,
    analytics,
    auth,
    automation,
    billing,
    calendar,
    checkins,
    client_import,
    clients,
    coach,
    custom_fields,
    documents,
    forms,
    geo,
    goals,
    integrations,
    invite,
    leads,
    metrics,
    mfa,
    notifications,
    payments_paddle,
    portal,
    programs,
    progress_entries,
    sessions,
    tasks,
    threads,
    timeline,
    todos,
    webhooks,
)
from app.scheduler import start_scheduler, stop_scheduler

app = FastAPI(title="CoachevaOS API")

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=429, content={"detail": "Too many requests, please try again later."})


app.add_middleware(SlowAPIMiddleware)


DOCS_PATHS = {"/docs", "/redoc", "/openapi.json"}


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    # Swagger/Redoc load their own CDN assets — skip the strict CSP there so /docs stays usable.
    if request.url.path not in DOCS_PATHS:
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https:; "
            "media-src 'self' https:; "
            "script-src 'self' https://cdn.paddle.com https://checkout.razorpay.com; "
            "frame-src 'self' https://buy.paddle.com https://checkout.paddle.com "
            "https://sandbox-buy.paddle.com https://sandbox-checkout.paddle.com "
            "https://checkout.razorpay.com https://api.razorpay.com; "
            "style-src 'self' 'unsafe-inline'; "
            "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com "
            "https://www.googleapis.com https://api.openai.com "
            "https://api.paddle.com https://sandbox-api.paddle.com "
            "https://checkout-service.paddle.com https://sandbox-checkout-service.paddle.com "
            "https://api.razorpay.com https://lumberjack.razorpay.com; "
            "frame-ancestors 'none'"
        )
    if settings.environment != "development":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(mfa.router)
app.include_router(coach.router)
app.include_router(geo.router)
app.include_router(portal.router)
app.include_router(clients.router)
app.include_router(client_import.router)
app.include_router(custom_fields.router)
app.include_router(goals.router)
app.include_router(programs.router)
app.include_router(progress_entries.router)
app.include_router(metrics.router)
app.include_router(sessions.router)
app.include_router(timeline.router)
app.include_router(leads.router)
app.include_router(forms.router)
app.include_router(invite.router)
app.include_router(documents.router)
app.include_router(tasks.tasks_router)
app.include_router(tasks.client_tasks_router)
app.include_router(todos.router)
app.include_router(threads.router)
app.include_router(calendar.router)
app.include_router(integrations.router)
app.include_router(webhooks.router)
app.include_router(checkins.router)
app.include_router(billing.router)
app.include_router(payments_paddle.router)
app.include_router(payments_paddle.subscription_router)
app.include_router(ai.router)
app.include_router(ai_assistant.router)
app.include_router(automation.router)
app.include_router(notifications.router)
app.include_router(analytics.router)


@app.on_event("startup")
async def on_startup() -> None:
    if settings.environment != "development" and settings.jwt_secret == "dev-secret-change-me":
        raise RuntimeError(
            "JWT_SECRET is still the default dev value in a non-development environment — "
            "set a real secret before starting the app."
        )
    start_scheduler()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    stop_scheduler()


@app.get("/health")
async def health() -> dict[str, str]:
    # No DB/external calls on purpose — Render (and any uptime pinger) hits
    # this frequently, so it needs to stay negligible-cost and always fast,
    # never fail because a downstream dependency is slow.
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}
