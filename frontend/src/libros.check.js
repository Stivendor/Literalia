// node src/libros.check.js
import assert from 'node:assert/strict'
import { esDelMes, estadoLibro, toCSV, formatoPrecio, normalizar, parseFecha } from './libros.js'

assert.equal(estadoLibro({ stock: 0, stock_minimo: 5 }), 'Agotado')
assert.equal(estadoLibro({ stock: 5, stock_minimo: 5 }), 'Bajo Stock')
assert.equal(estadoLibro({ stock: 6, stock_minimo: 5 }), 'Disponible')

const csv = toCSV([{ isbn: '1', titulo: 'Hola; "mundo"', autor: 'A', categoria: 'C', precio: 100, stock: 0, stock_minimo: 1 }])
assert.ok(csv.startsWith('﻿isbn;titulo;autor;categoria;precio;stock;stock_minimo;estado\n'))
assert.ok(csv.endsWith('1;"Hola; ""mundo""";A;C;100;0;1;Agotado'))

assert.equal(formatoPrecio(89900), '$89.900')
assert.equal(normalizar('García MÁRQUEZ'), 'garcia marquez')

// sin zona = UTC (SQLite); con offset se respeta (Postgres)
assert.equal(parseFecha('2026-11-12T14:08:54').toISOString(), '2026-11-12T14:08:54.000Z')
assert.equal(parseFecha('2026-11-12T14:08:54.5+00:00').toISOString(), '2026-11-12T14:08:54.500Z')
assert.equal(parseFecha('2026-11-12T09:00:00-05:00').toISOString(), '2026-11-12T14:00:00.000Z')
assert.ok(esDelMes('2026-11-30T12:00:00', new Date(2026, 10, 1)))
assert.ok(!esDelMes('2026-10-15T12:00:00', new Date(2026, 10, 1)))

console.log('ok')
