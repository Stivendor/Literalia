
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import UsuarioModel


bearer = HTTPBearer(auto_error=False)


def crear_token(usuario):
    secreto = os.getenv("JWT_SECRET")

    if not secreto or len(secreto) < 32:
        raise HTTPException(
            status_code=503,
            detail="Configurar JWT_SECRET de mínimo 32 caracteres",
        )

    payload = {
        "sub": str(usuario.id),
        "exp": datetime.now(timezone.utc)
        + timedelta(hours=8),
    }

    return jwt.encode(
        payload, secreto, algorithm="HS256"
    )


def usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
):
    secreto = os.getenv("JWT_SECRET")

    if not credenciales or not secreto or len(secreto) < 32:
        raise HTTPException(
            status_code=401,
            detail="Se requiere un token válido",
        )

    try:
        payload = jwt.decode(
            credenciales.credentials,
            secreto,
            algorithms=["HS256"],
        )
        usuario_id = int(payload["sub"])

    except (jwt.PyJWTError, ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Token inválido o vencido",
        )

    usuario = db.get(UsuarioModel, usuario_id)

    if not usuario or not usuario.estado:
        raise HTTPException(
            status_code=401,
            detail="Usuario no autorizado",
        )

    return usuario


def requiere_roles(*roles):
    def validar(
        usuario: UsuarioModel = Depends(usuario_actual),
    ):
        if usuario.rol not in roles:
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para esta operación",
            )

        return usuario

    return validar
