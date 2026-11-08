from fastapi import FastAPI, Depends, HTTPException, status
from app.database import engine, Base, get_db
from app.models import Base as modelo_base, LibroModel
from sqlalchemy.orm import Session
from app.schemas import LibroCreate
from app.patterns.factory_libro import CreadorLibroFactory

modelo_base.metadata.create_all(bind=engine)

app = FastAPI(title="Literalia API", version="1.0.0")


@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido al backend de Literalia API"}


# Endpoints libros
@app.get("/libros", status_code=status.HTTP_200_OK)
def listar_libros(db: Session = Depends(get_db)):
    libros = db.query(LibroModel).all()
    return libros


@app.post("/libros", status_code=status.HTTP_201_CREATED)
def crear_libro(libro_data: LibroCreate, db: Session = Depends(get_db)):
    libro_existente = (
        db.query(LibroModel).filter(LibroModel.isbn == libro_data.isbn).first()
    )
    if libro_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un libro registrado con este ISBN.",
        )

    datos_dict = libro_data.dict()
    nuevo_libro_objeto = CreadorLibroFactory.crear_libro(datos_dict)

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


@app.get("/libros/{libro_id}", status_code=status.HTTP_200_OK)
def obtener_libro_por_id(libro_id: int, db: Session = Depends(get_db)):
    libro = db.query(LibroModel).filter(LibroModel.id == libro_id).first()
    if not libro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Libro no encontrado en el sistema.",
        )
    return libro


@app.put("/libros/{libro_id}", status_code=status.HTTP_200_OK)
def actualizar_libro(
    libro_id: int, libro_data: LibroCreate, db: Session = Depends(get_db)
):
    db_libro = db.query(LibroModel).filter(LibroModel.id == libro_id).first()
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
    db_libro.stock = libro_data.stock
    db_libro.stock_minimo = libro_data.stock_minimo

    db.commit()
    db.refresh(db_libro)

    return {"mensaje": "Libro actualizado exitosamente", "libro": db_libro}
