# Simulador Web de Ascensor — Documento Explicativo

**Asignatura:** CAO802 — Desarrollo de Aplicaciones Web (1-2026)
**Práctica:** Simulador Web de Ascensor con Gestión de Estados, Eventos, Asincronía y Persistencia Local

**Integrantes:**
- Benjamin Marroqui
- Jhosber Ynojosa

---

## 1. Descripción general del simulador

Aplicación web del lado del cliente (HTML + CSS + JavaScript puro, sin backend ni base de
datos relacional) que representa un ascensor dentro de un edificio de varios pisos.

El usuario puede llamar al ascensor desde cualquier piso. El ascensor registra las
solicitudes en una cola, se desplaza **de forma progresiva** (no se teletransporta),
atiende los pisos siguiendo una estrategia de optimización de ruta, actualiza la interfaz
en cada cambio de estado y conserva información entre recargas mediante almacenamiento local.

## 2. Reglas definidas

- El ascensor inicia en la **Planta Baja (piso 0)**.
- El edificio tiene **6 pisos** (0 a 5); el mínimo exigido es 5.
- El ascensor solo puede estar en un piso a la vez.
- Siempre tiene una dirección: **subiendo, bajando o detenido**.
- Una solicitud se registra al presionar el botón **Llamar** de un piso.
- Una solicitud atendida se elimina de la lista de pendientes.
- La interfaz refleja en todo momento el estado real del ascensor.
- El movimiento toma tiempo (cada tramo entre pisos tarda 1.5 s).
- No se registra dos veces la misma solicitud ni se rompe con clics rápidos.
- La información guardada puede consultarse y recuperarse tras recargar la página.

## 3. Cantidad de pisos y estado inicial

| Parámetro | Valor inicial |
|---|---|
| Total de pisos | 6 (0 = Planta Baja … 5) |
| Piso actual | 0 (Planta Baja) |
| Dirección | detenido |
| Solicitudes pendientes | [] (vacía) |
| Solicitudes atendidas | 0 |
| Tiempo entre pisos | 1500 ms |
| Tiempo de parada | 1500 ms |

## 4. Estructura de datos utilizada

Todo el estado vive en un único objeto `estado` (fuente de verdad), definido en `script.js`:

```js
const estado = {
    totalPisos: 6,
    pisoActual: 0,
    pisoDestino: null,
    direccion: 'detenido',   // 'subiendo' | 'bajando' | 'detenido'
    situacion: 'detenido',   // 'detenido' | 'subiendo' | 'bajando' | 'atendiendo'
    pendientes: [],          // COLA de solicitudes (números de piso, sin repetidos)
    atendidas: 0,
    ultimoEvento: '—',
    tiempoPiso: 1500,
    tiempoParada: 1500,
};
```

La **cola de solicitudes** (`estado.pendientes`) es un arreglo de números de piso. Se usa
un arreglo porque permite recorrerlo, filtrar los pisos que quedan hacia arriba/abajo y
eliminar el atendido con `splice()`. Antes de encolar se verifica con `includes()` que el
piso no esté ya presente, evitando solicitudes duplicadas.

## 5. Separación entre lógica y vista

- La **lógica** solo modifica el objeto `estado` y luego llama a `renderizar()`.
- `renderizar()` es la **única** función que traduce el estado al DOM (paneles y filas de
  piso). La vista nunca guarda estado propio: se puede entender la lógica sin mirar el CSS.

## 6. Explicación del algoritmo de movimiento

El movimiento se simula con **asincronía** mediante `async/await` y un temporizador:

