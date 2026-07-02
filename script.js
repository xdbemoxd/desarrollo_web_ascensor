const $lucesDelCiruclo = document.querySelectorAll( '.piso' );
const $botones = document.querySelectorAll( '.button_t' )
const $panelEstado = document.getElementById( 'panel-estado' );
const $panelSolicitudAtendida = document.getElementById( 'panel-soli-atendidas' );
const $panelSolicitudesAtender = document.getElementById( 'panel-soli-espera' );
const $panelSolicitudExplicada = document.getElementById( 'panel-soli-explicada' );
let contadorDeLuz = 0;
let enMovimiento = false;
let listaVisitar = [];
let indiceactual = 0;
let solicitudesAtendidas = 0;
let pisoActual = 0;

const esperar = ( milisegundos ) => new Promise( resolve => setTimeout( resolve, milisegundos ) );

const mostrarLuz = async ( actual ) => {
    
    $lucesDelCiruclo[ actual ].className = 'piso';

    if ( enMovimiento ){

        const indice = listaVisitar.indexOf( actual );

        if ( indice > -1 ) return;

        listaVisitar.push( actual );
        $panelSolicitudesAtender.textContent = `Solicitdes en espera: ${listaVisitar.length}`;
        return;
    } 

    enMovimiento = true
    
    if( contadorDeLuz < actual ){

        $panelEstado.textContent = 'Estado: Ascendiendo ⬆️';

        console.log( listaVisitar );

        $panelSolicitudExplicada.textContent = `partiendo de ${pisoActual} para ir a ${actual}`;

        while( contadorDeLuz < actual ){

            const luzActual = $lucesDelCiruclo[ contadorDeLuz ];
            
            luzActual.classList.add( luzActual.getAttribute( 'color' ) );

            const indice = listaVisitar.indexOf( contadorDeLuz );

            if( indice > -1 ){

                $panelEstado.textContent = 'Estado: Detenido 🛑';
                solicitudesAtendidas++;
                $panelSolicitudExplicada.textContent = `Detenido para tomar una solicitud que esta en el camino`;
                listaVisitar.splice( indice, 1 );
                $panelSolicitudesAtender.textContent = `Solicitdes en espera: ${listaVisitar.length}`;
                $panelSolicitudAtendida.textContent = `Solicitdes atendidas: ${solicitudesAtendidas}`;
                await esperar( 4500 );
                $panelSolicitudExplicada.textContent = `partiendo de ${pisoActual} para ir a ${actual}`;


            }else{

                await esperar( 3000 );
            
            }

            contadorDeLuz++;

            luzActual.classList.remove( luzActual.getAttribute( 'color' ) );

        }

    }else{

        if ( contadorDeLuz > actual ) {

            $panelEstado.textContent = 'Estado: Descendiendo ⬇️';

            console.log( listaVisitar );

            $panelSolicitudExplicada.textContent = `partiendo de ${pisoActual} para ir a ${actual}`;

            while( contadorDeLuz > actual ){

                const luzActual = $lucesDelCiruclo[ contadorDeLuz ];
            
                luzActual.classList.add( luzActual.getAttribute( 'color' ) );

                const indice = listaVisitar.indexOf( contadorDeLuz );

                
                if( indice > -1 ){

                    $panelEstado.textContent = 'Estado: Detenido 🛑';
                    solicitudesAtendidas++;
                    $panelSolicitudExplicada.textContent = `Detenido para tomar una solicitud que esta en el camino`;
                    listaVisitar.splice( indice, 1 );
                    $panelSolicitudesAtender.textContent = `Solicitdes en espera: ${listaVisitar.length}`;
                    $panelSolicitudAtendida.textContent = `Solicitdes atendidas: ${solicitudesAtendidas}`;
                    await esperar( 4500 );
                    $panelSolicitudExplicada.textContent = `partiendo de ${pisoActual} para ir a ${actual}`;

                }else{

                    await esperar( 3000 );
            
                }

                contadorDeLuz--;

                luzActual.classList.remove( luzActual.getAttribute( 'color' ) );

            }
        }
    }

    const luzDestino = $lucesDelCiruclo[ actual ];
    luzDestino.classList.add( luzDestino.getAttribute( 'color' ) );
    $panelEstado.textContent = 'Estado: Detenido 🛑';

    enMovimiento = false;

    solicitudesAtendidas++;

    $panelSolicitudAtendida.textContent = `Solicitdes atendidas: ${solicitudesAtendidas}`;

    $panelSolicitudExplicada.textContent = `ultima solicitud atendida desde ${pisoActual} para ir a ${actual}`;

    pisoActual = actual;

    if ( listaVisitar.length > indiceactual ) {

        mostrarLuz( listaVisitar[ indiceactual ] );

        listaVisitar.splice( 0, 1 );
        
        $panelSolicitudesAtender.textContent = `Solicitdes en espera: ${listaVisitar.length}`;

    }
   
}

