// node src/libros.check.js
import assert from 'node:assert/strict'
import { estadoLibro, toCSV, formatoPrecio, normalizar } from './libros.js'

assert.equal(estadoLibro({ stock: 0, stock_minimo: 5 }), 'Agotado')
assert.equal(estadoLibro({ stock: 5, stock_minimo: 5 }), 'Bajo Stock')
assert.equal(estadoLibro({ stock: 6, stock_minimo: 5 }), 'Disponible')

const csv = toCSV([{ isbn: '1', titulo: 'Hola; "mundo"', autor: 'A', categoria: 'C', precio: 100, stock: 0, stock_minimo: 1 }])
assert.ok(csv.startsWith('﻿isbn;titulo;autor;categoria;precio;stock;stock_minimo;estado\n'))
assert.ok(csv.endsWith('1;"Hola; ""mundo""";A;C;100;0;1;Agotado'))

assert.equal(formatoPrecio(89900), '$89.900')
assert.equal(normalizar('García MÁRQUEZ'), 'garcia marquez')

console.log('ok')
