const estado = {
    totalPisos: 6,
    pisoActual: 0,
    pisoDestino: null,
    direccion: 'detenido',  // 'subiendo' | 'bajando' | 'detenido'
    situacion: 'detenido',  // 'detenido' | 'subiendo' | 'bajando' | 'atendiendo'
    pendientes: [],         // cola de solicitudes 
    atendidas: 0,           // contador de solicitudes atendidas
    ultimoEvento: '—',      // texto del último evento registrado
    tiempoPiso: 1500,       // ms que tarda en pasar de un piso al siguiente
    tiempoParada: 1500,     // ms que espera detenido al atender un piso
};

let enMovimiento = false;   // evita arrancar dos recorridos a la vez
let pisoOrigenViaje = 0;    // piso desde el que partió el tramo actual (para el historial)

const $edificio = document.getElementById('edificio');
const $panelEstado = document.getElementById('panel-estado');
const $panelPisoActual = document.getElementById('panel-piso-actual');
const $panelPendientes = document.getElementById('panel-pendientes');
const $panelAtendidas = document.getElementById('panel-atendidas');
const $panelEvento = document.getElementById('panel-evento');
const $btnLimpiar = document.getElementById('btn-limpiar');
const $btnReiniciar = document.getElementById('btn-reiniciar');

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const nombrePiso = (n) => (n === 0 ? 'Planta Baja' : `Piso ${n}`);

const ETIQUETAS_ESTADO = {
    detenido: 'Detenido 🛑',
    subiendo: 'Ascendiendo ⬆️',
    bajando: 'Descendiendo ⬇️',
    atendiendo: 'Atendiendo solicitud 🚪',
};

// Genera la lista de pisos en orden descendente (arriba el más alto),
function construirEdificio() {
    $edificio.innerHTML = '';

    for (let piso = estado.totalPisos - 1; piso >= 0; piso--) {
        const fila = document.createElement('div');
        fila.className = 'piso-fila';
        fila.dataset.piso = piso;

        fila.innerHTML = `
            <span class="piso-nombre">${nombrePiso(piso)}</span>
            <span class="cabina">🛗</span>
            <button class="btn-llamar" data-piso="${piso}">Llamar</button>
        `;

        $edificio.appendChild(fila);
    }

    // Un único listener delegado para todos los botones de llamada.
    $edificio.querySelectorAll('.btn-llamar').forEach(boton => {
        boton.addEventListener('click', () => llamar(Number(boton.dataset.piso)));
    });
}

// Traduce el estado interno a la interfaz.
function renderizar() {
    $panelEstado.textContent = `Estado: ${ETIQUETAS_ESTADO[estado.situacion]}`;
    $panelPisoActual.textContent = `Piso actual: ${nombrePiso(estado.pisoActual)}`;
    $panelAtendidas.textContent = `Solicitudes atendidas: ${estado.atendidas}`;
    $panelEvento.textContent = `Último evento registrado: ${estado.ultimoEvento}`;

    // Lista de pisos pendientes por número.
    $panelPendientes.textContent = estado.pendientes.length
        ? `Solicitudes pendientes: ${estado.pendientes.join(', ')}`
        : 'Solicitudes pendientes: ninguna';

    // Resaltado de cada fila según dónde está la cabina y qué pisos esperan.
    $edificio.querySelectorAll('.piso-fila').forEach(fila => {
        const piso = Number(fila.dataset.piso);
        fila.classList.toggle('activo', piso === estado.pisoActual);
        fila.classList.toggle('pendiente', estado.pendientes.includes(piso));
    });
}

// Se dispara al pulsar "Llamar". Registra la solicitud y arranca el ascensor.
function llamar(piso) {
    if (piso === estado.pisoActual && !enMovimiento) {
        estado.ultimoEvento = `El ascensor ya se encuentra en ${nombrePiso(piso)}`;
        renderizar();
        return;
    }

    // Control de solicitudes repetidas.
    if (estado.pendientes.includes(piso)) {
        estado.ultimoEvento = `${nombrePiso(piso)} ya estaba en la cola de solicitudes`;
        renderizar();
        return;
    }

    estado.pendientes.push(piso);
    estado.ultimoEvento = `Llamada realizada al ${nombrePiso(piso)} desde ${nombrePiso(estado.pisoActual)}`;
    renderizar();

    if (!enMovimiento) {
        arrancar();
    }
}

