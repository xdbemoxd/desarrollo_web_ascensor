var bd;

function IniciarBaseDatos() {
    var solicitud = indexedDB.open("DATOS_ASCENSOR", 2);

    solicitud.addEventListener("error", MostrarError);
    solicitud.addEventListener("success", Comenzar);
    solicitud.addEventListener("upgradeneeded", CrearAlmacen);
}

function MostrarError(evento) {
    console.error("Error de IndexedDB:", evento.target.error);
}

function Comenzar(evento) {
    bd = evento.target.result;

    // Página de historial: pintamos la lista de viajes.
    if (document.querySelector(".caja-historial-paradas")) {
        Mostrar();
    }

    // Página principal: sincronizamos el contador de atendidas con lo guardado.
    if (document.getElementById("panel-atendidas")) {
        CargarContador();
    }
}

function CrearAlmacen(evento) {
    var baseDatos = evento.target.result;

    if (baseDatos.objectStoreNames.contains("ESTACIONES")) {
        baseDatos.deleteObjectStore("ESTACIONES");
    }

    if (!baseDatos.objectStoreNames.contains("HISTORIAL")) {
        var almacen = baseDatos.createObjectStore("HISTORIAL", { keyPath: "id", autoIncrement: true });
        almacen.createIndex("Buscar destino", "destino", { unique: false });
    }
}

function GuardarViaje(origen, destino) {
    if (!bd) return;

    var transaccion = bd.transaction(["HISTORIAL"], "readwrite");
    var almacen = transaccion.objectStore("HISTORIAL");

    almacen.add({
        origen: origen,
        destino: destino,
        fecha: new Date().toLocaleString()
    });
}

function Mostrar() {
    var caja = document.querySelector(".caja-historial-paradas");
    caja.innerHTML = "";

    var transaccion = bd.transaction(["HISTORIAL"]);
    var almacen = transaccion.objectStore("HISTORIAL");
    var puntero = almacen.openCursor();

    var hayRegistros = false;

    puntero.addEventListener("success", function (evento) {
        var cursor = evento.target.result;

        if (cursor) {
            hayRegistros = true;
            caja.innerHTML += `
                <div class="fila-historial">
                    <strong>De ${textoPiso(cursor.value.origen)} a ${textoPiso(cursor.value.destino)}</strong><br>
                    <small class="fecha">${cursor.value.fecha}</small>
                </div>
            `;
            cursor.continue();
        } else if (!hayRegistros) {
            caja.innerHTML = "<p>No hay viajes registrados todavía.</p>";
        }
    });
}

function textoPiso(n) {
    return n === 0 ? "Planta Baja" : "Piso " + n;
}

function CargarContador() {
    var transaccion = bd.transaction(["HISTORIAL"]);
    var almacen = transaccion.objectStore("HISTORIAL");
    var conteo = almacen.count();

    conteo.addEventListener("success", function (evento) {
        var total = evento.target.result;

        // Sincronizamos con el estado del simulador y refrescamos la vista.
        if (typeof estado !== "undefined") {
            estado.atendidas = total;
            if (typeof renderizar === "function") renderizar();
        }
    });
}

function LimpiarHistorial(alTerminar) {
    if (!bd) return;

    var transaccion = bd.transaction(["HISTORIAL"], "readwrite");
    var almacen = transaccion.objectStore("HISTORIAL");
    var peticion = almacen.clear();

    peticion.addEventListener("success", function () {
        // Si estamos en la página de historial, refrescamos la lista.
        if (document.querySelector(".caja-historial-paradas")) {
            Mostrar();
        }
        if (typeof alTerminar === "function") alTerminar();
    });
}

window.addEventListener("load", IniciarBaseDatos);
