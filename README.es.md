# Claritas

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · **Español** · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versión: 1.5.5 · Última actualización: 11/11/2026**

Extensión de accesibilidad todo en uno, gratuita. Sin telemetría, sin red, sin cuentas: todo se queda en tu navegador.

## Qué hace
- **Corrección automática del contraste (WCAG AA/AAA)**: mide el contraste real texto/fondo y ajusta solo el texto insuficiente, incluidos los campos deshabilitados.
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

Estado de verificación (v1.5.5): probado automáticamente en CI en Chromium, Edge, Brave, Firefox (varios canales), Safari 27.2 real en macOS, Safari 26.2 en el simulador iPhone/iPad, Chrome 113 y Firefox 162 en Android 14 (emulador). No verificado: Opera, Vivaldi, Samsung Internet real, la extensión activada en Safari/iOS reales, Chrome de marca. Alt+Shift+O/D/L/G se pueden reasignar en el navegador; P/H/S/M son fijos. El botón de definición abre dexonline.ro o Wiktionary solo al pulsarlo.
