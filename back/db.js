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
    players:            await leerCSV(path.join(DAVIDCARIBOO, 'players.csv')),
    clubs:              await leerCSV(path.join(DAVIDCARIBOO, 'clubs.csv')),
    competitions:       await leerCSV(path.join(DAVIDCARIBOO, 'competitions.csv')),
    countries:          await leerCSV(path.join(DAVIDCARIBOO, 'countries.csv')),
    games:              await leerCSV(path.join(DAVIDCARIBOO, 'games.csv')),
    transfers:          await leerCSV(path.join(DAVIDCARIBOO, 'transfers.csv')),
    player_valuations:  await leerCSV(path.join(DAVIDCARIBOO, 'player_valuations.csv')),
    national_teams:     await leerCSV(path.join(DAVIDCARIBOO, 'national_teams.csv')),
    clubs_principales:  await leerCSV(path.join(DATA, 'clubs_principales.csv')),

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

function construirIndices(db) {
  const idsClubsPrincipales = new Set(db.clubs_principales.map(c => c.club_id))

  // Indice por jugador: qué clubes principales tuvo
  const indiceJugador = {}
  for (let t of db.transfers) {
    if (!indiceJugador[t.player_id]) {
      indiceJugador[t.player_id] = {
        nombre: t.player_name,
        clubes: new Set()
      }
    }
    if (idsClubsPrincipales.has(t.from_club_id)) indiceJugador[t.player_id].clubes.add(t.from_club_id)
    if (idsClubsPrincipales.has(t.to_club_id)) indiceJugador[t.player_id].clubes.add(t.to_club_id)
  }

  // Filtrar jugadores con al menos 2 clubes principales
  const jugadoresValidos = Object.entries(indiceJugador)
    .filter(([id, j]) => j.clubes.size >= 2)
    .map(([id, j]) => ({
      player_id: id,
      nombre: j.nombre,
      clubes: [...j.clubes]
    }))

  // Indice de conexiones entre clubes
  const indiceConexiones = {}
  for (let j of jugadoresValidos) {
    for (let i = 0; i < j.clubes.length; i++) {
      for (let k = i + 1; k < j.clubes.length; k++) {
        const a = j.clubes[i]
        const b = j.clubes[k]
        if (!indiceConexiones[a]) indiceConexiones[a] = {}
        if (!indiceConexiones[b]) indiceConexiones[b] = {}
        if (!indiceConexiones[a][b]) indiceConexiones[a][b] = []
        if (!indiceConexiones[b][a]) indiceConexiones[b][a] = []
        indiceConexiones[a][b].push({ player_id: j.player_id, nombre: j.nombre })
        indiceConexiones[b][a].push({ player_id: j.player_id, nombre: j.nombre })
      }
    }
  }

  return { indiceConexiones, jugadoresValidos }
}

function elegirGrilla(db, indiceConexiones, intentos = 2000) {
  const clubs = db.clubs_principales

  for (let i = 0; i < intentos; i++) {
    const shuffled = [...clubs].sort(() => Math.random() - 0.5)
    const filas = shuffled.slice(0, 3)
    const columnas = shuffled.slice(3, 6)

    let valida = true
    for (let f of filas) {
      for (let c of columnas) {
        if (!indiceConexiones[f.club_id]?.[c.club_id]) {
          valida = false
          break
        }
      }
      if (!valida) break
    }

    if (valida) return { filas, columnas }
  }
  return null
}

module.exports = { leerCSV, cargarDatos, construirIndices, elegirGrilla }