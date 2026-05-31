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

async function cargarDatos() {
  // davidcariboo
  const players           = await leerCSV(path.join(DAVIDCARIBOO, 'players.csv'))
  const clubs             = await leerCSV(path.join(DAVIDCARIBOO, 'clubs.csv'))
  const competitions      = await leerCSV(path.join(DAVIDCARIBOO, 'competitions.csv'))
  const countries         = await leerCSV(path.join(DAVIDCARIBOO, 'countries.csv'))
  const games             = await leerCSV(path.join(DAVIDCARIBOO, 'games.csv'))
  const transfers         = await leerCSV(path.join(DAVIDCARIBOO, 'transfers.csv'))
  const player_valuations = await leerCSV(path.join(DAVIDCARIBOO, 'player_valuations.csv'))
  const national_teams    = await leerCSV(path.join(DAVIDCARIBOO, 'national_teams.csv'))

  // salimt
  const player_profiles             = await leerCSV(path.join(SALIMT, 'player_profiles', 'player_profiles.csv'))
  const player_injuries             = await leerCSV(path.join(SALIMT, 'player_injuries', 'player_injuries.csv'))
  const player_market_value         = await leerCSV(path.join(SALIMT, 'player_market_value', 'player_market_value.csv'))
  const player_performances         = await leerCSV(path.join(SALIMT, 'player_performances', 'player_performances.csv'))
  const player_national_performances = await leerCSV(path.join(SALIMT, 'player_national_performances', 'player_national_performances.csv'))
  const transfer_history            = await leerCSV(path.join(SALIMT, 'transfer_history', 'transfer_history.csv'))
  const team_details                = await leerCSV(path.join(SALIMT, 'team_details', 'team_details.csv'))

  return {
    players, clubs, competitions, countries, games,
    transfers, player_valuations, national_teams,
    player_profiles, player_injuries, player_market_value,
    player_performances, player_national_performances,
    transfer_history, team_details
  }
}

module.exports = { leerCSV, cargarDatos }