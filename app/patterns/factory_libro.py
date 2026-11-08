class LibroBase:
    def __init__(self, isbn, titulo, autor, categoria, precio, stock, stock_minimo):
        self.isbn = isbn
        self.titulo = titulo
        self.autor = autor
        self.categoria = categoria
        self.precio = precio
        self.stock = stock
        self.stock_minimo = stock_minimo


class CreadorLibroFactory:
    @staticmethod
    def crear_libro(datos: dict):
        return LibroBase(
            isbn=datos.get("isbn"),
            titulo=datos.get("titulo"),
            autor=datos.get("autor"),
            categoria=datos.get("categoria"),
            precio=datos.get("precio"),
            stock=datos.get("stock", 0),
            stock_minimo=datos.get("stock_minimo", 5),
        )
