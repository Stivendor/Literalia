from pydantic import BaseModel


class LibroCreate(BaseModel):
    isbn: str
    titulo: str
    autor: str
    categoria: str
    precio: float
    stock: int
    stock_minimo: int


class LoginRequest(BaseModel):
    correo: str
    contrasena: str
