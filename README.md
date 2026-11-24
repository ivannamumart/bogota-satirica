# La Bogotá satírica de *Sin remedio* — V09

Cartografía especulativa e interactiva de la Bogotá de los años setenta, inspirada en la novela *Sin remedio* de Antonio Caballero. Un globo-maqueta de cemento gris sostiene una meseta urbana plana con arquitectura bogotana de época, vegetación andina, una red vial interconectada y los Cerros Orientales con Monserrate. El visitante recorre la ciudad como Ignacio Escobar, entra en los escenarios de la novela (viñetas 3D tipo cómic) y, al final de cada episodio, elige un futuro especulativo en «El gran concurso de la Bogotá posible».

## Cómo probar

Requiere Node.js 20 o superior.

```bash
npm ci
npm run dev        # abre http://localhost:5173
npm run build      # sitio estático en dist/
npm run build:single   # un único index.html autocontenido en dist-single/ (para compartir o subir a cualquier hosting)
```

## Controles

| Acción | Teclado / ratón | Táctil |
|---|---|---|
| Caminar | W A S D o flechas (relativo a la cámara) | joystick inferior izquierdo |
| Correr | Shift | botón CORRER |
| Girar cámara / zoom | arrastrar / rueda | arrastrar |
| Entrar a un escenario | E, Enter, clic en el botón amarillo o pisar el círculo dorado | botón amarillo |
| Mapa (y viaje rápido a lugares descubiertos) | M | botón de mapa |
| Libreta de Escobar (progreso y futuros) | J | botón de libreta |
| Día / noche | N | botón de sol |
| Ver el globo completo | G | botón de globo |
| Escena: avanzar / retroceder / salir | Espacio, Enter, →, clic · ← · Esc | botones ‹ › |
| Concurso | A B C o 1 2 3, o clic | toque |

## Qué cambió frente a la V08

- **Planta nueva validada por código**: `tests/validate-layout.mjs` comprueba que ningún edificio se solape con otro ni con una vía, que todos los senderos de acceso estén libres y que todas las puertas sean alcanzables desde la Séptima (búsqueda en anchura sobre la malla caminable).
- **Movimiento libre de juego** en tercera persona: se camina por vías, aceras, senderos y plazoletas con deslizamiento suave contra los bordes; los edificios, el templete, el paradero y los vehículos son sólidos. No es posible atravesar ni saltar fachadas.
- **Cámara de juego**: sigue al personaje, se puede girar y acercar, y se eleva por encima de las fachadas en lugar de atravesarlas.
- **Puertas claras**: círculo dorado pulsante, gema flotante, umbral iluminado y botón «Entrar».
- **Estética de maqueta de plastilina**: materiales mates, sombras suaves, anillo vial alrededor del borde, árboles que asoman por los costados del globo.
- **Escenas tipo cómic**: decorados propios para los 11 lugares, globos de diálogo anclados a la cabeza de quien habla, cartuchos de narración, onomatopeyas, cortes de cámara entre plano general y plano medio, y coreografía (caminar, sentarse, bailar, brindar, fumar, señalar, encogerse de hombros, leer, telefonear…).
- **Concurso de decisiones** con estética de programa de TV de los setenta; los futuros se representan con otra paleta y un aviso explícito: *Ficción interpretativa · no pertenece a la novela*.
- **La ciudad se transforma**: cada futuro elegido cuelga un estandarte en la fachada del lugar y queda registrado en la libreta (persistente en el navegador).
- **Sobre el proyecto** se conserva con su contenido original.

## Autoría de los textos

Las líneas con referencia **P-** proceden del corpus validado (`corpus_v2_corregido`) y se marcan en el globo como «Novela · P-xxx». Todo lo demás es redacción interpretativa del prototipo y se marca como «Reinterpretación · no es cita». Las bifurcaciones son ficción satírica original, claramente diferenciada de la novela.

## Estructura

- `src/data/layout.ts` — planta escénica (vías, lugares, hitos, puertas).
- `src/data/world.ts` — caminabilidad, colisiones, casas y árboles generados sin solapes, validación.
- `src/world/` — globo, ciudad, arquitectura, personajes articulados.
- `src/scenes/` — decorados, coreografía por línea y director de escena (cómic + concurso).
- `src/story/` — guiones (`expanded.ts`) y reparto.
- `tests/` — validación de planta, prueba de juego en navegador y galería de capturas.

## Pruebas

```bash
npm run validate                 # planta sin solapes y puertas alcanzables
npm run build && npm test        # recorrido completo en Chromium con WebGL (capturas en docs/qa/)
```
