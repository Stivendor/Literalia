from pydantic import BaseModel, EmailStr


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

class UsuarioCreate(BaseModel):
    nombre: str
    correo: EmailStr
    contrasena: str

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    correo: str
    estado: bool

    class Config:
        from_attributes = True
