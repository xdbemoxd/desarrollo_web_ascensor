const $lucesDelCiruclo = document.querySelectorAll('.piso');
const $botones = document.querySelectorAll('.button_t')
let contadorDeLuz = 0;
let enMovimiento = false;
let listaVisitar = [];
let indiceactual = 0;

const esperar = (milisegundos) => new Promise(resolve => setTimeout(resolve, milisegundos));

const mostrarLuz = async ( actual ) => {
    $lucesDelCiruclo[ actual ].className = 'piso';

   

    if (enMovimiento){
        listaVisitar.push(actual);
        return;
    } 

    enMovimiento = true
    
    if( contadorDeLuz < actual ){

        console.log( listaVisitar );

        while( contadorDeLuz < actual ){

            const luzActual = $lucesDelCiruclo[contadorDeLuz];
            
            luzActual.classList.add( luzActual.getAttribute( 'color' ) );

            await esperar(3000);

            contadorDeLuz++;

            luzActual.classList.remove(luzActual.getAttribute('color'));

        }
    }else{

        if ( contadorDeLuz > actual ) {

            console.log( listaVisitar );

            while( contadorDeLuz > actual ){

                const luzActual = $lucesDelCiruclo[contadorDeLuz];
            
                luzActual.classList.add( luzActual.getAttribute( 'color' ) );
                
                await esperar(3000);

                contadorDeLuz--;

                luzActual.classList.remove(luzActual.getAttribute('color'));

            }
        }
    }

    const luzDestino = $lucesDelCiruclo[actual];
    luzDestino.classList.add(luzDestino.getAttribute('color'));
    await esperar(3000);
    luzDestino.classList.remove(luzDestino.getAttribute('color'));

    

    enMovimiento = false

    if ( listaVisitar.length > indiceactual ) {

        mostrarLuz( listaVisitar[ indiceactual ] );

        indiceactual++;
        
    }
   
}

