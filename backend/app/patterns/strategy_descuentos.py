from abc import ABC, abstractmethod


class EstrategiaDescuento(ABC):
    @abstractmethod
    def calcular_precio_final(self, precio_original: float) -> float:
        pass


class SinDescuento(EstrategiaDescuento):
    def calcular_precio_final(self, precio_original: float) -> float:
        return precio_original

#despuento en porcentaje decimal 0.10, 0.20, 0.30...
class DescuentoPromocional(EstrategiaDescuento):
    def __init__(self, porcentaje: float):
        self.porcentaje = porcentaje

    def calcular_precio_final(self, precio_original: float) -> float:
        return precio_original * (1 - self.porcentaje)


class CalculadoraDescuento:
    def __init__(self, estrategia: EstrategiaDescuento):
        self.estrategia = estrategia

    def aplicar_descuento(self, precio_original: float) -> float:
        return self.estrategia.calcular_precio_final(precio_original)
