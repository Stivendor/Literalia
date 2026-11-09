import os
import re

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Local: SQLite. En Vercel: DATABASE_URL (Postgres de Neon), porque el disco de Vercel no persiste.
SQLALCHEMY_DATABASE_URL = re.sub(
    r"^postgres(ql)?://",
    "postgresql+psycopg://",
    os.getenv("DATABASE_URL", "sqlite:///./literalia.db"),
)

es_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if es_sqlite else {},
    pool_pre_ping=not es_sqlite,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
