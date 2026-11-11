# Claritas

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · **Português** · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versão: 1.5.3 · Última atualização: 11/11/2026**

Extensão de acessibilidade tudo em um, gratuita. Sem telemetria, sem rede, sem contas: tudo fica no seu navegador.

## O que faz
- **Correção automática do contraste (WCAG AA/AAA)**: mede o contraste real texto/fundo e ajusta apenas o texto insuficiente, incluindo campos desativados.
- **Temas de alto contraste**, filtros de cor, **daltonismo** (correção e simulação), filtro de luz azul, simulador de visão.
- **Texto**: zoom, tamanho, espaçamento, tipos de letra (adequado à dislexia, Lexend, Atkinson Hyperlegible), alinhamento à esquerda.
- **Leitura**: régua, máscara, lupa, modo de leitura, leitura rápida, leitura em voz alta (vozes locais), realces com exportação.
- **Motricidade e controlo**: alvos de clique grandes, clique por permanência, varrimento com um só botão, etiquetas numeradas, desbloqueio de colar.
- **Calma e estabilidade**: oculta avisos e janelas pop-up, reflow, congela GIF, mantém o foco visível.
- **Auditoria WCAG 2.2** com monitorização contínua e verificações manuais.
- **Captura de ecrã local** (área visível, região, página inteira, elemento) com anotações, cobertura automática de dados pessoais (também em frames e shadow DOM) e ZIP com PNG + descrição (.md).
- **Gravação de ecrã local** com anéis ao clicar, teclas mostradas e registo de ações WebVTT.
- **Perfis**, definições por site, exportação/importação JSON, políticas empresariais (managed storage).
- **8 idiomas**: English, Română, Français, Italiano, Español, Português, Deutsch, Magyar.

## Instalação

Escolha o pacote adequado ao seu navegador (pasta `dist/` ou ficheiros da versão):

| Pacote | Navegadores |
|---|---|
| `claritas-chromium.zip` | Chrome, Edge, Opera / Opera GX, Brave, Vivaldi, Arc, Dia, Comet, Yandex, Whale e qualquer navegador Chromium 109+ |
| `claritas-firefox.zip` | Firefox (computador 140+ e Android 142+), LibreWolf, Zen, Floorp, Waterfox, Mullvad Browser |
| `claritas-safari-source.zip` | Safari macOS / iOS / iPadOS (requer um Mac com Xcode) |

- **Família Chromium**: descompacte, abra a página de extensões (`chrome://extensions`, `edge://extensions`, `opera://extensions`…), ative o *modo de programador*, escolha *Carregar sem compactação* e selecione a pasta.
- **Firefox**: `about:debugging#/runtime/this-firefox` → *Carregar extensão temporária* → `manifest.json`. Para instalação permanente, assine-o como extensão não listada em addons.mozilla.org (ID `claritas@trom.tf`).
- **Safari**: num Mac com Xcode execute `./build-safari.sh` a partir do código descompactado e ative-o em Safari → Definições → Extensões.
- **Telemóvel**: Firefox Android (através de uma coleção personalizada de extensões), Edge Android e Samsung Internet (através das respetivas lojas). Chrome, Brave e Opera no Android não aceitam extensões.

## Atalhos

`Alt+Shift+C` ativar/desativar · `T` tema · `R` leitura · `G` régua · `Alt+Shift+P` menu de captura · `Alt+Shift+H` etiquetas numeradas · `Alt+Shift+S` varrimento. Alteram-se nas definições de atalhos das extensões do navegador (o popup tem um botão para isso).

## Privacidade

Sem pedidos de rede, sem telemetria, sem contas. As capturas e gravações são criadas e guardadas localmente no seu navegador.

## Limites conhecidos

- Safari e Samsung Internet não têm políticas empresariais (managed); o Firefox Android não tem gravação de ecrã.
- O Safari iOS pode cortar as capturas; use a captura de região ou de elemento.
- Verificado em direto no Chrome; Firefox, Safari e os restantes navegadores foram analisados estaticamente.

## Licença

MIT — copyright Alexandru-Ionuț Chiuță (Alexio).

## Apoio

Se o Claritas lhe for útil, pode apoiar o trabalho: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
