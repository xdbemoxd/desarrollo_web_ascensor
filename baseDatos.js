var bd;

function IniciarBaseDatos(){

    var solicitud = indexedDB.open( "DATOS_ASCENSOR" )

    solicitud.addEventListener( "error", MostrarError );
    solicitud.addEventListener( "success", Comenzar );
    solicitud.addEventListener( "upgradeneeded", CrearAlmacen );


}

function MostrarError(evento){

    alert( "Tenemos un ERROR: " + evento.code + " / " + evento.message );

}

function Comenzar(evento) {
    
    bd = evento.target.result;

    if (document.querySelector(".caja-historial-paradas")) {
        Mostrar(); 
    } 
    
    if (document.getElementById("panel-soli-atendidas")) {
        CargarContador(); 
    }
     
}

function CrearAlmacen(evento) {
    
    var baseDatos = evento.target.result;

    if (baseDatos.objectStoreNames.contains("ESTACIONES")) {
        baseDatos.deleteObjectStore("ESTACIONES");
    }

    var almacen = baseDatos.createObjectStore( "HISTORIAL", { keyPath: "id", autoIncrement: true } );
    almacen.createIndex( "Buscar parada", "parada", {unique : false} );
    
}

function GuardarViaje( origen, destino, paradas ) {
    if (!bd) return;

    var transaccion = bd.transaction( [ "HISTORIAL" ], "readwrite" );
    var almacen = transaccion.objectStore( "HISTORIAL" );

    almacen.add({
        origen: origen,
        destino: destino,
        seDetuvoEnCamino: paradas.length > 0,
        paradasRealizadas: paradas, 
        fecha: new Date().toLocaleString() 
    })

}

function Mostrar() {
    var caja = document.querySelector( ".caja-historial-paradas" );
    caja.innerHTML = ""

    var transaccion = bd.transaction( [ "HISTORIAL" ] );

    var almacen = transaccion.objectStore( "HISTORIAL" );

    var puntero = almacen.openCursor();

    puntero.addEventListener( "success", MostrarHistorial );

}

function MostrarHistorial(evento) {
    var puntero = evento.target.result;
    var caja = document.querySelector(".caja-historial-paradas");

    if (puntero) {

        var textoParadas = puntero.value.seDetuvoEnCamino 
            ? "Frenó en piso(s): " + puntero.value.paradasRealizadas.join(", ") 
            : "Directo sin paradas";

        
        caja.innerHTML += `
            <div style="border-bottom: 1px solid gray; padding: 10px 0;">
                <strong>De piso ${puntero.value.origen} a ${puntero.value.destino}</strong><br>
                <small>${textoParadas}</small><br>
                <small style="color: gray;">${puntero.value.fecha}</small>
            </div>
        `;
        
        puntero.continue();
    }

}

function CargarContador() {
    var transaccion = bd.transaction( ["HISTORIAL"] );
    var almacen = transaccion.objectStore("HISTORIAL");
    
    // Abrimos un cursor para revisar cada viaje guardado
    var puntero = almacen.openCursor();
    
    // Aquí iremos sumando todo
    var contadorTotalSolicitudes = 0;

    puntero.addEventListener("success", function(evento) {
        var cursor = evento.target.result;
        
        if (cursor) {
            // 1. Sumamos el objeto en sí (el destino final cuenta como 1 solicitud atendida)
            var paradasEnEsteViaje = 1; 
            
            // 2. Sumamos la cantidad de paradas intermedias (si el arreglo existe y tiene elementos)
            if (cursor.value.paradasRealizadas) {
                paradasEnEsteViaje += cursor.value.paradasRealizadas.length;
            }
            
            // Lo acumulamos en nuestro total
            contadorTotalSolicitudes += paradasEnEsteViaje;
            
            // ¡Importante! Le decimos al cursor que pase al siguiente registro
            cursor.continue();
            
        } else {
            // Cuando el cursor llega al final (no hay más datos), cursor es nulo y cae en este 'else'.
            // Es el momento exacto para actualizar el HTML.
            var panel = document.getElementById("panel-soli-atendidas");
            if (panel) {
                panel.textContent = `Solicitudes atendidas: ${contadorTotalSolicitudes}`;
            }
            
            // Sincronizamos la variable de tu script principal para que siga sumando desde aquí
            if (typeof solicitudesAtendidas !== 'undefined') {
                solicitudesAtendidas = contadorTotalSolicitudes;
            }
        }
    });
}

window.addEventListener( "load", IniciarBaseDatos );