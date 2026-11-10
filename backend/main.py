
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.models import (
    Base as modelo_base,
    LibroModel,
    UsuarioModel,
)
from app.schemas import (
    LibroCreate,
    LoginRequest,
    UsuarioCreate,
    UsuarioResponse,
)
from app.patterns.factory_libro import CreadorLibroFactory
from app.security import hash_contrasena, verificar_contrasena

# IMPORTS DEL INTEGRANTE 2
from app.routes_transacciones import router as transacciones_router
from app.auth_roles import crear_token, requiere_roles


# MIGRACIÓN DE ROLES PARA SQLITE
# Agrega la columna rol si ya existía la tabla usuarios.
if engine.dialect.name == "sqlite":
    inspector = inspect(engine)

    if inspector.has_table("usuarios"):
        columnas = [
            columna["name"]
            for columna in inspector.get_columns("usuarios")
        ]

        if "rol" not in columnas:
            with engine.begin() as conexion:
                conexion.execute(
                    text(
                        "ALTER TABLE usuarios "
                        "ADD COLUMN rol VARCHAR(20) "
                        "NOT NULL DEFAULT 'vendedor'"
                    )
                )


# CREAR TABLAS QUE TODAVÍA NO EXISTAN
modelo_base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Literalia API",
    version="1.0.0",
)


# CONECTAR INVENTARIO, CLIENTES Y VENTAS
app.include_router(transacciones_router)


@app.get("/")
def read_root():
    return {
        "mensaje": "Bienvenido al backend de Literalia API"
    }


# ======================================
# ENDPOINTS DE LIBROS
# ======================================

@app.get(
    "/libros",
    status_code=status.HTTP_200_OK,
)
def listar_libros(db: Session = Depends(get_db)):
    libros = db.query(LibroModel).all()
    return libros


@app.post(
    "/libros",
    status_code=status.HTTP_201_CREATED,
)
def crear_libro(
    libro_data: LibroCreate,
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin")),
):
    libro_existente = (
        db.query(LibroModel)
        .filter(LibroModel.isbn == libro_data.isbn)
        .first()
    )

    if libro_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un libro registrado con este ISBN.",
        )

    datos_dict = libro_data.model_dump()
    nuevo_libro_objeto = CreadorLibroFactory.crear_libro(
        datos_dict
    )

    db_libro = LibroModel(
        isbn=nuevo_libro_objeto.isbn,
        titulo=nuevo_libro_objeto.titulo,
        autor=nuevo_libro_objeto.autor,
        categoria=nuevo_libro_objeto.categoria,
        precio=nuevo_libro_objeto.precio,
        stock=nuevo_libro_objeto.stock,
        stock_minimo=nuevo_libro_objeto.stock_minimo,
    )

    db.add(db_libro)
    db.commit()
    db.refresh(db_libro)

    return {
        "mensaje": "Libro registrado exitosamente con Factory Method",
        "libro": db_libro,
    }


@app.get(
    "/libros/{libro_id}",
    status_code=status.HTTP_200_OK,
)
def obtener_libro_por_id(
    libro_id: int,
    db: Session = Depends(get_db),
):
    libro = (
        db.query(LibroModel)
        .filter(LibroModel.id == libro_id)
        .first()
    )

    if not libro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Libro no encontrado en el sistema.",
        )

    return libro


@app.put(
    "/libros/{libro_id}",
    status_code=status.HTTP_200_OK,
)
def actualizar_libro(
    libro_id: int,
    libro_data: LibroCreate,
    db: Session = Depends(get_db),
    usuario=Depends(requiere_roles("admin")),
):
    db_libro = (
        db.query(LibroModel)
        .filter(LibroModel.id == libro_id)
        .first()
    )

    if not db_libro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se puede actualizar. El libro no existe.",
        )

    db_libro.isbn = libro_data.isbn
    db_libro.titulo = libro_data.titulo
    db_libro.autor = libro_data.autor
    db_libro.categoria = libro_data.categoria
    db_libro.precio = libro_data.precio
    db_libro.stock_minimo = libro_data.stock_minimo

    # El stock se administra mediante el módulo de inventario.
    # No se modifica directamente al actualizar un libro.

    db.commit()
    db.refresh(db_libro)

    return {
        "mensaje": "Libro actualizado exitosamente",
        "libro": db_libro,
    }


# ======================================
# REGISTRO DE USUARIOS
# ======================================

@app.post(
    "/auth/registro",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
):
    db_usuario = (
        db.query(UsuarioModel)
        .filter(UsuarioModel.correo == usuario.correo)
        .first()
    )

    if db_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya se encuentra registrado.",
        )

    contrasena_segura = hash_contrasena(
        usuario.contrasena
    )

    nuevo_usuario = UsuarioModel(
        nombre=usuario.nombre,
        correo=usuario.correo,
        contrasena=contrasena_segura,
        estado=True,
        rol="vendedor",
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario


# ======================================
# INICIO DE SESIÓN CON JWT
# ======================================

@app.post(
    "/auth/login",
    status_code=status.HTTP_200_OK,
)
def iniciar_sesion(
    credenciales: LoginRequest,
    db: Session = Depends(get_db),
):
    usuario = (
        db.query(UsuarioModel)
        .filter(
            UsuarioModel.correo == credenciales.correo
        )
        .first()
    )

    if not usuario or not verificar_contrasena(
        credenciales.contrasena,
        usuario.contrasena,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos.",
        )

    if not usuario.estado:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta se encuentra inactiva.",
        )

    token = crear_token(usuario)

    return {
        "mensaje": f"Bienvenido de nuevo, {usuario.nombre}",
        "correo": usuario.correo,
        "estado": "Autenticado con éxito",
        "rol": usuario.rol,
        "access_token": token,
        "token_type": "bearer",
    }
