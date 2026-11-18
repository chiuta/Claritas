# Claritas — Política de privacidade

**Versão 1.10.2 · Última atualização: 18 nov 2026** · [English](PRIVACY.md) · [Română](PRIVACY.ro.md) · [Français](PRIVACY.fr.md) · [Italiano](PRIVACY.it.md) · [Español](PRIVACY.es.md) · Português · [Deutsch](PRIVACY.de.md) · [Magyar](PRIVACY.hu.md)

> Tradução assistida por máquina, ainda não revista por um falante nativo. Em caso de diferença, prevalece o texto em inglês (PRIVACY.md).

O Claritas é uma extensão de acessibilidade gratuita e de código aberto (MIT). **Não tem telemetria, análises, contas nem servidores próprios.** Este documento indica exatamente o que armazena e os poucos casos em que o seu navegador (não o Claritas) comunica com terceiros.

## O que o Claritas armazena
Tudo é guardado no armazenamento de extensões do navegador (`storage.local`):
- as suas definições, perfis e regras por site;
- as funcionalidades opcionais que ativar: lista de leitura e notas, o seu CSS por site, um ficheiro de dicionário que importar, realces.

As capturas de ecrã e as gravações de ecrã são criadas no navegador e guardadas diretamente na pasta Transferências. O Claritas nunca as envia.

Pode exportar ou apagar tudo a partir da janela do popup ou removendo a extensão.

## O que o Claritas lê
Para fazer o seu trabalho (corrigir o contraste, ler em voz alta, auditar, etc.), o script de conteúdo lê as páginas que visita **dentro do seu navegador**. O Claritas não envia o conteúdo das páginas para lado nenhum. O botão «O que sai do navegador?» do painel de módulos opcionais lê o código da própria extensão e lista cada chamada de rede encontrada, para que o possa verificar.

Para estimar o contraste do texto sobre uma imagem de fundo, o script de conteúdo pode descodificar essa imagem localmente (uma pequena tela) quando é uma imagem `data:`/`blob:` ou provém do mesmo site da página (normalmente já na cache). O Claritas nunca obtém imagens de outros sites e nada sobre a imagem é guardado ou enviado.

## Casos em que os dados podem sair do navegador
Nunca ativos por predefinição, ou apenas por ação explícita sua:
1. **Botão de definição**: abre o dexonline.ro ou o Wiktionary num novo separador, só quando o prime. Esses sites veem a palavra pesquisada.
2. **Controlo por voz e legendas em direto (Chrome)**: o serviço de reconhecimento de voz do navegador processa o áudio, segundo os termos da Google. O Firefox não tem esse serviço.
3. **Sincronização de definições (desativada por predefinição)**: usa o `storage.sync` do navegador, sincronizado pelo fabricante. Inclui apenas definições e regras por site, nunca dicionário, notas, capturas ou gravações.
4. **IA no dispositivo (desativada por predefinição)**: usa a Prompt API do Chrome com o modelo já presente no computador. O Claritas não envia texto das páginas para nenhum servidor; o Chrome pode transferir o seu próprio modelo, o que é comportamento do Chrome.
5. **Pacotes opcionais** (`-ocr`, `-axe`, `-pdf`): incluídos e executados localmente; não fazem pedidos.

## Permissões
- `storage`: guardar as suas definições.
- Acesso a todos os sites (script de conteúdo em `<all_urls>`, todas as frames): necessário para aplicar correções de contraste, temas e ferramentas em qualquer página onde as queira usar. A extensão pode ser desativada globalmente ou por site.

## Crianças
O Claritas não recolhe dados pessoais de ninguém, incluindo crianças.

## Alterações
As alterações a esta política aparecem neste ficheiro e no histórico do repositório: https://github.com/chiuta/Claritas

## Contacto
Alexandru-Ionuț Chiuță (Alexio) · alexio@trom.tf
