# Claritas — Política de privacidad

**Versión 1.10.1 · Última actualización: 18 nov 2026** · [English](PRIVACY.md) · [Română](PRIVACY.ro.md) · [Français](PRIVACY.fr.md) · [Italiano](PRIVACY.it.md) · Español · [Português](PRIVACY.pt.md) · [Deutsch](PRIVACY.de.md) · [Magyar](PRIVACY.hu.md)

> Traducción asistida por máquina, aún no revisada por un hablante nativo. Si hay diferencias, prevalece el texto en inglés (PRIVACY.md).

Claritas es una extensión de accesibilidad gratuita y de código abierto (MIT). **No tiene telemetría, analíticas, cuentas ni servidores propios.** Este documento indica exactamente qué almacena y los pocos casos en que tu navegador (no Claritas) se comunica con un tercero.

## Qué almacena Claritas
Todo se guarda en el almacenamiento de extensiones de tu navegador (`storage.local`):
- tus ajustes, perfiles y reglas por sitio;
- las funciones opcionales que actives: lista de lectura y notas, tu CSS por sitio, un archivo de diccionario que importes, resaltados.

Las capturas de pantalla y las grabaciones se crean en el navegador y se guardan directamente en tu carpeta de Descargas. Claritas nunca las sube.

Puedes exportar o borrar todo desde la ventana emergente o eliminando la extensión.

## Qué lee Claritas
Para hacer su trabajo (corregir el contraste, leer en voz alta, auditar, etc.), el script de contenido lee las páginas que visitas **dentro de tu navegador**. Claritas no envía el contenido de las páginas a ninguna parte. El botón «¿Qué sale del navegador?» del panel de módulos opcionales lee el código de la propia extensión y enumera cada llamada de red que encuentra, para que puedas comprobarlo tú mismo.

Para estimar el contraste del texto sobre una imagen de fondo, el script de contenido puede decodificar esa imagen localmente (un pequeño lienzo) cuando es una imagen `data:`/`blob:` o procede del mismo sitio que la página (normalmente ya en la caché). Claritas nunca descarga imágenes de otros sitios, y nada de la imagen se almacena ni se envía.

## Casos en los que los datos pueden salir de tu navegador
Nunca activados por defecto, o solo por acción explícita tuya:
1. **Botón de definición**: abre dexonline.ro o Wiktionary en una pestaña nueva, solo cuando lo pulsas. Esos sitios ven la palabra buscada.
2. **Control por voz y subtítulos en directo (Chrome)**: el servicio de reconocimiento de voz del navegador procesa el audio, según las condiciones de Google. Firefox no tiene ese servicio.
3. **Sincronización de ajustes (desactivada por defecto)**: usa el `storage.sync` de tu navegador, que sincroniza el fabricante. Solo incluye ajustes y reglas por sitio, nunca diccionario, notas, capturas ni grabaciones.
4. **IA en el dispositivo (desactivada por defecto)**: usa la API Prompt de Chrome con el modelo que ya está en tu equipo. Claritas no envía texto de páginas a ningún servidor; Chrome puede descargar su propio modelo, lo cual es comportamiento de Chrome.
5. **Paquetes opcionales** (`-ocr`, `-axe`, `-pdf`): incluidos y ejecutados localmente; no hacen peticiones.

## Permisos
- `storage`: guardar tus ajustes.
- Acceso a todos los sitios (script de contenido en `<all_urls>`, todos los marcos): necesario para aplicar correcciones de contraste, temas y herramientas en cualquier página donde decidas usarlos. La extensión puede desactivarse globalmente o por sitio.

## Menores
Claritas no recopila datos personales de nadie, incluidos los menores.

## Cambios
Los cambios de esta política aparecen en este archivo y en el historial del repositorio: https://github.com/chiuta/Claritas

## Contacto
Alexandru-Ionuț Chiuță (Alexio) · alexio@trom.tf
