# 🚚 Gerador de Abastecimento PCP

Ferramenta web (front-end puro, sem back-end) para cruzar pedidos de picking com a posição de estoque e gerar a lista de SKUs que precisam de abastecimento na apanha.

## O que a ferramenta faz

- Lê o relatório de **Pedidos** (Metabase, `.xlsx`/`.xls`) e a **Posição de Endereços** (`.txt`/`.csv`).
- Cruza os dois arquivos por SKU e calcula, para cada item:
  - saldo atual na apanha, norma, quantidade em falta e status (`OK`, `ABASTECER`, `SEM APANHA`);
  - prioridade (`CRÍTICO`, `ALTA`, `NORMAL`, `OK`).
- Mostra KPIs (Total de SKUs, Itens a abastecer, Unidades em falta, Itens sem apanha).
- Permite filtrar o resultado por SKU e por status.
- Exporta o resultado para Excel e imprime listas de abastecimento (por rua ou por volume faltante).
- Gera **sugestões de movimentação**: SKUs com pulmão em rua diferente da apanha, priorizando quem ganha mais economia (mais ruas de distância) ao ser movido para mais perto.
- Sincronização automática opcional: ao conectar uma pasta local, o navegador monitora os dois arquivos e reprocessa sozinho sempre que um deles é atualizado.

## Como usar

1. Abra o arquivo `index.html` em um navegador (Chrome ou Edge — a sincronização automática usa a File System Access API, disponível apenas nesses navegadores).
2. Em **Arquivos**, selecione o arquivo de Pedidos (Metabase) e o arquivo de Posição de Endereços.
3. Clique em **Processar Dados**.
4. Use os filtros, exporte para Excel ou imprima as listas conforme a necessidade.
5. (Opcional) Clique em **Conectar Pasta** para apontar uma pasta local com os dois arquivos e deixar o reprocessamento automático.

## Formato esperado dos arquivos

**Pedidos (Metabase, Excel)** — colunas usadas: `Seqproduto`, `Desccompleta`, `Quantidade`.

**Posição de Endereços (`.txt`/`.csv`, delimitado por `;`)** — colunas usadas: `CODIGO`, `ESPECIE_END`, `STATUS_ENDERECO`, `QTD_END`, `NORMA_APANHA`, `CODRUA`, `NROPREDIO`, `NROAPARTAMENTO`, `NROSALA`.

## Tecnologias

Projeto 100% estático (HTML, CSS e JavaScript puro, sem build), usando via CDN:
- [SheetJS (xlsx)](https://cdnjs.com/libraries/xlsx) para leitura/exportação de Excel;
- [PapaParse](https://www.papaparse.com/) para leitura do arquivo de posições.

Não há etapa de instalação ou build — basta abrir o `index.html`.
