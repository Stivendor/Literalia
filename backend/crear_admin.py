
import os

from app.database import SessionLocal, engine, Base
from app.models import UsuarioModel
from app.security import hash_contrasena


correo = os.getenv("ADMIN_EMAIL")
clave = os.getenv("ADMIN_PASSWORD")

if not correo or not clave or len(clave) < 12:
    raise SystemExit(
        "Define ADMIN_EMAIL y ADMIN_PASSWORD "
        "con una contraseña de mínimo 12 caracteres"
    )

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    existente = db.query(UsuarioModel).filter_by(
        correo=correo
    ).first()

    if existente:
        raise SystemExit(
            "Ese correo ya existe; no se modifica su rol"
        )

    administrador = UsuarioModel(
        nombre="Administrador",
        correo=correo,
        contrasena=hash_contrasena(clave),
        rol="admin",
        estado=True,
    )

    db.add(administrador)
    db.commit()

print("Administrador creado correctamente")
