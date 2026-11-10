
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import (
    ClienteModel,
    LibroModel,
    MovimientoInventarioModel,
    VentaModel,
    DetalleVentaModel,
)
from app.schemas_transacciones import (
    MovimientoCreate,
    ClienteCreate,
    VentaCreate,
)
from app.repositories import (
    InventarioRepository,
    VentaRepository,
)
from app.auth_roles import requiere_roles
from app.patterns.strategy_descuentos import (
    CalculadoraDescuento,
    SinDescuento,
    DescuentoPromocional,
)


router = APIRouter(tags=["Transacciones"])
CENT = Decimal("0.01")


def dinero(numero):
    return Decimal(str(numero)).quantize(
        CENT, rounding=ROUND_HALF_UP
    )


# INVENTARIO

@router.get("/inventario")
def inventario(
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin", "vendedor")),
):
    libros = db.query(LibroModel).filter(
        LibroModel.activo.is_(True)
    ).all()

    return [
        {
            "libro_id": libro.id,
            "titulo": libro.titulo,
            "stock": libro.stock,
            "stock_minimo": libro.stock_minimo,
            "bajo_minimo": libro.stock <= libro.stock_minimo,
        }
        for libro in libros
    ]


@router.post("/inventario/movimientos", status_code=201)
def mover_stock(
    datos: MovimientoCreate,
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin")),
):
    repo = InventarioRepository(db)
    libro = repo.obtener_libro(datos.libro_id)

    if not libro or not libro.activo:
        raise HTTPException(
            404, "Libro no encontrado o inactivo"
        )

    diferencia = (
        datos.cantidad
        if datos.tipo == "entrada"
        else -datos.cantidad
    )

    try:
        if not repo.modificar_stock(
            datos.libro_id, diferencia
        ):
            raise HTTPException(
                409, "Stock insuficiente"
            )

        movimiento = repo.registrar_movimiento(
            datos.libro_id,
            usuario.id,
            datos.tipo,
            datos.cantidad,
            datos.motivo,
        )

        db.flush()
        movimiento_id = movimiento.id
        db.commit()

        return {
            "mensaje": "Movimiento registrado",
            "id": movimiento_id,
        }

    except Exception:
        db.rollback()
        raise


@router.get("/inventario/movimientos")
def listar_movimientos(
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin", "vendedor")),
):
    return db.query(MovimientoInventarioModel).order_by(
        MovimientoInventarioModel.id.desc()
    ).all()


# CLIENTES

@router.get("/clientes")
def listar_clientes(
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin", "vendedor")),
):
    return db.query(ClienteModel).filter(
        ClienteModel.activo.is_(True)
    ).all()


@router.post("/clientes", status_code=201)
def crear_cliente(
    datos: ClienteCreate,
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin", "vendedor")),
):
    cliente = ClienteModel(**datos.model_dump())
    db.add(cliente)

    try:
        db.commit()
        db.refresh(cliente)
        return cliente

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "Ya existe un cliente con ese correo"
        )


@router.get("/clientes/{cliente_id}")
def obtener_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin", "vendedor")),
):
    cliente = db.get(ClienteModel, cliente_id)

    if not cliente or not cliente.activo:
        raise HTTPException(
            404, "Cliente no encontrado"
        )

    return cliente


@router.put("/clientes/{cliente_id}")
def actualizar_cliente(
    cliente_id: int,
    datos: ClienteCreate,
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin", "vendedor")),
):
    cliente = db.get(ClienteModel, cliente_id)

    if not cliente or not cliente.activo:
        raise HTTPException(
            404, "Cliente no encontrado"
        )

    for clave, valor in datos.model_dump().items():
        setattr(cliente, clave, valor)

    try:
        db.commit()
        db.refresh(cliente)
        return cliente

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "Ya existe un cliente con ese correo"
        )


# VENTAS

@router.post("/ventas", status_code=201)
def registrar_venta(
    datos: VentaCreate,
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin", "vendedor")),
):
    cliente = db.get(ClienteModel, datos.cliente_id)

    if not cliente or not cliente.activo:
        raise HTTPException(
            404, "Cliente no encontrado"
        )

    ids = [item.libro_id for item in datos.items]

    if len(ids) != len(set(ids)):
        raise HTTPException(
            422,
            "No repitas libros; suma sus cantidades",
        )

    inventario = InventarioRepository(db)
    ventas = VentaRepository(db)

    subtotal = Decimal("0")
    detalles = []

    try:
        for item in sorted(
            datos.items, key=lambda i: i.libro_id
        ):
            libro = inventario.obtener_libro(item.libro_id)

            if not libro or not libro.activo:
                raise HTTPException(
                    404,
                    f"Libro {item.libro_id} no encontrado",
                )

            precio = dinero(libro.precio)

            if precio < 0:
                raise HTTPException(
                    409, "Precio inválido"
                )

            if not inventario.modificar_stock(
                libro.id, -item.cantidad
            ):
                raise HTTPException(
                    409,
                    f"Stock insuficiente para {libro.titulo}",
                )

            importe = dinero(precio * item.cantidad)
            subtotal += importe

            detalles.append((
                libro.id,
                item.cantidad,
                precio,
                importe,
            ))

        porcentaje = (
            datos.porcentaje_descuento / Decimal("100")
        )

        estrategia = (
            SinDescuento()
            if porcentaje == 0
            else DescuentoPromocional(float(porcentaje))
        )

        calculadora = CalculadoraDescuento(estrategia)

        total = dinero(
            calculadora.aplicar_descuento(float(subtotal))
        )

        descuento = subtotal - total

        venta = ventas.crear(
            cliente.id,
            usuario.id,
            subtotal,
            descuento,
            total,
        )

        for libro_id, cantidad, precio, importe in detalles:
            ventas.agregar_detalle(
                venta.id,
                libro_id,
                cantidad,
                precio,
                importe,
            )

            inventario.registrar_movimiento(
                libro_id,
                usuario.id,
                "salida",
                cantidad,
                f"Venta #{venta.id}",
            )

        venta_id = venta.id
        db.commit()

        return {
            "id": venta_id,
            "subtotal": subtotal,
            "descuento": descuento,
            "total": total,
            "mensaje": "Venta registrada correctamente",
        }

    except Exception:
        db.rollback()
        raise


@router.get("/ventas")
def listar_ventas(
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin", "vendedor")),
):
    return db.query(VentaModel).order_by(
        VentaModel.id.desc()
    ).all()


@router.get("/ventas/{venta_id}")
def detalle_venta(
    venta_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin", "vendedor")),
):
    venta = db.get(VentaModel, venta_id)

    if not venta:
        raise HTTPException(
            404, "Venta no encontrada"
        )

    detalles = db.query(DetalleVentaModel).filter(
        DetalleVentaModel.venta_id == venta_id
    ).all()

    return {
        "venta": venta,
        "detalles": detalles,
    }
