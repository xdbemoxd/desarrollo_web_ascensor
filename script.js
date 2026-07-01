const $lucesDelCiruclo = document.querySelectorAll('.piso');
const $botones = document.querySelectorAll('.button_t')
let contadorDeLuz = 0;
let enMovimiento = false;

const esperar = (milisegundos) => new Promise(resolve => setTimeout(resolve, milisegundos));

const mostrarLuz = async ( actual ) => {
    $lucesDelCiruclo[ actual ].className = 'piso';

    $botones.forEach(btn => btn.disabled = true);

    if (enMovimiento) return

    enMovimiento = true
    
    if( contadorDeLuz < actual ){

        while( contadorDeLuz < actual ){

            const luzActual = $lucesDelCiruclo[contadorDeLuz];
            
            luzActual.classList.add( luzActual.getAttribute( 'color' ) );

            await esperar(3000);

            contadorDeLuz++;

            luzActual.classList.remove(luzActual.getAttribute('color'));

        }
    }else{
        if ( contadorDeLuz > actual ) {

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

    $botones.forEach(btn => btn.disabled = false);

    enMovimiento = false
   
}

$botones.forEach((boton, index) => {
    boton.addEventListener('click', () => {
        // Al hacer clic, llamamos a la función pasándole el índice (0, 1, 2, 3...)
        mostrarLuz(index);
    });
});