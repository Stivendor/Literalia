from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base


class UsuarioModel(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    correo = Column(String, unique=True, index=True)
    contrasena_hash = Column(String)
    rol = Column(String)
    activo = Column(Boolean, default=True)


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
