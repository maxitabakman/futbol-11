const { cargarDatos, construirIndices, elegirGrilla } = require('./back/db')

async function main() {
  const db = await cargarDatos()
  const { indiceConexiones } = construirIndices(db)

  // Ver cuantos clubes tienen conexiones
  const clubesConConexiones = Object.keys(indiceConexiones)
  console.log('Clubes con al menos una conexion:', clubesConConexiones.length)
  console.log('Total clubes principales:', db.clubs_principales.length)

  // Ver cuantas conexiones tiene un club conocido, ejemplo Barcelona (id 131)
  // Intentar con mas intentos
  const grilla = elegirGrilla(db, indiceConexiones, 2000000)

  if (!grilla) {
    console.log('No se encontró grilla válida con 20000 intentos')
   
  }

  console.log('Filas:', grilla.filas.map(c => c.name))
  console.log('Columnas:', grilla.columnas.map(c => c.name))
  console.log('\nConexiones:')
  grilla.filas.forEach(f => {
  grilla.columnas.forEach(c => {
  const jugadores = indiceConexiones[f.club_id][c.club_id]
  console.log(`${f.name} ↔ ${c.name}: ${jugadores.map(j => j.nombre).join(', ')} opciones`)
  })
})
}

main()