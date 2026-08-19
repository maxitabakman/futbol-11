const URL_BACKEND = 'https://futbol-11-5p39.onrender.com';

const inputJugador = document.getElementById('inputJugador')
const sugerencias = document.getElementById('sugerencias')

let grillaActual = null
let mapaLogosActual = {}
let celdasCompletadas = new Set()

inputJugador.addEventListener('input', async () => {
    const texto = inputJugador.value.trim()
    sugerencias.innerHTML = ''

    if (texto === '') return

    try {
        const respuesta = await fetch(
            `${URL_BACKEND}/jugadores?nombre=${encodeURIComponent(texto)}`
        )
        const jugadores = await respuesta.json()

        jugadores.forEach(jugador => {
            const opcion = document.createElement('div')
            opcion.textContent = jugador.nombre

            opcion.addEventListener('click', async () => {
                inputJugador.value = jugador.nombre
                sugerencias.innerHTML = ''
                await enviarRespuesta(jugador.nombre)
            })

            sugerencias.appendChild(opcion)
        })
    } catch (error) {
        console.error('Error buscando jugadores:', error)
    }
})

inputJugador.addEventListener('keydown', async (evento) => {
    if (evento.key !== 'Enter') return

    const texto = inputJugador.value.trim()
    if (texto === '') return

    sugerencias.innerHTML = ''
    await enviarRespuesta(texto)
})

async function enviarRespuesta(nombreJugador) {
    try {
        const respuestaJugador = await fetch(
            `${URL_BACKEND}/respuesta`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: nombreJugador
                })
            }
        )

        const resultado = await respuestaJugador.json()

        if (!resultado.valido) {
            marcarError()
            return
        }

        resultado.celdas.forEach(celda => {
            const sufijo = sufijoCeldaInterior(celda.fila.club_id, celda.columna.club_id)

            if (!sufijo) {
                console.warn('No pude ubicar la celda para:', celda)
                return
            }

            const escudo = document.getElementById(`escudo-${sufijo}`)

            if (escudo && celda.foto_url) {
                escudo.src = celda.foto_url
                escudo.style.display = 'block';
                celdasCompletadas.add(sufijo)
            }
        })

        if (pantallaGanador && celdasCompletadas.size === SUFIJOS_INTERIORES.length) {
            pantallaGanador.style.display = 'flex'
        }

    } catch (error) {
        console.error('Error enviando respuesta:', error)
    }
}

function marcarError() {
    inputJugador.classList.remove('input-error')
    void inputJugador.offsetWidth
    inputJugador.classList.add('input-error')

    inputJugador.addEventListener('animationend', () => {
        inputJugador.classList.remove('input-error')
    }, { once: true })
}

async function cargarGrilla() {
    reiniciarCeldasInteriores()

    try {
        const respuesta = await fetch(`${URL_BACKEND}/grilla`)
        const data = await respuesta.json()

        // Se desempaqueta 'grilla' si viene envuelta desde Render
        grillaActual = data.grilla || data
        mapaLogosActual = data.mapaLogos || {}

        const sufijosFilas = ['dosuno', 'tresuno', 'cuatrouno']
        const sufijosColumnas = ['unodos', 'unotres', 'unocuatro']

        if (grillaActual && grillaActual.filas && grillaActual.columnas) {
            grillaActual.filas.forEach((club, i) => pintarCelda(sufijosFilas[i], club))
            grillaActual.columnas.forEach((club, i) => pintarCelda(sufijosColumnas[i], club))
        }
    } catch (error) {
        console.error('Error al cargar la grilla:', error)
    }
}

function pintarCelda(sufijo, club) {
    const celda = document.getElementById(`celda-${sufijo}`)
    const escudo = document.getElementById(`escudo-${sufijo}`)
    const nombre = document.getElementById(`nombre-${sufijo}`)

    if (!celda || !escudo || !nombre) {
        console.warn('Faltan elementos para la celda:', sufijo)
        return
    }

    const parteAmarilla = nombre.closest('.parte-amarilla')

    // Contempla ambas propiedades por si vienen como 'logo_url' o en 'mapaLogos'
    const logoUrl = club.logo_url || mapaLogosActual[club.club_id]
    if (logoUrl) escudo.src = logoUrl

    // Contempla ambas propiedades por si vienen como 'nombre' o 'name'
    nombre.textContent = club.nombre || club.name || ''

    if (parteAmarilla) {
        celda.addEventListener('mouseenter', () => {
            parteAmarilla.style.display = 'block'
        })

        celda.addEventListener('mouseleave', () => {
            parteAmarilla.style.display = 'none'
        })
    }
}

const PREFIJOS_FILA = ['dos', 'tres', 'cuatro']
const SUFIJOS_COLUMNA = ['dos', 'tres', 'cuarto'] // Dejado exactamente como lo tenías

function sufijoCeldaInterior(filaClubId, columnaClubId) {
    if (!grillaActual) return null

    const indiceFila = grillaActual.filas.findIndex(f => String(f.club_id) === String(filaClubId))
    const indiceColumna = grillaActual.columnas.findIndex(c => String(c.club_id) === String(columnaClubId))

    if (indiceFila === -1 || indiceColumna === -1) return null

    return PREFIJOS_FILA[indiceFila] + SUFIJOS_COLUMNA[indiceColumna]
}

const SUFIJOS_INTERIORES = [
    'dosdos', 'dostres', 'doscuarto',
    'tresdos', 'trestres', 'trescuarto',
    'cuatrodos', 'cuatrotres', 'cuatrocuarto'
]

function reiniciarCeldasInteriores() {
    celdasCompletadas.clear()
    SUFIJOS_INTERIORES.forEach(sufijo => {
        const escudo = document.getElementById(`escudo-${sufijo}`)
        if (escudo) {
            escudo.src = ''
            escudo.style.display = 'none'
        }
    })
}

// Inicialización
cargarGrilla()

const btnRendirse = document.getElementById('rendirse')
const modalRendirse = document.getElementById('modalRendirse')
const btnSi = document.getElementById('btnSi')
const btnNo = document.getElementById('btnNo')

if (btnRendirse) {
    btnRendirse.addEventListener('click', () => {
        if (modalRendirse) modalRendirse.style.display = 'flex'
    })
}

if (btnNo) {
    btnNo.addEventListener('click', () => {
        if (modalRendirse) modalRendirse.style.display = 'none'
    })
}

if (btnSi) {
    btnSi.addEventListener('click', () => {
        if (modalRendirse) modalRendirse.style.display = 'none'
        cargarGrilla()
    })
}

const pantallaGanador = document.getElementById('overlay-ganador')
const btnJugarNuevo = document.getElementById('btn-jugar-nuevo')

if (btnJugarNuevo) {
    btnJugarNuevo.addEventListener('click', () => {
        if (pantallaGanador) pantallaGanador.style.display = 'none'
        cargarGrilla()
    })
}