# Claritas

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · **Português** · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versão: 1.7.0 · Última atualização: 12/11/2026**

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

`Alt+Shift+O` ativar/desativar · `D` tema · `L` leitura · `G` régua · `Alt+Shift+P` menu de captura · `Alt+Shift+H` etiquetas numeradas · `Alt+Shift+S` varrimento. Alteram-se nas definições de atalhos das extensões do navegador (o popup tem um botão para isso).

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

Estado de verificação (v1.6.0): testado automaticamente em CI no Chromium, Edge, Brave, Firefox (vários canais), Safari 27.2 real no macOS, Safari 26.2 no simulador iPhone/iPad, Chrome 113 e Firefox 162 no Android 14 (emulador). Verificado em CI no Linux para v1.7.0: Opera 140 (todos os 12 ficheiros de teste). Não verificado: Vivaldi (arranca, mas a ligação de depuração automática expira), Samsung Internet real, a extensão ativada no Safari/iOS reais, Chrome de marca. Alt+Shift+O/D/L/G podem ser alterados no navegador; P/H/S/M são fixos. O botão de definição só abre dexonline.ro ou Wiktionary ao clicar.

## Módulos opcionais (v1.7)
Todos estão desativados por predefinição (popup → «Mais» → «Módulos opcionais (v1.7)»). Não há telemetria; o botão «O que sai do navegador?» lê o código da extensão e lista os endereços e chamadas de rede encontrados.
- **Navegação rápida**: Alt+Shift+J/K título seguinte/anterior, M/N região seguinte/anterior, L lista filtrável de regiões, títulos e ligações, G destaque do parágrafo; foco ampliado e visível.
- **Controlo por voz** (Alt+Shift+V): comandos como «next heading», «zoom in», «read», «help». No Chrome o áudio é processado pelo serviço de voz do navegador; o Firefox não o tem.
- **Resumo, texto simplificado, glossário** (Alt+Shift+Y): resumo por seleção estatística de frases (não IA; usa o modelo local do Chrome apenas se «IA local» estiver ativa e disponível), simplificação que só divide frases longas, glossário de abreviaturas definidas na página e palavras longas (com o dicionário local, se importado).
- **Descrições para imagens sem alt**: a partir de legenda, título, texto da ligação ou nome do ficheiro; marcadas «gerado automaticamente». A imagem não é analisada.
- **Legendas em direto** (Alt+Shift+C): apenas a fala captada pelo microfone, não o áudio de vídeos ou da página.
- **Perfis novos**: idosos, tremor/motricidade, fotossensibilidade, TDAH/concentração.
- **Regras por site**: exportar/importar JSON ou lista de domínios a desativar.
- **Relatório de auditoria**: HTML, CSV ou JSON com correspondência WCAG 2.2 / EN 301 549, correções sugeridas e comparação com uma referência guardada.
- **Modo CI**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (código de saída 1 acima do limiar). Cobre apenas as regras automáticas do Claritas.
- **Verificado (Chromium, extensão real)**: 36 verificações em `test/t14_v17.py`. **Não verificado**: reconhecimento de voz com voz real (apenas início/paragem e o analisador de comandos), legendas em direto com voz real, os módulos no Safari. Os módulos estão verificados no Firefox (todos os canais, Linux/Windows/macOS).

## Módulos opcionais (v1.6)
Todos desligados por defeito (popup → «Módulos opcionais»); nada sai do navegador. Classes gramaticais no Leitor (romeno/inglês, heurístico), regras de auditoria adicionais (ARIA, formulários, main, zoom, legendas), dicionário local (o seu JSON/TSV, máx. 4 MB), sincronização das definições com `storage.sync` do navegador (sem dicionário nem gravações) e OCR local no pacote separado `claritas-*-ocr.zip` (~20 MB; verificado automaticamente apenas no Chromium, Firefox/Safari não verificados).
