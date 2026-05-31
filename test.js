const { leerCSV } = require('./back/db')
const path = require('path')
const { cargarDatos } = require('./back/db')
let db=null
async function main() {
   db = await cargarDatos()
const clubesRandom = db.clubs
    .sort(() => Math.random())
    .slice(0, 8)

  let nombresRandom = Math.floor(Math.random() * clubesRandom.id.length);

  console.log(nombresRandom)
}

main()
   






main()
