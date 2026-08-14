const inputJugador = document.getElementById('inputJugador')
const sugerencias = document.getElementById('sugerencias')
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

                const respuestaJugador = await fetch(
                    'http://localhost:3000/respuesta',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type': 'application/json'
                        },

                        body: JSON.stringify({
                            nombre: jugador.nombre
                        })
                    }
                )

                const resultado = await respuestaJugador.json()

                console.log(resultado)
            })

            sugerencias.appendChild(opcion)
        })

    } catch (error) {

        console.error('Error buscando jugadores:', error)
    }
})
let grillaActual = null

async function cargarGrilla() {
    const respuesta = await fetch('http://localhost:3000/grilla')
    const grilla = await respuesta.json()

    grillaActual = grilla

    const idsFilas = ['escudo-dosuno', 'escudo-tresuno', 'escudo-cuatrouno']
    const idsColumnas = ['escudo-unodos', 'escudo-unotres', 'escudo-unocuatro']

    grilla.filas.forEach((club, i) => {
        const escudo = document.getElementById(idsFilas[i])
        if (!escudo) {
            console.warn('No encontré el elemento con id:', idsFilas[i])
            return
        }
        if (club.logo_url) escudo.src = club.logo_url
    })

    grilla.columnas.forEach((club, i) => {
        const escudo = document.getElementById(idsColumnas[i])
        if (!escudo) {
            console.warn('No encontré el elemento con id:', idsColumnas[i])
            return
        }
        if (club.logo_url) escudo.src = club.logo_url
    })
}

cargarGrilla()