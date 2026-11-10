
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    ForeignKey,
    DateTime,
    Numeric,
)
from sqlalchemy.sql import func
from app.database import Base


# MODELO DE LIBROS
class LibroModel(Base):
    __tablename__ = "libros"

    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String, unique=True, index=True)
    titulo = Column(String)
    autor = Column(String)
    categoria = Column(String)
    precio = Column(Float)
    stock = Column(Integer)
    stock_minimo = Column(Integer)
    activo = Column(Boolean, default=True)


# MODELO DE USUARIOS
class UsuarioModel(Base):
    __tablename__ = "usuarios"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )
    nombre = Column(String, nullable=False)
    correo = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )
    contrasena = Column(String, nullable=False)
    estado = Column(Boolean, default=True)
    rol = Column(
        String(20),
        nullable=False,
        default="vendedor",
        server_default="vendedor",
    )


# MODELO DE CLIENTES
class ClienteModel(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(150), nullable=False)
    correo = Column(String(255), unique=True)
    telefono = Column(String(30))
    activo = Column(Boolean, nullable=False, default=True)


# MODELO DE MOVIMIENTOS DE INVENTARIO
class MovimientoInventarioModel(Base):
    __tablename__ = "movimientos_inventario"

    id = Column(Integer, primary_key=True)

    libro_id = Column(
        Integer,
        ForeignKey("libros.id"),
        nullable=False,
    )

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False,
    )

    tipo = Column(String(20), nullable=False)
    cantidad = Column(Integer, nullable=False)
    motivo = Column(String(255), nullable=False)

    fecha = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


# MODELO DE VENTAS
class VentaModel(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True)

    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id"),
        nullable=False,
    )

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False,
    )

    subtotal = Column(Numeric(12, 2), nullable=False)
    descuento = Column(Numeric(12, 2), nullable=False)
    total = Column(Numeric(12, 2), nullable=False)

    fecha = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


# MODELO DE DETALLES DE VENTA
class DetalleVentaModel(Base):
    __tablename__ = "detalles_venta"

    id = Column(Integer, primary_key=True)

    venta_id = Column(
        Integer,
        ForeignKey("ventas.id"),
        nullable=False,
    )

    libro_id = Column(
        Integer,
        ForeignKey("libros.id"),
        nullable=False,
    )

    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(
        Numeric(12, 2),
        nullable=False,
    )
    subtotal = Column(Numeric(12, 2), nullable=False)
