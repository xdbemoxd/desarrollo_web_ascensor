var bd 

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
window.addEventListener( "load", IniciarBaseDatos );