# Claritas

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · **Español** · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versión: 1.8.1 · Última actualización: 13/11/2026**

Extensión de accesibilidad todo en uno, gratuita. Sin telemetría, sin red, sin cuentas: todo se queda en tu navegador.

## Qué hace
- **Corrección automática del contraste (WCAG AA/AAA)**: mide el contraste real texto/fondo y ajusta solo el texto insuficiente, incluidos los campos deshabilitados. Desde la 1.8.1 también trata el texto sobre imágenes de fondo (color medio de las imágenes del mismo origen o data:, si no, elección prudente blanco/negro con un halo); los iconos pequeños no se tratan como fondos.
- **Temas de alto contraste**, filtros de color, **daltonismo** (corrección y simulación), filtro de luz azul, simulador de visión.
- **Texto**: zoom, tamaño, espaciado, fuentes (apta para dislexia, Lexend, Atkinson Hyperlegible), alineación a la izquierda.
- **Lectura**: regla, máscara, lupa, modo lectura, lectura rápida, lectura en voz alta (voces locales), resaltados con exportación.
- **Motricidad y control**: objetivos de clic grandes, clic por permanencia, barrido con un solo pulsador, etiquetas numeradas, desbloqueo de pegado.
- **Calma y estabilidad**: oculta avisos y ventanas emergentes, reflujo, congela GIF, mantiene el foco visible.
- **Auditoría WCAG 2.2** con supervisión continua y comprobaciones manuales.
- **Captura de pantalla local** (área visible, región, página completa, elemento) con anotaciones, cobertura automática de datos personales (también en marcos y shadow DOM) y ZIP con PNG + descripción (.md).
- **Grabación de pantalla local** con anillos al hacer clic, teclas mostradas y registro de acciones WebVTT.
- **Perfiles**, ajustes por sitio, exportación/importación JSON, políticas empresariales (managed storage).
- **8 idiomas**: English, Română, Français, Italiano, Español, Português, Deutsch, Magyar.

## Instalación

Elige el paquete que corresponda a tu navegador (carpeta `dist/` o archivos de la versión):

| Paquete | Navegadores |
|---|---|
| `claritas-chromium.zip` | Chrome, Edge, Opera / Opera GX, Brave, Vivaldi, Arc, Dia, Comet, Yandex, Whale y cualquier navegador Chromium 109+ |
| `claritas-firefox.zip` | Firefox (escritorio 140+ y Android 142+), LibreWolf, Zen, Floorp, Waterfox, Mullvad Browser |
| `claritas-safari-source.zip` | Safari macOS / iOS / iPadOS (requiere un Mac con Xcode) |

- **Familia Chromium**: descomprime, abre la página de extensiones (`chrome://extensions`, `edge://extensions`, `opera://extensions`…), activa el *modo de desarrollador*, elige *Cargar descomprimida* y selecciona la carpeta.
- **Firefox**: `about:debugging#/runtime/this-firefox` → *Cargar complemento temporal* → `manifest.json`. Para una instalación permanente, fírmalo como complemento no listado en addons.mozilla.org (ID `claritas@trom.tf`).
- **Safari**: en un Mac con Xcode ejecuta `./build-safari.sh` desde el código descomprimido y actívalo en Safari → Ajustes → Extensiones.
- **Móvil**: Firefox Android (mediante una colección personalizada de complementos), Edge Android y Samsung Internet (mediante sus tiendas). Chrome, Brave y Opera en Android no admiten extensiones.

## Atajos

`Alt+Shift+O` activar/desactivar · `D` tema · `L` lectura · `G` regla · `Alt+Shift+P` menú de captura · `Alt+Shift+H` etiquetas numeradas · `Alt+Shift+S` barrido. Se cambian en los ajustes de atajos de extensiones del navegador (el popup tiene un botón para ello).

## Privacidad

Sin peticiones de red, sin telemetría, sin cuentas. Las capturas y grabaciones se crean y guardan localmente en tu navegador.

## Límites conocidos

- Safari y Samsung Internet no tienen políticas empresariales (managed); Firefox Android no tiene grabación de pantalla.
- Safari iOS puede recortar las capturas; usa la captura de región o de elemento.
- Verificado en directo en Chrome; Firefox, Safari y los demás navegadores se revisaron de forma estática.

## Licencia

MIT — copyright Alexandru-Ionuț Chiuță (Alexio).

## Apoyo

Si Claritas te resulta útil, puedes apoyar el trabajo: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).

Política de privacidad: [PRIVACY.md](PRIVACY.md)

Sitio web: https://claritas.chiuta.ro

Install: https://claritas.chiuta.ro/#instalare · `install/install.sh` · `install/install.ps1`

Estado de verificación (v1.6.0): probado automáticamente en CI en Chromium, Edge, Brave, Firefox (varios canales), Safari 27.2 real en macOS, Safari 26.2 en el simulador iPhone/iPad, Chrome 113 y Firefox 162 en Android 14 (emulador). Verificado en CI en Linux para v1.7.0: Opera 140 (los 12 archivos de prueba). No verificado: Vivaldi (arranca, pero la conexión de depuración automática caduca), Samsung Internet real, la extensión activada en Safari/iOS reales, Chrome de marca. Alt+Shift+O/D/L/G se pueden reasignar en el navegador; P/H/S/M son fijos. El botón de definición abre dexonline.ro o Wiktionary solo al pulsarlo.

