const express = require('express')
const cors = require('cors')


const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// GET /clubes-random - devuelve 6 clubes random
const { cargarDatos, jugadoresPorClub, elegirClubesConectados } = require('./db')

app.get('/clubes-random', async (req, res) => {
  const db = await cargarDatos()
  const clubes = elegirClubesConectados(db)

  if (!clubes) return res.status(500).json({ error: 'No se encontraron clubes conectados' })

  res.json(clubes)
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})


app.get('/clubs/:id/jugadores', async (req, res) => {
  const db = await cargarDatos()
  const jugadores = jugadoresPorClub(db, req.params.id)
  
  if (jugadores.length === 0) {
    return res.status(404).json({ error: 'No se encontraron jugadores para este club' })
  }

  res.json({ total: jugadores.length, data: jugadores })
})
app.get('/clubes-random/conexiones', async (req, res) => {
  const db = await cargarDatos()
  const clubes = elegirClubesConectados(db)
  const ids = clubes.map(c => c.club_id)

  const resultado = clubes.map(club => {
    const conexiones = db.transfers
      .filter(t =>
        (t.from_club_id === club.club_id && ids.includes(t.to_club_id)) ||
        (t.to_club_id === club.club_id && ids.includes(t.from_club_id))
      )
      // sacamos duplicados por jugador
      .filter((t, index, self) =>
        index === self.findIndex(x => x.player_id === t.player_id)
      )
      .map(t => ({
        player_id: t.player_id,
        player_name: t.player_name,
        club_conectado: t.from_club_id === club.club_id ? t.to_club_id : t.from_club_id
      }))

    return {
      club_id: club.club_id,
      club_name: club.name,
      conexiones
    }
  })

  res.json(resultado)
})