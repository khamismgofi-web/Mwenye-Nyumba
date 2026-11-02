import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import DBAPIError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.core.jobs import overdue_loop
from app.core.schema import OUT_OF_DATE, looks_like_missing_schema, schema_problem
from app.models import Base
from app.routers import (
    auth_router,
    entries_router,
    internal_router,
    invite_code_router,
    maintenance_router,
    payments_router,
    properties_router,
    tenants_router,
    units_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.auto_create_tables:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    task = None
    if settings.ENVIRONMENT != "test" and not settings.serverless:
        task = asyncio.create_task(overdue_loop())
    yield
    if task:
        task.cancel()
    await engine.dispose()


docs_enabled = not settings.is_production

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if docs_enabled else None,
    docs_url=f"{settings.API_V1_STR}/docs" if docs_enabled else None,
    redoc_url=f"{settings.API_V1_STR}/redoc" if docs_enabled else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(invite_code_router, prefix=settings.API_V1_STR)
app.include_router(entries_router, prefix=settings.API_V1_STR)
app.include_router(internal_router, prefix=settings.API_V1_STR)
app.include_router(properties_router, prefix=settings.API_V1_STR)
app.include_router(units_router, prefix=settings.API_V1_STR)
app.include_router(tenants_router, prefix=settings.API_V1_STR)
app.include_router(payments_router, prefix=settings.API_V1_STR)
app.include_router(maintenance_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"app": settings.PROJECT_NAME, "status": "online", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.exception_handler(DBAPIError)
async def database_error_handler(request: Request, exc: DBAPIError):
    import logging

    logging.getLogger(__name__).exception("Database error on %s", request.url.path)
    if looks_like_missing_schema(exc):
        return JSONResponse(status_code=503, content={"detail": OUT_OF_DATE})
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@app.get("/health/ready")
async def readiness_check():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")
    if settings.is_production:
        problem = await schema_problem(engine)
        if problem:
            raise HTTPException(status_code=503, detail=problem)
    return {"status": "ready"}
