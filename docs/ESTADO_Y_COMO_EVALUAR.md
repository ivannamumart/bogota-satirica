# Estado de la reconstrucción V04

**Esta es una versión para revisión, no un juego final.** Conserva el globo de cemento gris y coloca la ciudad en la corona superior. La red contiene doce lugares, once accesos y carreteras conectadas por cruces.

## Controles

- Ratón: gira la esfera en la vista general. Rueda: zoom.
- W / flecha arriba: entrar al recorrido y avanzar; S / flecha abajo: retroceder por el tramo.
- A / D o flechas izquierda / derecha: seleccionar salida al acercarse a un cruce.
- Shift: caminar más rápido. Esc: volver o salir del interior.
- N: adelantar la fase del día; el ciclo ocurre también automáticamente.
- En escenas: lee las líneas de forma progresiva. Al terminar, elige con 1/2/3 o con el ratón.

## Estado real de calidad

Las mallas y personajes son procedimentales y siguen siendo estilizados; las animaciones no están capturadas por movimiento ni tienen animaciones esqueléticas complejas. El rediseño de cámara de caminata después de la captura inicial es una mejora de código que debe juzgarse en un navegador. Las localizaciones literarias son interpretativas, no georreferenciación métrica.

## Para probar en Mac

1. Descomprime el ZIP y abre la carpeta.
2. En Terminal ejecuta `npm ci` y después `npm run dev`.
3. Abre la dirección local mostrada por Vite (habitualmente http://localhost:5173).
4. Recorre al menos dos cruces y entra en La Soledad, El Unicornio y La Porciúncula. Comprueba que Esc te devuelva al globo.
