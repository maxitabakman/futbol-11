const express = require('express')
const cors = require('cors')
const { cargarDatos, construirIndices, elegirGrilla } = require('./db')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

let indices = null

app.get('/grilla', async (req, res) => {
  const db = await cargarDatos()

  if (!indices) indices = construirIndices(db)

  let grilla = null
  while (!grilla) {
    grilla = elegirGrilla(db, indices.indiceConexiones)
  }

  const resultado = {
    filas: grilla.filas.map(c => ({ club_id: c.club_id, nombre: c.name })),
    columnas: grilla.columnas.map(c => ({ club_id: c.club_id, nombre: c.name })),
    celdas: grilla.filas.map(f =>
      grilla.columnas.map(c => ({
        fila: f.club_id,
        columna: c.club_id,
        opciones: indices.indiceConexiones[f.club_id][c.club_id].length,
        respuesta: indices.indiceConexiones[f.club_id][c.club_id][0].nombre
      }))
    )
  }

  res.json(resultado)
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})