## Módulos opcionales (v1.8)
Todos están desactivados por defecto (popup → «Más» → «Módulos opcionales (v1.8)»). Todo se ejecuta en local; nada se envía a ningún sitio.
- **Inspector de contraste** (Alt+Mayús+I): pasa el ratón o enfoca un texto para ver colores reales, relación, AA/AAA y una corrección sugerida; clic para fijar.
- **Mapa del orden de tabulación** (Alt+Mayús+T): insignias numeradas en el orden de tabulación, nombre accesible y rol de cada control, con los problemas (sin nombre, tabindex positivo, aria-hidden en un elemento enfocable, saltos hacia atrás).
- **Lista de lectura y notas** (Alt+Mayús+B): guarda páginas, texto seleccionado y notas en el navegador; exporta a Markdown/JSON, importa JSON.
- **CSS propio por sitio** (Alt+Mayús+U): guardado localmente; se eliminan `@import` y las URL externas; plantillas (barras no fijas, enlaces subrayados, espaciado, ocultar banners).
- **Fórmulas** (Alt+Mayús+Q): descripciones habladas de MathML (fracciones, potencias, raíces, sumas, letras griegas; rumano e inglés) y lectura en voz alta.
- **Guía de voces** (popup → Voz): clasifica las voces para tu idioma, locales antes que en línea, con botón de prueba.
- **IA local** (Alt+Mayús+A, clase B): preguntas sobre la página y descripciones de imágenes sugeridas mediante la Prompt API de Chrome (Chrome 148+ con modelo local). Solo con tu consentimiento; marcadas «generadas automáticamente». No probado con un modelo real.
- **Paquetes opcionales**: `-axe` añade la auditoría axe-core (MPL-2.0) y `-pdf` un lector PDF local (pdf.js, Apache-2.0: índice, búsqueda, temas, lectura, guardar .txt). Se construyen con `tools/fetch_vendor.sh` y luego `python build.py`.
- **Verificado (Chromium, extensión real)**: `test/t15_v18.py`. Las comprobaciones de Firefox están en `test/ff_selenium.py`. Confirmado en CI (12/11/2026): Edge y Opera (Linux) con el mismo archivo, y las comprobaciones de Firefox de `test/ff_selenium.py` en Linux y Windows (estable, ESR, beta, nightly, developer edition); Firefox en macOS no se ejecutó (límite de GitHub). Sin cubrir: Safari, un modelo local real, la descarga de archivos .md/.json.

## Módulos opcionales (v1.7)
Todos están desactivados por defecto (popup → «Más» → «Módulos opcionales (v1.7)»). No hay telemetría; el botón «¿Qué sale del navegador?» lee el código de la extensión y enumera las direcciones y llamadas de red que encuentra.
- **Navegación rápida**: Alt+Mayús+J/K título siguiente/anterior, M/N región siguiente/anterior, L lista filtrable de regiones, títulos y enlaces, G foco en el párrafo; foco más grande y visible.
- **Control por voz** (Alt+Mayús+V): órdenes como «next heading», «zoom in», «read», «help». En Chrome el audio lo procesa el servicio de voz del navegador; Firefox no lo tiene.
- **Resumen, texto simplificado, glosario** (Alt+Mayús+Y): resumen por selección estadística de frases (no IA; usa el modelo local de Chrome solo si «IA local» está activada y disponible), simplificación que solo divide frases largas, glosario de abreviaturas definidas en la página y palabras largas (con el diccionario local, si se importó).
- **Descripciones para imágenes sin alt**: a partir de leyenda, título, texto del enlace o nombre de archivo; marcadas «generado automáticamente». No analiza la imagen.
- **Subtítulos en vivo** (Alt+Mayús+C): solo el habla captada por el micrófono, no el audio de vídeos o de la página.
- **Perfiles nuevos**: personas mayores, temblor/motricidad, fotosensibilidad, TDAH/concentración.
- **Reglas por sitio**: exportar/importar JSON o lista de dominios a desactivar.
- **Informe de auditoría**: HTML, CSV o JSON con correspondencia WCAG 2.2 / EN 301 549, correcciones sugeridas y comparación con una referencia guardada.
- **Modo CI**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (código de salida 1 si se supera el umbral). Solo cubre las reglas automáticas de Claritas.
- **Verificado (Chromium, extensión real)**: 36 comprobaciones en `test/t14_v17.py`. **No verificado**: reconocimiento de voz con voz real (solo inicio/parada y el analizador de órdenes), subtítulos en vivo con voz real, los módulos en Firefox/Safari.

## Módulos opcionales (v1.6)
Todos desactivados por defecto (popup → «Módulos opcionales»); nada sale del navegador. Categorías gramaticales en el Lector (rumano/inglés, heurístico), reglas de auditoría adicionales (ARIA, formularios, main, zoom, subtítulos), diccionario local (tu propio JSON/TSV, máx. 4 MB), sincronización de ajustes con `storage.sync` del navegador (sin diccionario ni grabaciones) y OCR local en el paquete aparte `claritas-*-ocr.zip` (~20 MB; verificado automáticamente solo en Chromium, Firefox/Safari sin verificar).