```js
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

`moverHacia(destino)` avanza la cabina **piso a piso**: en cada paso fija la dirección,
renderiza, espera `tiempoPiso` con `await esperar(...)`, incrementa/decrementa `pisoActual`
en 1 y vuelve a renderizar. Así la interfaz muestra el recorrido `Piso 2 → 3 → 4 → 5`
sin saltos instantáneos.

## 7. Manejo de solicitudes y criterio de atención (algoritmo tipo SCAN)

La estrategia de atención es una variante del **algoritmo SCAN** ("algoritmo del ascensor"):

1. `elegirDestino()` decide el extremo hacia el que se dirige la cabina según la dirección
   actual: si va subiendo, se dirige al piso pendiente **más alto**; si va bajando, al
   **más bajo**. Solo invierte el sentido cuando no quedan solicitudes en la dirección actual.
2. Mientras se mueve hacia ese extremo, si pasa por un piso que también estaba pendiente,
   **se detiene y lo atiende en el camino** (`atenderPiso`) antes de continuar.
3. `atenderPiso()` saca el piso de la cola, incrementa el contador **una sola vez**
   (punto único, evita el doble conteo), registra el movimiento y espera `tiempoParada`.

Esto minimiza los cambios de dirección: p. ej., yendo del piso 1 al 10, si llaman desde el
5 mientras sube, se detiene en el 5 antes de seguir al 10.

**Robustez:** la bandera `enMovimiento` impide arrancar dos recorridos simultáneos; las
solicitudes hechas durante el movimiento simplemente se encolan. Por eso pulsar varios
botones rápidamente no rompe el simulador.

## 8. Datos almacenados localmente y persistencia

Se usan **dos** mecanismos de persistencia del lado del cliente:

### a) `localStorage` (mínimo obligatorio) — `script.js`
Guarda en formato JSON, bajo la clave `ASCENSOR_ESTADO`, el **último piso** donde quedó la
cabina y la configuración (`totalPisos`, `tiempoPiso`). Se escribe tras cada solicitud
atendida (`guardarEstadoLocal`) y se recupera al cargar la página (`cargarEstadoLocal`),
de modo que al recargar el ascensor reaparece en el piso donde se quedó.

### b) `IndexedDB` (bonificación) — `baseDatos.js`
Guarda el **historial detallado** de movimientos en el almacén `HISTORIAL`. Cada registro
es `{ origen, destino, fecha }`. La página `historial.html` recorre el almacén con un cursor
y lista los viajes; el contador de solicitudes atendidas se sincroniza contando los
registros (`CargarContador`). El botón **Limpiar historial** vacía el almacén (`clear()`).

### Justificación y limitaciones
- **localStorage**: sencillo (clave-valor), síncrono, ideal para datos pequeños como el
  último piso. Limitaciones: solo texto (hay que serializar con `JSON.stringify`), ~5 MB,
  sin consultas ni índices, accesible por cualquier script del mismo origen.
- **IndexedDB**: base de datos no relacional del navegador, asíncrona, con índices y mayor
  capacidad; adecuada para un historial que crece. Limitaciones: API más verbosa y basada
  en eventos, y también es local al navegador/dispositivo (los datos no se comparten entre
  navegadores ni equipos).

## 9. Organización del código

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura de la interfaz principal |
| `styless.css` | Presentación visual |
| `script.js` | Estado, lógica del ascensor (SCAN), render y localStorage |
| `baseDatos.js` | Persistencia del historial con IndexedDB |
| `historial.html` | Vista del historial de viajes |

## 10. Dificultades encontradas

- Evitar el **doble conteo** de solicitudes atendidas: se centralizó el incremento en un
  único punto (`atenderPiso`).
- Coordinar la **asincronía** para que la interfaz mostrara cada piso del recorrido y no
  solo el destino final.
- Diseñar el criterio SCAN para atender pisos en el camino sin invertir la dirección de más.
- Separar limpiamente la lógica de la manipulación del DOM.

## 11. Mejoras posibles

- Selección dinámica de la cantidad de pisos y del tiempo de desplazamiento.
- Botones diferenciados para subir/bajar y apertura/cierre de puertas.
- Exportar el historial en JSON y visualización gráfica de la cola.
- Modo claro/oscuro y diseño responsivo avanzado.
- Simulación de varios ascensores o capacidad máxima de pasajeros.

## 12. Uso declarado de Inteligencia Artificial

- **Herramienta utilizada:** Claude.
- **Propósito de uso:** apoyo para estructurar el estado del simulador, apoyo en los estilos
  CSS de la interfaz y organizar la documentación.
- **Sugerencias aceptadas:** separación estado/vista con una función `renderizar()` única,
  apoyo en los estilos CSS.
- **Modificado por la pareja:** la pareja definió y ajustó los estilos CSS (colores del fondo,
  título, botones y resaltado del piso/pendientes) según su preferencia visual.
- **Aprendido durante el proceso:** cómo representar todo el estado del ascensor en un único
  objeto `estado` (piso actual, destino, dirección, cola de solicitudes, atendidas), y cómo
  separar ese estado de la vista para que la interfaz se derive del estado con `renderizar()`.

## 13. Cómo ejecutar

Abrir `index.html` en un navegador moderno (no requiere servidor). Para ver la persistencia,
completar viajes y recargar con F5; el historial se consulta en **Ver historial**.
