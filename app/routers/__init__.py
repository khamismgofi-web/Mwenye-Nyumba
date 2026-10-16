from app.routers.auth import router as auth_router
from app.routers.properties import router as properties_router
from app.routers.units import router as units_router
from app.routers.tenants import router as tenants_router
from app.routers.payments import router as payments_router
from app.routers.entries import router as entries_router
from app.routers.invite_code import router as invite_code_router
from app.routers.maintenance import router as maintenance_router

__all__ = [
    "auth_router",
    "properties_router",
    "units_router",
    "tenants_router",
    "payments_router",
    "maintenance_router",
    "invite_code_router",
    "entries_router",
]
