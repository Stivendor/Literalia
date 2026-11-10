
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field


class MovimientoCreate(BaseModel):
    libro_id: int = Field(gt=0)
    tipo: str = Field(pattern="^(entrada|salida)$")
    cantidad: int = Field(gt=0)
    motivo: str = Field(min_length=3, max_length=255)


class ClienteCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    correo: EmailStr | None = None
    telefono: str | None = Field(
        default=None, max_length=30
    )


class ItemVenta(BaseModel):
    libro_id: int = Field(gt=0)
    cantidad: int = Field(gt=0)


class VentaCreate(BaseModel):
    cliente_id: int = Field(gt=0)
    items: list[ItemVenta] = Field(min_length=1)
    porcentaje_descuento: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=100,
    )
