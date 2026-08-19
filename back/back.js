const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000

// Permite pasar una función de filtro para NO guardar basura en RAM
function leerCSV(rutaArchivo, filtroFn = null) {
    return new Promise((resolve, reject) => {
        const resultados = []

        fs.createReadStream(rutaArchivo)
            .pipe(csv())
            .on('data', (fila) => {
                if (!filtroFn || filtroFn(fila)) {
                    resultados.push(fila)
                }
            })
            .on('end', () => resolve(resultados))
            .on('error', (error) => reject(error))
    })
}

const DAVIDCARIBOO = path.join(__dirname, '..', 'data', 'davidcariboo')
const SALIMT = path.join(__dirname, '..', 'data', 'salimt')
const DATA = path.join(__dirname, '..', 'data')

let grillaUltima = null

async function cargarDatos() {
    const clubs_principales = await leerCSV(path.join(DATA, 'clubs_principales.csv'))
    const idsClubsPrincipales = new Set(clubs_principales.map(c => String(c.club_id)))

    const transfers = await leerCSV(path.join(DAVIDCARIBOO, 'transfers.csv'), (fila) => {
        return idsClubsPrincipales.has(String(fila.from_club_id)) || idsClubsPrincipales.has(String(fila.to_club_id))
    })

    const idsJugadoresValidos = new Set(transfers.map(t => String(t.player_id)))

    const team_details = await leerCSV(path.join(SALIMT, 'team_details', 'team_details.csv'), (fila) => {
        return idsClubsPrincipales.has(String(fila.club_id))
    })

    const player_profiles = await leerCSV(path.join(SALIMT, 'player_profiles', 'player_profiles.csv'), (fila) => {
        return idsJugadoresValidos.has(String(fila.player_id))
    })

    return {
        clubs_principales,
        transfers,
        team_details,
        player_profiles
    }
}

function construirIndices(db) {
    const idsClubsPrincipales = new Set(
        db.clubs_principales.map(c => String(c.club_id))
    )

    const indiceJugador = {}

    for (let t of db.transfers) {
        if (!indiceJugador[t.player_id]) {
            indiceJugador[t.player_id] = {
                nombre: t.player_name,
                clubes: new Set()
            }
        }

        if (idsClubsPrincipales.has(String(t.from_club_id))) {
            indiceJugador[t.player_id].clubes.add(String(t.from_club_id))
        }

        if (idsClubsPrincipales.has(String(t.to_club_id))) {
            indiceJugador[t.player_id].clubes.add(String(t.to_club_id))
        }
    }

    const jugadoresValidos = Object.entries(indiceJugador)
        .filter(([id, j]) => j.clubes.size >= 2)
        .map(([id, j]) => ({
            player_id: id,
            nombre: j.nombre,
            clubes: [...j.clubes]
        }))

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

                indiceConexiones[a][b].push({
                    player_id: j.player_id,
                    nombre: j.nombre
                })

                indiceConexiones[b][a].push({
                    player_id: j.player_id,
                    nombre: j.nombre
                })
            }
        }
    }

    return {
        indiceConexiones,
        jugadoresValidos
    }
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

        if (valida) {
            return { filas, columnas }
        }
    }

    return null
}

function construirMapaLogos(db) {
    const mapaLogos = {}
    for (let t of db.team_details) {
        if (!mapaLogos[t.club_id]) {
            mapaLogos[t.club_id] = t.logo_url
        }
    }
    return mapaLogos
}

function construirMapaFotos(db) {
    const mapaFotos = {}
    for (let p of db.player_profiles) {
        if (!mapaFotos[p.player_id]) {
            mapaFotos[p.player_id] = p.player_image_url
        }
    }
    return mapaFotos
}

// 🔒 CONTROLADOR DE CARGA ÚNICA (Cachea la Promesa)
let promesaInicializacion = null

function obtenerEstadoGlobal() {
    if (!promesaInicializacion) {
        promesaInicializacion = (async () => {
            console.log('Cargando y procesando datos por única vez...')
            const db = await cargarDatos()
            const { indiceConexiones, jugadoresValidos } = construirIndices(db)
            const mapaLogos = construirMapaLogos(db)
            const mapaFotos = construirMapaFotos(db)
            console.log('¡Datos e índices cargados exitosamente en memoria!')

            return {
                db,
                indiceConexiones,
                jugadoresValidos,
                mapaLogos,
                mapaFotos
            }
        })()
    }
    return promesaInicializacion
}

// Iniciar la carga apenas arranca el archivo
obtenerEstadoGlobal()

// 📌 RUTA 1: Obtener Grilla
app.get('/grilla', async (req, res) => {
    try {
        const estado = await obtenerEstadoGlobal()
        const grilla = elegirGrilla(estado.db, estado.indiceConexiones)

        if (!grilla) {
            return res.status(500).json({ error: 'No se pudo generar grilla válida' })
        }

        grillaUltima = grilla

        res.json({
            grilla,
            mapaLogos: estado.mapaLogos,
            mapaFotos: estado.mapaFotos
        })
    } catch (error) {
        console.error('Error generando grilla:', error)
        res.status(500).json({ error: error.message })
    }
})

// 📌 RUTA 2: Buscador de Jugadores
app.get('/jugadores', async (req, res) => {
    try {
        const nombreBuscado = (req.query.nombre || '').toLowerCase().trim()
        if (!nombreBuscado) return res.json([])

        const { jugadoresValidos } = await obtenerEstadoGlobal()

        const coincidencias = jugadoresValidos
            .filter(j => j.nombre.toLowerCase().includes(nombreBuscado))
            .slice(0, 10)

        res.json(coincidencias)
    } catch (error) {
        console.error('Error buscando jugadores:', error)
        res.status(500).json({ error: error.message })
    }
})

// 📌 RUTA 3: Validar Respuesta de Jugador
app.post('/respuesta', async (req, res) => {
    try {
        const { nombre } = req.body
        if (!nombre || !grillaUltima) {
            return res.json({ valido: false })
        }

        const { jugadoresValidos, mapaFotos } = await obtenerEstadoGlobal()

        const jugador = jugadoresValidos.find(
            j => j.nombre.toLowerCase() === nombre.toLowerCase().trim()
        )

        if (!jugador) {
            return res.json({ valido: false })
        }

        const celdasValidas = []
        const clubesJugador = new Set(jugador.clubes.map(String))

        grillaUltima.filas.forEach(fila => {
            grillaUltima.columnas.forEach(columna => {
                const idFila = String(fila.club_id)
                const idCol = String(columna.club_id)

                if (clubesJugador.has(idFila) && clubesJugador.has(idCol)) {
                    celdasValidas.push({
                        fila: { club_id: fila.club_id },
                        columna: { club_id: columna.club_id },
                        foto_url: mapaFotos[jugador.player_id] || ''
                    })
                }
            })
        })

        res.json({
            valido: celdasValidas.length > 0,
            celdas: celdasValidas
        })
    } catch (error) {
        console.error('Error en /respuesta:', error)
        res.status(500).json({ error: error.message })
    }
})

app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`))