from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base


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


class UsuarioModel(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    correo = Column(String, unique=True, index=True, nullable=False)
    contrasena = Column(String, nullable=False)
    estado = Column(Boolean, default=True)