function elegirDestino() {
    const arriba = estado.pendientes.filter(p => p > estado.pisoActual);
    const abajo = estado.pendientes.filter(p => p < estado.pisoActual);

    if (estado.direccion === 'bajando') {
        if (abajo.length) return Math.min(...abajo);
        if (arriba.length) return Math.max(...arriba);  // invertir
    } else {
        if (arriba.length) return Math.max(...arriba);
        if (abajo.length) return Math.min(...abajo);   // invertir
    }
    return estado.pisoActual;
}

// Recorre la cola hasta vaciarla.
async function arrancar() {
    if (enMovimiento) return;
    enMovimiento = true;
    pisoOrigenViaje = estado.pisoActual;

    while (estado.pendientes.length > 0) {
        const destino = elegirDestino();
        await moverHacia(destino);
    }

    estado.direccion = 'detenido';
    estado.situacion = 'detenido';
    estado.pisoDestino = null;
    estado.ultimoEvento = `Sin solicitudes pendientes. Ascensor detenido en ${nombrePiso(estado.pisoActual)}`;
    renderizar();
    enMovimiento = false;
}

async function moverHacia(destino) {
    estado.pisoDestino = destino;

    while (estado.pisoActual !== destino) {
        estado.direccion = destino > estado.pisoActual ? 'subiendo' : 'bajando';
        estado.situacion = estado.direccion;
        renderizar();

        await esperar(estado.tiempoPiso);

        estado.pisoActual += (destino > estado.pisoActual) ? 1 : -1;
        renderizar();

        if (estado.pendientes.includes(estado.pisoActual)) {
            await atenderPiso(estado.pisoActual);
        }
    }
}

async function atenderPiso(piso) {
    const indice = estado.pendientes.indexOf(piso);
    if (indice > -1) estado.pendientes.splice(indice, 1);

    const direccionPrevia = estado.direccion;
    estado.situacion = 'atendiendo';
    estado.direccion = 'detenido';
    estado.atendidas++;
    estado.ultimoEvento = `Solicitud atendida en ${nombrePiso(piso)}`;
    renderizar();

    if (typeof GuardarViaje === 'function') {
        GuardarViaje(pisoOrigenViaje, piso);
    }
    guardarEstadoLocal();
    pisoOrigenViaje = piso;

    await esperar(estado.tiempoParada);

    // Restauramos la dirección para continuar el recorrido si quedan solicitudes.
    estado.direccion = direccionPrevia;
    renderizar();
}

const CLAVE_LOCAL = 'ASCENSOR_ESTADO';

function guardarEstadoLocal() {
    const datos = {
        pisoActual: estado.pisoActual,
        totalPisos: estado.totalPisos,
        tiempoPiso: estado.tiempoPiso,
    };
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(datos));
}

// Recupera el último piso al cargar la página.
function cargarEstadoLocal() {
    const crudo = localStorage.getItem(CLAVE_LOCAL);
    if (!crudo) return;

    try {
        const datos = JSON.parse(crudo);
        if (typeof datos.pisoActual === 'number') estado.pisoActual = datos.pisoActual;
        if (typeof datos.totalPisos === 'number') estado.totalPisos = datos.totalPisos;
        if (typeof datos.tiempoPiso === 'number') estado.tiempoPiso = datos.tiempoPiso;
    } catch (e) {
        console.warn('No se pudo leer el estado guardado:', e);
    }
}

// Reinicia el simulador: borra el estado local y vuelve a los valores iniciales.
function reiniciarSimulador() {
    if (enMovimiento) return; // no reiniciar en pleno movimiento
    localStorage.removeItem(CLAVE_LOCAL);
    estado.pisoActual = 0;
    estado.pisoDestino = null;
    estado.direccion = 'detenido';
    estado.situacion = 'detenido';
    estado.pendientes = [];
    estado.atendidas = 0;
    estado.ultimoEvento = 'Simulador reiniciado';
    pisoOrigenViaje = 0;
    renderizar();
}

$btnReiniciar.addEventListener('click', reiniciarSimulador);

// Limpiar historial IndexedDB.
$btnLimpiar.addEventListener('click', () => {
    if (typeof LimpiarHistorial === 'function') {
        LimpiarHistorial(() => {
            estado.atendidas = 0;
            estado.ultimoEvento = 'Historial limpiado';
            renderizar();
        });
    }
});

window.addEventListener('load', () => {
    cargarEstadoLocal();     // recupera el último piso guardado
    construirEdificio();     // dibuja la lista de pisos
    renderizar();            // pinta el estado inicial
});
