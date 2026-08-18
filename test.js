const inputJugador = document.getElementById('inputJugador')
const sugerencias = document.getElementById('sugerencias')

let grillaActual = null
let celdasCompletadas = new Set()
inputJugador.addEventListener('input', async () => {

    const texto = inputJugador.value.trim()

    sugerencias.innerHTML = ''

    if (texto === '') {
        return
    }

    try {

        const respuesta = await fetch(
            `http://localhost:3000/jugadores?nombre=${encodeURIComponent(texto)}`
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
            'http://localhost:3000/respuesta',
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
         if (celdasCompletadas.size === SUFIJOS_INTERIORES.length) {
         pantallaGanador.style.display = 'flex'
        }

    } catch (error) {

        console.error('Error enviando respuesta:', error)
    }
}

function marcarError() {
    inputJugador.classList.remove('input-error')

    // fuerza un reflow para poder re-disparar la animación
    // si el usuario se equivoca dos veces seguidas
    void inputJugador.offsetWidth

    inputJugador.classList.add('input-error')

    inputJugador.addEventListener('animationend', () => {
        inputJugador.classList.remove('input-error')
    }, { once: true })
}

async function cargarGrilla() {
reiniciarCeldasInteriores() // Limpia las celdas interiores antes de cargar la nueva grilla
    const respuesta = await fetch('https://futbol-11-5p39.onrender.com/grilla')
    const grilla = await respuesta.json()

    grillaActual = grilla

    const sufijosFilas = ['dosuno', 'tresuno', 'cuatrouno']
    const sufijosColumnas = ['unodos', 'unotres', 'unocuatro']

    grilla.filas.forEach((club, i) => pintarCelda(sufijosFilas[i], club))
    grilla.columnas.forEach((club, i) => pintarCelda(sufijosColumnas[i], club))
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

    if (club.logo_url) escudo.src = club.logo_url
    nombre.textContent = club.nombre

    celda.addEventListener('mouseenter', () => {
        parteAmarilla.style.display = 'block'
    })

    celda.addEventListener('mouseleave', () => {
        parteAmarilla.style.display = 'none'
    })
}

const PREFIJOS_FILA = ['dos', 'tres', 'cuatro']
const SUFIJOS_COLUMNA = ['dos', 'tres', 'cuarto']

function sufijoCeldaInterior(filaClubId, columnaClubId) {

    const indiceFila = grillaActual.filas.findIndex(f => f.club_id === filaClubId)
    const indiceColumna = grillaActual.columnas.findIndex(c => c.club_id === columnaClubId)

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
        if (escudo) escudo.src = ''
        escudo.style.display = 'none';
    })
}
cargarGrilla()
let btnRendirse = document.getElementById('rendirse')
    const modalRendirse = document.getElementById('modalRendirse');
    const btnSi = document.getElementById('btnSi');
    const btnNo = document.getElementById('btnNo');
if (btnRendirse) {
        btnRendirse.addEventListener('click', () => {
            modalRendirse.style.display = 'flex';
        });
    }

    // 2. Al tocar el botón "NO" -> oculta el cartel
    if (btnNo) {
        btnNo.addEventListener('click', () => {
            modalRendirse.style.display = 'none';
        });
    }

    // 3. Al tocar el botón "SI" -> oculta el cartel
    if (btnSi) {
        btnSi.addEventListener('click', () => {
            modalRendirse.style.display = 'none';
            cargarGrilla() 
        })}
  let pantallaGanador = document.getElementById('overlay-ganador');
  let btnJugarNuevo = document.getElementById('btn-jugar-nuevo');
    if (btnJugarNuevo) {
        btnJugarNuevo.addEventListener('click', () => {
            pantallaGanador.style.display = 'none';
            cargarGrilla() 
        });}