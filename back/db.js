const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

function leerCSV(rutaArchivo) {
  return new Promise((resolve, reject) => {
    const resultados = []
    fs.createReadStream(rutaArchivo)
      .pipe(csv())
      .on('data', (fila) => resultados.push(fila))
      .on('end', () => resolve(resultados))
      .on('error', (error) => reject(error))
  })
}

const DAVIDCARIBOO = path.join(__dirname, '..', 'data', 'davidcariboo')
const SALIMT = path.join(__dirname, '..', 'data', 'salimt')
const DATA = path.join(__dirname, '..', 'data')
let db = null

async function cargarDatos() {
  if (db) return db

  console.log('Cargando datos por primera vez...')

  db = {
    clubs_principales: await leerCSV(path.join(DATA, 'clubs_principales.csv')),
    // davidcariboo
    players:            await leerCSV(path.join(DAVIDCARIBOO, 'players.csv')),
    clubs:              await leerCSV(path.join(DAVIDCARIBOO, 'clubs.csv')),
    competitions:       await leerCSV(path.join(DAVIDCARIBOO, 'competitions.csv')),
    countries:          await leerCSV(path.join(DAVIDCARIBOO, 'countries.csv')),
    games:              await leerCSV(path.join(DAVIDCARIBOO, 'games.csv')),
    transfers:          await leerCSV(path.join(DAVIDCARIBOO, 'transfers.csv')),
    player_valuations:  await leerCSV(path.join(DAVIDCARIBOO, 'player_valuations.csv')),
    national_teams:     await leerCSV(path.join(DAVIDCARIBOO, 'national_teams.csv')),

    // salimt
    player_profiles:              await leerCSV(path.join(SALIMT, 'player_profiles', 'player_profiles.csv')),
    player_injuries:              await leerCSV(path.join(SALIMT, 'player_injuries', 'player_injuries.csv')),
    player_market_value:          await leerCSV(path.join(SALIMT, 'player_market_value', 'player_market_value.csv')),
    player_performances:          await leerCSV(path.join(SALIMT, 'player_performances', 'player_performances.csv')),
    player_national_performances: await leerCSV(path.join(SALIMT, 'player_national_performances', 'player_national_performances.csv')),
    transfer_history:             await leerCSV(path.join(SALIMT, 'transfer_history', 'transfer_history.csv')),
    team_details:                 await leerCSV(path.join(SALIMT, 'team_details', 'team_details.csv')),
    player_teammates:             await leerCSV(path.join(SALIMT, 'player_teammates_played_with', 'player_teammates_played_with.csv')),
    player_latest_market_value:   await leerCSV(path.join(SALIMT, 'player_latest_market_value', 'player_latest_market_value.csv')),
    team_children:                await leerCSV(path.join(SALIMT, 'team_children', 'team_children.csv')),
    team_competitions_seasons:    await leerCSV(path.join(SALIMT, 'team_competitions_seasons', 'team_competitions_seasons.csv')),
  }

  console.log('Datos cargados!')
  return db
}

module.exports = { leerCSV, cargarDatos }
function jugadoresPorClub(db, clubId) {
  return db.players.filter(p => p.current_club_id === clubId)
}

module.exports = { leerCSV, cargarDatos, jugadoresPorClub }
function obtenerConexiones(clubes, transfers) {
  const ids = clubes.map(c => c.club_id)
  const clubesConConexion = new Set()

  for (let x = 0; x < ids.length; x++) {
    for (let y = x + 1; y < ids.length; y++) {
      const jugador = transfers.find(t =>
        (t.from_club_id === ids[x] && t.to_club_id === ids[y]) ||
        (t.from_club_id === ids[y] && t.to_club_id === ids[x])
      )
      if (jugador) {
        clubesConConexion.add(ids[x])
        clubesConConexion.add(ids[y])
      }
    }
  }

  return clubesConConexion
}

function elegirClubesConectados(db) {
  let clubes = db.clubs_principales
    .sort(() => Math.random() - 0.5)
    .slice(0, 6)

  let intentos = 0

  while (intentos < 200) {
    const conexiones = obtenerConexiones(clubes, db.transfers)

    if (conexiones.size === 6) return clubes

    const sinConexion = clubes.find(c => !conexiones.has(c.club_id))

    if (sinConexion) {
      const reemplazo = db.clubs_principales
        .filter(c => !clubes.includes(c))
        .sort(() => Math.random() - 0.5)[0]

      clubes = clubes.map(c => c.club_id === sinConexion.club_id ? reemplazo : c)
    }

    intentos++
  }

  return clubes
}

module.exports = { leerCSV, cargarDatos, jugadoresPorClub, elegirClubesConectados }