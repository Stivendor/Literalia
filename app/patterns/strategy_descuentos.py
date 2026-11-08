from abc import ABC, abstractmethod


class EstrategiaDescuento(ABC):
    @abstractmethod
    def calcular(self, subtotal: float) -> float:
        pass


class SinDescuento(EstrategiaDescuento):
    def calcular(self, subtotal: float) -> float:
        return subtotal


class DescuentoPromocional(EstrategiaDescuento):
    def __init__(self, porcentaje: float):
        self.porcentaje = porcentaje

    def calcular(self, subtotal: float) -> float:
        return subtotal * (1 - self.porcentaje)
