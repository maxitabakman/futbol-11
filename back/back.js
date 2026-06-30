const express = require('express')
const cors = require('cors')
const { cargarDatos, construirIndices, elegirGrilla } = require('./db')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

let indices = null
let grillaActiva = null

app.get('/grilla', async (req, res) => {
  const db = await cargarDatos()

  if (!indices) indices = construirIndices(db)

  let grilla = null
  while (!grilla) {
    grilla = elegirGrilla(db, indices.indiceConexiones)
  }

  grillaActiva = grilla

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

app.post('/respuesta', async (req, res) => {
  if (!grillaActiva || !indices) {
    return res.status(400).json({ error: 'No hay grilla activa, llamá a /grilla primero' })
  }

  const { nombre } = req.body
  if (!nombre) return res.status(400).json({ error: 'Falta el nombre del jugador' })

  const nombreLower = nombre.toLowerCase()

  const celdasValidas = []
grillaActiva.filas.forEach(f => {
  console.log('fila:', f)
  grillaActiva.columnas.forEach(c => {
    console.log('columna:', c)
  })
})
  grillaActiva.filas.forEach(f => {
    grillaActiva.columnas.forEach(c => {
      const jugadores = indices.indiceConexiones[f.club_id][c.club_id]
      const encontrado = jugadores.find(j =>
        j.nombre.toLowerCase().includes(nombreLower)
      )
      if (encontrado) {
       celdasValidas.push({
  fila: { club_id: f.club_id, nombre: f.name || f.nombre },
  columna: { club_id: c.club_id, nombre: c.name || c.nombre },
  jugador: encontrado.nombre
})
      }
    })
  })

  if (celdasValidas.length === 0) {
    return res.json({ valido: false, mensaje: 'El jugador no encaja en ninguna celda' })
  }

  res.json({ valido: true, celdas: celdasValidas })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})