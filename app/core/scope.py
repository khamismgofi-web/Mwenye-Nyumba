from sqlalchemy import select

from app.models.property import Property
from app.models.tenant import Tenant
from app.models.unit import Unit
from app.models.user import User


def owned_property_ids(landlord: User):
    return select(Property.id).where(Property.owner_id == landlord.id)


def owned_unit_ids(landlord: User):
    return select(Unit.id).where(Unit.property_id.in_(owned_property_ids(landlord)))


def owned_tenant_ids(landlord: User):
    return select(Tenant.id).where(Tenant.unit_id.in_(owned_unit_ids(landlord)))
