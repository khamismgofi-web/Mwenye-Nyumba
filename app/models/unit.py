import enum
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.property import Property
    from app.models.tenant import Tenant
    from app.models.maintenance import MaintenanceRequest


class UnitStatus(str, enum.Enum):
    VACANT = "vacant"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"


class Unit(Base, TimestampMixin):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    property_id: Mapped[int] = mapped_column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_number: Mapped[str] = mapped_column(String(50), nullable=False)
    rent_amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[UnitStatus] = mapped_column(
        Enum(UnitStatus, name="unit_status", native_enum=False),
        default=UnitStatus.VACANT,
        nullable=False
    )
    floor: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bedrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1)
    bathrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1)

    # Relationships
    property: Mapped["Property"] = relationship("Property", back_populates="units")
    tenants: Mapped[List["Tenant"]] = relationship("Tenant", back_populates="unit", cascade="all, delete-orphan")
    maintenance_requests: Mapped[List["MaintenanceRequest"]] = relationship("MaintenanceRequest", back_populates="unit", cascade="all, delete-orphan")
