const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())
const { cargarDatos, construirIndices, construirMapaLogos, elegirGrilla,construirMapaFotos } = require('./db')

let indices = null
let grillaActiva = null
let mapaLogos = null
let mapaFotos = null

app.get('/grilla', async (req, res) => {
  const db = await cargarDatos()

  if (!indices) indices = construirIndices(db)
  if (!mapaLogos) mapaLogos = construirMapaLogos(db)

  let grilla = null
  while (!grilla) {
    grilla = elegirGrilla(db, indices.indiceConexiones)
  }

  grillaActiva = grilla

  const resultado = {
filas: grilla.filas.map(c => ({
  club_id: c.club_id,
  nombre: c.pile_name || c.name,
  logo_url: mapaLogos[c.club_id] || null
})),
columnas: grilla.columnas.map(c => ({
  club_id: c.club_id,
  nombre: c.pile_name || c.name,
  logo_url: mapaLogos[c.club_id] || null
})),
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
      jugador: encontrado.nombre,
      foto_url: mapaFotos[encontrado.player_id] || null
   })

      }
    })
  })

  if (celdasValidas.length === 0) {
    return res.json({ valido: false, mensaje: 'El jugador no encaja en ninguna celda' })
  }

  res.json({ valido: true, celdas: celdasValidas })
})
app.get('/jugadores', async (req, res) => {
    if (!indices) {
        const db = await cargarDatos()
        indices = construirIndices(db)
    }

    const nombre = (req.query.nombre || '').toLowerCase().trim()

    if (!nombre) {
        return res.json([])
    }

    const jugadores = indices.jugadoresValidos
        .filter(j => j.nombre.toLowerCase().includes(nombre))
        .slice(0, 5)

    res.json(jugadores)
})
app.get('/jugadores', async (req, res) => {
    if (!indices) {
        const db = await cargarDatos()
        indices = construirIndices(db)
    }

    const nombre = (req.query.nombre || '').toLowerCase().trim()

    if (!nombre) {
        return res.json([])
    }

    const jugadores = indices.jugadoresValidos
        .filter(j => j.nombre.toLowerCase().includes(nombre))
        .slice(0, 5)

    res.json(jugadores)
})
async function iniciar() {
    console.log('Precargando datos, esperá un toque...')
    const db = await cargarDatos()
    indices = construirIndices(db)
    mapaLogos = construirMapaLogos(db)
    mapaFotos = construirMapaFotos(db)
    console.log('Datos e índices listos.')

   const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
}

iniciar()