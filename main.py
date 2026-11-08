from fastapi import FastAPI
from app.database import engine, Base
from app.models import Base as modelo_base

modelo_base.metadata.create_all(bind=engine)

app = FastAPI(title="Literalia API", version="1.0.0")


@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido al backend de Literalia API"}
