
"""Patrón Repository: persistencia de inventario y ventas."""

from sqlalchemy import update
from app.models import (
    LibroModel,
    VentaModel,
    DetalleVentaModel,
    MovimientoInventarioModel,
)


class InventarioRepository:
    def __init__(self, db):
        self.db = db

    def obtener_libro(self, libro_id):
        return self.db.get(LibroModel, libro_id)

    def modificar_stock(self, libro_id, diferencia):
        resultado = self.db.execute(
            update(LibroModel)
            .where(
                LibroModel.id == libro_id,
                LibroModel.activo.is_(True),
                LibroModel.stock + diferencia >= 0,
            )
            .values(stock=LibroModel.stock + diferencia)
        )
        return resultado.rowcount == 1

    def registrar_movimiento(
        self, libro_id, usuario_id,
        tipo, cantidad, motivo
    ):
        movimiento = MovimientoInventarioModel(
            libro_id=libro_id,
            usuario_id=usuario_id,
            tipo=tipo,
            cantidad=cantidad,
            motivo=motivo,
        )
        self.db.add(movimiento)
        return movimiento


class VentaRepository:
    def __init__(self, db):
        self.db = db

    def crear(
        self, cliente_id, usuario_id,
        subtotal, descuento, total
    ):
        venta = VentaModel(
            cliente_id=cliente_id,
            usuario_id=usuario_id,
            subtotal=subtotal,
            descuento=descuento,
            total=total,
        )
        self.db.add(venta)
        self.db.flush()
        return venta

    def agregar_detalle(
        self, venta_id, libro_id,
        cantidad, precio, subtotal
    ):
        detalle = DetalleVentaModel(
            venta_id=venta_id,
            libro_id=libro_id,
            cantidad=cantidad,
            precio_unitario=precio,
            subtotal=subtotal,
        )
        self.db.add(detalle)
        return detalle
