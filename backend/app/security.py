from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_contrasena(contrasena: str) -> str:
    return pwd_context.hash(contrasena[:72])


def verificar_contrasena(contrasena_plana: str, contrasena_hash: str) -> bool:
    return pwd_context.verify(contrasena_plana[:72], contrasena_hash)
