const { cargarDatos } = require('./back/db')

async function main() {
  const db = await cargarDatos()

  function verificarGrilla(filas, columnas, transfers) {
    for (let f of filas) {
      for (let c of columnas) {
        const conexion = transfers.find(t =>
          (t.from_club_id === f.club_id && t.to_club_id === c.club_id) ||
          (t.from_club_id === c.club_id && t.to_club_id === f.club_id)
        )
        if (!conexion) return false
      }
    }
    return true
  }

  function elegirGrilla(db, intentos = 500) {
    const clubs = db.clubs_principales

    for (let i = 0; i < intentos; i++) {
      const shuffled = [...clubs].sort(() => Math.random() - 0.5)
      const filas = shuffled.slice(0, 3)
      const columnas = shuffled.slice(3, 6)

      if (verificarGrilla(filas, columnas, db.transfers)) {
        return { filas, columnas }
      }
    }
    return null
  }

  const grilla = elegirGrilla(db)

  if (!grilla) {
    console.log('No se encontró grilla válida')
    main()
    return
  }

  console.log('Filas:', grilla.filas.map(c => c.name))
  console.log('Columnas:', grilla.columnas.map(c => c.name))

  // Verificamos los 9 pares
  console.log('\nConexiones:')
  grilla.filas.forEach(f => {
    grilla.columnas.forEach(c => {
      const jugador = db.transfers.find(t =>
        (t.from_club_id === f.club_id && t.to_club_id === c.club_id) ||
        (t.from_club_id === c.club_id && t.to_club_id === f.club_id)
      )
      console.log(`${f.name} ↔ ${c.name}: ${jugador.player_name}`)
    })
  })
}

main()