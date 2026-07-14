// =====================================
// VARIÁVEIS GLOBAIS
// =====================================

let dadosPedidos = [];
let dadosPosicoes = [];
let resultado = [];

let paginaAtual = 1;

// =====================================
// CONFIGURAÇÃO DE PAVILHÕES
// =====================================
// O pavilhão de cada SKU é definido pela Rua (CODRUA) da posição
// de apanha. As faixas abaixo foram extraídas da relação oficial
// enviada (Perecível.txt, Pavilhão_1.txt, Pavilhão_2.txt,
// Pavilhão_3.txt), por isso cada pavilhão é uma LISTA de
// intervalos [ruaInicio, ruaFim] — as ruas não são contínuas.
// Caso o layout do CD mude, basta atualizar os intervalos abaixo.

const PAVILHOES = [

    {
        nome:"Perecível",
        ruas:[
            [26,27],
            [29,31],
        ],
    },
    {
        nome:"Pavilhão 1",
        ruas:[
            [3,14],
            [21,24],
            [51,65],
        ],
    },
    {
        nome:"Pavilhão 2",
        ruas:[
            [71,106],
        ],
    },
    {
        nome:"Pavilhão 3",
        ruas:[
            [311,317],
        ],
    },

];

function obterPavilhao(rua){

    const r = Number(rua) || 0;

    const encontrado =
    PAVILHOES.find(p =>
        p.ruas.some(([ruaInicio, ruaFim]) =>
            r >= ruaInicio &&
            r <= ruaFim
        )
    );

    return encontrado
    ? encontrado.nome
    : "Sem Pavilhão";

}

function popularFiltroPavilhao(){

    const opcoes =
    document.getElementById("filtroPavilhaoOpcoes");

    if(!opcoes) return;

    const nomes =
    PAVILHOES
    .map(p => p.nome)
    .concat(["Sem Pavilhão"]);

    let html = `
    <label class="filtro-pavilhao-item filtro-pavilhao-todos">
        <input
            type="checkbox"
            id="filtroPavilhaoTodos"
            checked
            onchange="alternarTodosPavilhoes(this)">
        Todos Pavilhões
    </label>
    <div class="filtro-pavilhao-separador"></div>
    `;

    nomes.forEach(nome=>{

        html += `
        <label class="filtro-pavilhao-item">
            <input
                type="checkbox"
                class="filtroPavilhaoItem"
                value="${nome}"
                checked
                onchange="atualizarSelecaoPavilhoes()">
            ${nome}
        </label>
        `;

    });

    opcoes.innerHTML = html;

    atualizarLabelPavilhao();

}

function togglePavilhaoDropdown(){

    const opcoes =
    document.getElementById("filtroPavilhaoOpcoes");

    if(!opcoes) return;

    opcoes.style.display =
    opcoes.style.display === "none"
    ? "block"
    : "none";

}

document.addEventListener("click", function(e){

    const container =
    document.getElementById("filtroPavilhaoMulti");

    const opcoes =
    document.getElementById("filtroPavilhaoOpcoes");

    if(!container || !opcoes) return;

    if(!container.contains(e.target)){

        opcoes.style.display = "none";

    }

});

function alternarTodosPavilhoes(chkTodos){

    document
    .querySelectorAll(".filtroPavilhaoItem")
    .forEach(chk=>{

        chk.checked = chkTodos.checked;

    });

    atualizarLabelPavilhao();

    if(typeof aplicarFiltros === "function"){

        aplicarFiltros();

    }

}

function atualizarSelecaoPavilhoes(){

    const itens =
    document.querySelectorAll(".filtroPavilhaoItem");

    const chkTodos =
    document.getElementById("filtroPavilhaoTodos");

    const todosMarcados =
    Array.from(itens)
    .every(chk => chk.checked);

    if(chkTodos){

        chkTodos.checked = todosMarcados;

    }

    atualizarLabelPavilhao();

    if(typeof aplicarFiltros === "function"){

        aplicarFiltros();

    }

}

function atualizarLabelPavilhao(){

    const label =
    document.getElementById("filtroPavilhaoLabel");

    if(!label) return;

    const itens =
    Array.from(
        document.querySelectorAll(".filtroPavilhaoItem")
    );

    const marcados =
    itens.filter(chk => chk.checked);

    if(marcados.length === 0){

        label.innerText = "Nenhum Pavilhão";

    }
    else if(marcados.length === itens.length){

        label.innerText = "Todos Pavilhões";

    }
    else{

        label.innerText =
        marcados
        .map(chk => chk.value)
        .join(", ");

    }

}

// Retorna a lista de pavilhões marcados. Array vazio (itens
// totalmente desmarcados) significa "nada selecionado" — os
// chamadores devem tratar isso como filtro vazio de resultado.
// Quando TODOS estão marcados, retorna [] (equivalente a "sem
// filtro", mesmo comportamento de antes com "Todos Pavilhões").
function obterPavilhoesFiltroAtual(){

    const itens =
    Array.from(
        document.querySelectorAll(".filtroPavilhaoItem")
    );

    if(!itens.length){

        return [];

    }

    const marcados =
    itens.filter(chk => chk.checked);

    if(marcados.length === itens.length){

        return []; // todos marcados = sem filtro

    }

    return marcados.map(chk => chk.value);

}

// =====================================
// INICIALIZAÇÃO
// =====================================

document
.getElementById("arquivoPedidos")
.addEventListener("change", function(){

    const arquivo = this.files[0];

    document
    .getElementById("nomePedidos")
    .innerText =
    arquivo
    ? arquivo.name
    : "Nenhum arquivo selecionado";

});

document
.getElementById("arquivoPosicoes")
.addEventListener("change", function(){

    const arquivo = this.files[0];

    document
    .getElementById("nomePosicoes")
    .innerText =
    arquivo
    ? arquivo.name
    : "Nenhum arquivo selecionado";

});

// =====================================
// LOADING
// =====================================

function mostrarLoading(){

    document
    .getElementById("loading")
    .style.display = "flex";

}

function ocultarLoading(){

    document
    .getElementById("loading")
    .style.display = "none";

}

// =====================================
// PROCESSAMENTO PRINCIPAL
// =====================================

async function processar(){

    try{

        mostrarLoading();

        const arquivoPedidos =
        document
        .getElementById("arquivoPedidos")
        .files[0];

        const arquivoPosicoes =
        document
        .getElementById("arquivoPosicoes")
        .files[0];

        if(
            !arquivoPedidos ||
            !arquivoPosicoes
        ){

            alert(
                "Selecione os dois arquivos."
            );

            ocultarLoading();

            return;

        }

        dadosPedidos =
        await lerExcel(
            arquivoPedidos
        );

        dadosPosicoes =
        await lerTXT(
            arquivoPosicoes
        );

console.log(
    "PRIMEIRA LINHA POSICOES:"
);

console.log(
    dadosPosicoes[0]
);

console.log(
    Object.keys(
        dadosPosicoes[0]
    )
);
        
console.log(
    [...new Set(
        dadosPosicoes.map(
            x=>x.ESPECIE_END
        )
    )]
);

console.log(
    [...new Set(
        dadosPosicoes.map(
            x=>x.TIPEND
        )
    )]
);

console.log(
    [...new Set(
        dadosPosicoes.map(
            x=>x.STATUS_ENDERECO
        )
    )]
);
        
       gerarAbastecimento();

console.log("Processamento finalizado");

ocultarLoading();

    }

    catch(erro){

        console.error(erro);

        ocultarLoading();

        alert(
            "Erro ao processar arquivos."
        );

    }

}

    

// =====================================
// LEITURA EXCEL
// =====================================

function lerExcel(arquivo){

    return new Promise((resolve,reject)=>{

        const leitor =
        new FileReader();

        leitor.onload = e=>{

            const dados =
            new Uint8Array(
                e.target.result
            );

            const workbook =
            XLSX.read(
                dados,
                {type:"array"}
            );

            const aba =
            workbook
            .SheetNames[0];

            const json =
            XLSX.utils.sheet_to_json(
                workbook.Sheets[aba],
                {
                    defval:""
                }
            );

            resolve(json);

        };

        leitor.onerror = reject;

        leitor.readAsArrayBuffer(
            arquivo
        );

    });

}

// =====================================
// LEITURA TXT
// =====================================

function lerTXT(arquivo){

    return new Promise((resolve,reject)=>{

        Papa.parse(
            arquivo,
            {

                header:true,

                delimiter:";",

                skipEmptyLines:true,

                complete:resultado=>{

                    resolve(
                        resultado.data
                    );

                },

                error:erro=>{

                    reject(erro);

                }

            }

        );

    });

}

// =====================================
// CÁLCULO DE NORMA
// =====================================
// Aceita tanto um número simples (ex: "6") quanto o formato
// "caixas por nível x níveis" (ex: "3X2"), multiplicando os
// dois valores quando esse padrão existe no campo NORMA_APANHA.

function calcularNorma(normaRaw){

    const texto =
    String(normaRaw || "0").trim();

    const combinada =
    texto.match(/(\d+)\s*[xX]\s*(\d+)/);

    if(combinada){

        const a = Number(combinada[1]);
        const b = Number(combinada[2]);

        return {
            valor: a * b,
            texto: `${a}x${b} = ${a * b}`
        };

    }

    const numero =
    Number(texto.match(/\d+/)?.[0]) || 0;

    return {
        valor: numero,
        texto: String(numero)
    };

}

// =====================================
// GERAR ABASTECIMENTO
// =====================================

function gerarAbastecimento(){

    console.log("Iniciando geração...");
    
    resultado = [];

    const pedidosAgrupados = {};

    // SOMA PEDIDOS POR SKU
    dadosPedidos.forEach(item=>{

       const sku =
String(
    item.Seqproduto
)
.replace(",00","")
.replace(".00","")
.trim();

        if(!pedidosAgrupados[sku]){

            pedidosAgrupados[sku] = {

                sku,
                descricao: item.Desccompleta,
                pedido: 0

            };

        }

        pedidosAgrupados[sku].pedido +=
        Number(item.Quantidade) || 0;

    });

    // CRUZAMENTO

   // =====================================
// MAPA DE APANHAS
// =====================================

const mapaApanhas = {};

const mapaPulmoes = {};

dadosPosicoes.forEach(p=>{

    const codigo =
    String(
        p.CODIGO || ""
    )
    .replace(",00","")
    .replace(".00","")
    .trim();

    const especie =
    String(
        p.ESPECIE_END || ""
    )
    .toUpperCase()
    .trim();

   if(

    especie.includes("APANHA")

    &&

    !mapaApanhas[codigo]

){

    mapaApanhas[codigo] = p;

}

if(

    especie.includes("PULM")

){

    if(!mapaPulmoes[codigo]){

        mapaPulmoes[codigo] = [];

    }

    mapaPulmoes[codigo].push(p);

}

});

// =====================================
// CRUZAMENTO
// =====================================

Object.values(
    pedidosAgrupados
)
.forEach(item=>{

    const posicao =
    mapaApanhas[
        item.sku
    ];

const pulmoes =
mapaPulmoes[
    item.sku
] || [];
    
        const saldo =
        Number(posicao?.QTD_END || 0);

        // EMBALAGEM = quantidade de unidades por caixa desse SKU
        // na posição de apanha. Usada para converter o pedido
        // (que vem em unidades) para volume em caixas.
        const embalagem =
        Number(posicao?.EMBALAGEM || 0);

        const caixasPedido =
        embalagem > 0
        ? item.pedido / embalagem
        : 0;

        const normaInfo =
        calcularNorma(
            posicao?.NORMA_APANHA
        );

        const norma = normaInfo.valor;

        let falta = 0;

        if(!posicao){

            falta = item.pedido;

        }else{

            falta = Math.max(
                item.pedido - saldo,
                0
            );

        }

        // ABASTECER nunca pode passar da Norma (capacidade
        // física da posição de apanha), mesmo que o pedido
        // seja maior. FALTA continua sendo o total que falta
        // para o pedido completo (pode exigir mais de uma
        // reposição quando maior que a Norma).
        const abastecer =
        !posicao
        ? falta
        : Math.max(
            Math.min(item.pedido, norma) - saldo,
            0
        );

        const endereco =
        posicao
        ?

        `${posicao.CODRUA}.${posicao.NROPREDIO}.${posicao.NROAPARTAMENTO}.${posicao.NROSALA}`

        :

        "Sem Apanha";

        let status = "OK";

        if(!posicao){

            status = "SEM APANHA";

        }
        else if(falta > 0){

            status = "ABASTECER";

        }




// =====================================
// TRATAMENTO DOS PULMÕES
// =====================================

const listaPulmoes = pulmoes.map(p=>{

    const endereco =
    `${p.CODRUA}.${p.NROPREDIO}.${p.NROAPARTAMENTO}.${p.NROSALA}`;

    return{

        rua:Number(p.CODRUA),

        predio:Number(p.NROPREDIO),

        apartamento:Number(p.NROAPARTAMENTO),

        sala:Number(p.NROSALA),

        endereco,

        quantidade:Number(p.QTD_END||0),

        livre:

            String(
                p.STATUS_ENDERECO||""
            )

            .toUpperCase()

            .includes("LIVRE"),

        objeto:p

    };

});

let enderecoPulmao = "Sem Pulmão";

if(listaPulmoes.length){

    enderecoPulmao =

    listaPulmoes

    .slice(0,3)

    .map(p => p.endereco)

    .join(" | ");

    if(listaPulmoes.length > 3){

        enderecoPulmao +=
        ` (+${listaPulmoes.length - 3} mais)`;

    }

}
    
     resultado.push({

    sku:item.sku,

    descricao:item.descricao,

    pedido:item.pedido,

    endereco,

    pulmao:enderecoPulmao,
pulmoes:listaPulmoes,

ruaApanha:Number(
    posicao?.CODRUA || 0
),

enderecoApanha:endereco,

    pavilhao:
    obterPavilhao(posicao?.CODRUA),

    saldo,

    norma,

    embalagem,

    caixasPedido,

    normaTexto: normaInfo.texto,

    falta,

    abastecer,

    status,

    prioridade:
    falta >= norma
    ? "🔴 CRÍTICO"
    : falta > (norma * 0.5)
    ? "🟠 ALTA"
    : falta > 0
    ? "🟡 NORMAL"
    : "🟢 OK"

});
    });

console.log(
    "Pedidos:",
    dadosPedidos.length
);

console.log(
    "Posições:",
    dadosPosicoes.length
);

console.log(
    "Resultado:",
    resultado.length
);
    
    atualizarKPIs();

    popularFiltroPavilhao();

    // Reaplica os filtros que já estiverem ativos na tela
    // (SKU / Status / Pavilhão) em vez de forçar a tabela
    // sem filtro nenhum. Sem isso, toda vez que a sincronização
    // automática detecta uma mudança no arquivo e reprocessa
    // (a cada 5s), o filtro que o usuário tinha digitado era
    // descartado silenciosamente e a tabela voltava a mostrar
    // tudo — dando a impressão de que o filtro "travou".
    aplicarFiltros();

    console.log(resultado);

}

function atualizarKPIs(){

    document
    .getElementById("kpiSkus")
    .innerText =
    resultado.length;

    document
    .getElementById("kpiAbastecer")
    .innerText =
    resultado.filter(
        x=>x.status==="ABASTECER"
    ).length;

    document
    .getElementById("kpiUnidades")
    .innerText =
    Math.round(
        resultado.reduce(
            (s,x)=>s+(x.caixasPedido||0),
            0
        )
    ).toLocaleString("pt-BR");

    document
    .getElementById("kpiSemApanha")
    .innerText =
    resultado.filter(
        x=>x.status==="SEM APANHA"
    ).length;

    // Pedido geral, em UNIDADES, somando TODOS os SKUs do
    // pedido — independe de status/falta/saldo da apanha.
    // É o volume bruto que veio no pedido, ponto.
    document
    .getElementById("kpiPedidoTotal")
    .innerText =
    resultado.reduce(
        (s,x)=>s+(x.pedido||0),
        0
    ).toLocaleString("pt-BR");

}


function renderizarTabela(
    dados = resultado
){

    const tbody =
    document.getElementById(
        "tbodyResultados"
    );

    const selectLinhas =
    document.getElementById(
        "linhasPorPagina"
    );

    const linhasPorPagina =
    selectLinhas
    ? Number(selectLinhas.value)
    : 50;

    const totalPaginas =
    linhasPorPagina > 0
    ? Math.max(
        1,
        Math.ceil(dados.length / linhasPorPagina)
    )
    : 1;

    if(paginaAtual > totalPaginas){
        paginaAtual = totalPaginas;
    }

    if(paginaAtual < 1){
        paginaAtual = 1;
    }

    const dadosPagina =
    linhasPorPagina > 0
    ? dados.slice(
        (paginaAtual - 1) * linhasPorPagina,
        paginaAtual * linhasPorPagina
    )
    : dados;

    let html = "";

    dadosPagina.forEach(item=>{

        html += `
        <tr>

            <td>${item.sku}</td>
            <td>${item.descricao}</td>
            <td>${item.pedido}</td>
           <td>${item.endereco}</td>
           <td>${item.pulmao}</td>
           <td>${item.saldo}</td>
            <td>${item.norma}</td>
            <td>${item.falta}</td>
            <td>${item.status}</td>
            <td>${item.pavilhao}</td>
            <td>${item.prioridade}</td>

        </tr>
        `;

    });

    tbody.innerHTML = html ||
    `<tr><td colspan="11" style="text-align:center;">Nenhum resultado encontrado.</td></tr>`;

    renderizarPaginacao(
        totalPaginas,
        dados.length,
        linhasPorPagina
    );

}

// =====================================
// PAGINAÇÃO
// =====================================

function renderizarPaginacao(
    totalPaginas,
    totalItens,
    linhasPorPagina
){

    const container =
    document.getElementById(
        "paginasContainer"
    );

    const resumo =
    document.getElementById(
        "resumoPaginacao"
    );

    if(!container) return;

    if(totalItens === 0 || linhasPorPagina === 0){

        container.innerHTML = "";

        if(resumo){

            resumo.innerText =
            totalItens === 0
            ? "Nenhum resultado"
            : `Mostrando todos os ${totalItens} resultados`;

        }

        return;

    }

    // Janela de páginas exibidas ao redor da atual,
    // com reticências para não poluir a tela quando
    // há muitas páginas.

    const janela = 2;

    const paginas = [];

    for(let i = 1; i <= totalPaginas; i++){

        const dentroDaJanela =
        i === 1 ||
        i === totalPaginas ||
        (i >= paginaAtual - janela && i <= paginaAtual + janela);

        if(dentroDaJanela){

            paginas.push(i);

        }
        else if(paginas[paginas.length - 1] !== "..."){

            paginas.push("...");

        }

    }

    let html = `
    <button
        class="btn-pagina"
        ${paginaAtual === 1 ? "disabled" : ""}
        onclick="irParaPagina(${paginaAtual - 1})">
        ‹
    </button>
    `;

    paginas.forEach(p=>{

        if(p === "..."){

            html += `<span class="pagina-reticencias">…</span>`;

        }else{

            html += `
            <button
                class="btn-pagina ${p === paginaAtual ? "ativo" : ""}"
                onclick="irParaPagina(${p})">
                ${p}
            </button>
            `;

        }

    });

    html += `
    <button
        class="btn-pagina"
        ${paginaAtual === totalPaginas ? "disabled" : ""}
        onclick="irParaPagina(${paginaAtual + 1})">
        ›
    </button>
    `;

    container.innerHTML = html;

    if(resumo){

        const inicio =
        (paginaAtual - 1) * linhasPorPagina + 1;

        const fim =
        Math.min(paginaAtual * linhasPorPagina, totalItens);

        resumo.innerText =
        `Mostrando ${inicio}–${fim} de ${totalItens}`;

    }

}

function irParaPagina(pagina){

    paginaAtual = pagina;

    renderizarTabela(
        obterResultadoFiltrado()
    );

}


console.log("SCRIPT CARREGADO COM SUCESSO");


// =====================================
// FILTROS
// =====================================

window.addEventListener("load",()=>{

    document
    .getElementById("filtroSKU")
    .addEventListener(
        "input",
        aplicarFiltros
    );

    document
    .getElementById("filtroStatus")
    .addEventListener(
        "change",
        aplicarFiltros
    );

    document
    .getElementById("filtroPavilhao")
    .addEventListener(
        "change",
        aplicarFiltros
    );

    document
    .getElementById("linhasPorPagina")
    .addEventListener(
        "change",
        function(){

            paginaAtual = 1;

            aplicarFiltros();

        }
    );

    document
    .getElementById("filtroMovSKU")
    .addEventListener(
        "input",
        aplicarFiltrosSugestao
    );

    document
    .getElementById("filtroMovRua")
    .addEventListener(
        "input",
        aplicarFiltrosSugestao
    );

    document
    .getElementById("modalSugestao")
    .addEventListener("click", function(e){

        if(e.target === this){

            fecharModalSugestao();

        }

    });

    document.addEventListener("keydown", function(e){

        if(e.key === "Escape"){

            fecharModalSugestao();

        }

    });

});

function obterResultadoFiltrado(){

    const skuFiltro =
    document
    .getElementById("filtroSKU")
    .value
    .toLowerCase()
    .trim();

    const statusFiltro =
    document
    .getElementById("filtroStatus")
    .value;

    const pavilhoesFiltro =
    obterPavilhoesFiltroAtual();

    return resultado.filter(item=>{

        const skuOk =

            item.sku
            .toString()
            .toLowerCase()
            .includes(skuFiltro);

        const statusOk =

            !statusFiltro ||

            item.status ===
            statusFiltro;

        const pavilhaoOk =

            !pavilhoesFiltro.length ||

            pavilhoesFiltro.includes(item.pavilhao);

        return skuOk && statusOk && pavilhaoOk;

    });

}

function aplicarFiltros(){

    paginaAtual = 1;

    renderizarTabela(
        obterResultadoFiltrado()
    );

}

// =====================================
// EXPORTAR EXCEL
// =====================================

function exportarExcel(){

    if(!resultado.length){

        alert(
            "Nenhum dado para exportar. Processe os arquivos primeiro."
        );

        return;

    }

    const dados =
    obterResultadoFiltrado();

    const linhas = dados.map(item=>({

        "SKU": item.sku,

        "Descrição": item.descricao,

        "Pedido": item.pedido,

        "Endereço Apanha": item.endereco,

        "Pulmão": item.pulmao,

        "Saldo Atual": item.saldo,

        "Norma": item.norma,

        "Falta": item.falta,

        "Status": item.status,

        "Pavilhão": item.pavilhao,

        "Prioridade": item.prioridade

    }));

    const planilha =
    XLSX.utils.json_to_sheet(linhas);

    const workbook =
    XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        planilha,
        "Abastecimento"
    );

    const dataHoje =
    new Date()
    .toISOString()
    .slice(0,10);

    XLSX.writeFile(
        workbook,
        `abastecimento_${dataHoje}.xlsx`
    );

}


// =====================================
// IMPRIMIR POR VOLUME (PEDIDO)
// =====================================
// Lista todos os itens a abastecer ordenados pelo
// volume do Pedido, sempre do maior para o menor,
// sem agrupar por rua ou qualquer outro critério.
function imprimirAbastecimentoPorVolume(){

    // Respeita o pavilhão selecionado em Filtros. Se estiver
    // em "Todos Pavilhões", imprime tudo como antes.
    const pavilhoesFiltro =
    obterPavilhoesFiltroAtual();

    const dadosImpressao =

    resultado

    .filter(item => item.status === "ABASTECER")

    .filter(item =>
        !pavilhoesFiltro.length ||
        pavilhoesFiltro.includes(item.pavilhao)
    )

    // Mesma regra da impressão por rua: só entram
    // itens que possuem pulmão cadastrado.
    .filter(item => item.pulmao !== "Sem Pulmão")

    // Sempre pelo Pedido (o número que aparece impresso),
    // do maior para o menor — nunca pelo saldo faltante,
    // que pode divergir do Pedido e confundir o operador.
    .sort((a,b)=> (b.pedido||0) - (a.pedido||0));

    let html = `

<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Gerador de Abastecimento PCP</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm 8mm 14mm 8mm;

}

/* Numeração de páginas — ímpar = frente, par = verso */
@page :right{

    @bottom-center{
        content:"Página " counter(page) " (frente)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

@page :left{

    @bottom-center{
        content:"Página " counter(page) " (verso)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

*{

    box-sizing:border-box;

}

body{

    font-family:Arial,Helvetica,sans-serif;

    color:#222;

    margin:0;

    padding:0;

}

h1{

    margin:0;

    text-align:center;

    color:#1e3a8a;

    font-size:18px;

    margin-bottom:8px;

}

.cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

    margin-bottom:8px;

    font-size:12px;

}

table{

    width:100%;

    border-collapse:collapse;

    table-layout:fixed;

    page-break-before:auto;

}


tr{

    page-break-inside:avoid;

}

th{

    background:#2563eb;

    color:white;

    padding:10px;

    border:1px solid #d9d9d9;

    font-size:12px;

}

td{

    border:1px solid #d9d9d9;

    padding:8px;

    vertical-align:top;

    font-size:11px;

}

.colSku{

    width:26%;

}

.colApanha{

    width:13%;

}

.colPulmao{

    width:24%;

}

.colReposicao{

    width:37%;

}

.critico{

    background:#ffe5e5;

}

.alta{

    background:#fff4cf;

}

.normal{

    background:white;

}

.sku{

    font-size:20px;

    font-weight:bold;

    margin-bottom:6px;

}

.descricao{

    font-size:12px;

    line-height:17px;

}

.apanha{

    font-size:15px;

    font-weight:bold;

}

.pulmao{

    line-height:18px;

}

.reposicao{

    text-align:left;

    font-size:11px;

    line-height:16px;

}

.reposicao .pedido-linha{

    font-weight:bold;

    font-size:14px;

    margin-bottom:8px;

}

.reposicao .campo-manual{

    margin-top:8px;

}

.reposicao .rotulo-manual{

    display:block;

    font-size:10px;

    color:#555;

    margin-bottom:3px;

}

.reposicao .caixa-escrever{

    display:block;

    height:36px;

    border:1.5px solid #888;

    border-radius:4px;

    background:#fff;

}

.titulo-pagina th{

    background:#fff !important;

    color:#1e3a8a;

    border:none;

    padding:2px 0 8px 0;

    font-size:18px;

    font-weight:bold;

    text-align:center;

}

.meta-pagina th{

    background:#fff !important;

    color:#222;

    border:none;

    border-bottom:2px solid #2563eb;

    padding:0 0 8px 0;

    font-size:12px;

    font-weight:normal;

    text-align:left;

}

.meta-pagina .cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

}

@media print{

    body{

        zoom:100%;

    }

    .critico,
    .alta,
    .titulo-pagina th,
    .meta-pagina th{

        -webkit-print-color-adjust:exact;

        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<table>

<thead>

<tr class="titulo-pagina">

<th colspan="4">🚚 GERADOR DE ABASTECIMENTO PCP — POR VOLUME FALTANTE</th>

</tr>

<tr class="meta-pagina">

<th colspan="4">

    <div class="cabecalho">

        <div><b>Data:</b> ${new Date().toLocaleString("pt-BR")}</div>

        <div><b>Pavilhão:</b> ${pavilhoesFiltro.length ? pavilhoesFiltro.join(", ") : "Todos"}</div>

        <div><b>Total:</b> ${dadosImpressao.length} SKUs</div>

    </div>

</th>

</tr>

<tr>

<th class="colSku">

SKU / Descrição

</th>

<th class="colApanha">

Apanha

</th>

<th class="colPulmao">

Pulmões

</th>

<th class="colReposicao">

Reposição

</th>

</tr>

</thead>

<tbody>

`;

dadosImpressao.forEach(item=>{

    let classe = "normal";

    if(item.prioridade === "🔴 CRÍTICO"){

        classe = "critico";

    }
    else if(item.prioridade === "🟠 ALTA"){

        classe = "alta";

    }

    let pulmoes =
    item.pulmao;

    pulmoes =

    pulmoes

    .replace(/\s*\|\s*/g,"<br>• ")

    .replace(/^/,"• ")

    .replace("<br>• (+","<br><b>(+");

    html += `

    <tr class="${classe}">

        <td>

            <div class="sku">

                ${item.sku}

            </div>

            <div class="descricao">

                ${item.descricao}

            </div>

        </td>

        <td class="apanha">

            ${item.endereco}

        </td>

        <td class="pulmao">

            ${pulmoes}

        </td>

        <td class="reposicao">

            <div class="pedido-linha">Pedido: ${item.pedido}</div>

            <div class="campo-manual">
                <span class="rotulo-manual">Volume abastecido</span>
                <span class="caixa-escrever"></span>
            </div>

            <div class="campo-manual">
                <span class="rotulo-manual">Ajuste apanha</span>
                <span class="caixa-escrever"></span>
            </div>

        </td>

    </tr>

    `;

});

html += `

</tbody>

</table>

<script>
window.PagedConfig = {
    after: () => {
        window.focus();
        window.print();
    }
};
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

</body>

</html>

`;
const janela = window.open("", "_blank");

if(!janela){

    alert("O navegador bloqueou a janela de impressão.");

    return;

}

janela.document.open();

janela.document.write(html);

janela.document.close();

}

// =====================================
// IMPRIMIR ITENS SEM PULMÃO
// =====================================
// Lista os itens que precisam de abastecimento (ABASTECER)
// mas não têm NENHUM endereço de pulmão cadastrado no CD —
// ou seja, não há de onde puxar reposição automaticamente.
// Precisam de verificação manual (pode ser falta de cadastro,
// SKU novo, ou estoque realmente zerado em todo o depósito).
function imprimirSemPulmao(){

    // Respeita o pavilhão selecionado em Filtros. Se estiver
    // em "Todos Pavilhões", imprime tudo como antes.
    const pavilhoesFiltro =
    obterPavilhoesFiltroAtual();

    const dadosImpressao =

    resultado

    .filter(item => item.status === "ABASTECER")

    .filter(item => item.pulmao === "Sem Pulmão")

    .filter(item =>
        !pavilhoesFiltro.length ||
        pavilhoesFiltro.includes(item.pavilhao)
    )

    .sort((a,b)=>{

        const ruaA =
        Number(a.endereco.split(".")[0]) || 0;

        const ruaB =
        Number(b.endereco.split(".")[0]) || 0;

        if(ruaA !== ruaB){

            return ruaA - ruaB;

        }

        return (b.pedido||0) - (a.pedido||0);

    });

    if(!dadosImpressao.length){

        alert("Nenhum item sem pulmão para imprimir (com os filtros atuais).");

        return;

    }

    let html = `

<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Gerador de Abastecimento PCP — Sem Pulmão</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm 8mm 14mm 8mm;

}

/* Numeração de páginas — ímpar = frente, par = verso */
@page :right{

    @bottom-center{
        content:"Página " counter(page) " (frente)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

@page :left{

    @bottom-center{
        content:"Página " counter(page) " (verso)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

*{

    box-sizing:border-box;

}

body{

    font-family:Arial,Helvetica,sans-serif;

    color:#222;

    margin:0;

    padding:0;

}

h1{

    margin:0;

    text-align:center;

    color:#b91c1c;

    font-size:18px;

    margin-bottom:8px;

}

.cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

    margin-bottom:8px;

    font-size:12px;

}

table{

    width:100%;

    border-collapse:collapse;

    table-layout:fixed;

    page-break-before:auto;

}


tr{

    page-break-inside:avoid;

}

th{

    background:#b91c1c;

    color:white;

    padding:10px;

    border:1px solid #d9d9d9;

    font-size:12px;

}

td{

    border:1px solid #d9d9d9;

    padding:8px;

    vertical-align:top;

    font-size:11px;

}

.colSku{

    width:30%;

}

.colApanha{

    width:15%;

}

.colAlerta{

    width:31%;

}

.colReposicao{

    width:24%;

}

.rua{

    background:#7f1d1d !important;

    color:#fff !important;

    font-size:18px;

    font-weight:bold;

    padding:12px;

    text-align:left;

}

.sku{

    font-size:20px;

    font-weight:bold;

    margin-bottom:6px;

}

.descricao{

    font-size:12px;

    line-height:17px;

}

.apanha{

    font-size:15px;

    font-weight:bold;

}

.alerta{

    line-height:16px;

    font-size:11px;

    font-weight:bold;

    color:#b91c1c;

}

.reposicao{

    text-align:left;

    font-size:11px;

    line-height:16px;

}

.reposicao .pedido-linha{

    font-weight:bold;

    font-size:14px;

    margin-bottom:8px;

}

.reposicao .campo-manual{

    margin-top:8px;

}

.reposicao .rotulo-manual{

    display:block;

    font-size:10px;

    color:#555;

    margin-bottom:3px;

}

.reposicao .caixa-escrever{

    display:block;

    height:36px;

    border:1.5px solid #888;

    border-radius:4px;

    background:#fff;

}

.titulo-pagina th{

    background:#fff !important;

    color:#b91c1c;

    border:none;

    padding:2px 0 8px 0;

    font-size:18px;

    font-weight:bold;

    text-align:center;

}

.meta-pagina th{

    background:#fff !important;

    color:#222;

    border:none;

    border-bottom:2px solid #b91c1c;

    padding:0 0 8px 0;

    font-size:12px;

    font-weight:normal;

    text-align:left;

}

.meta-pagina .cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

}

@media print{

    body{

        zoom:100%;

    }

    .rua,
    .titulo-pagina th,
    .meta-pagina th{

        -webkit-print-color-adjust:exact;

        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<table>

<thead>

<tr class="titulo-pagina">

<th colspan="4">⚠️ ITENS SEM PULMÃO — VERIFICAÇÃO MANUAL</th>

</tr>

<tr class="meta-pagina">

<th colspan="4">

    <div class="cabecalho">

        <div><b>Data:</b> ${new Date().toLocaleString("pt-BR")}</div>

        <div><b>Pavilhão:</b> ${pavilhoesFiltro.length ? pavilhoesFiltro.join(", ") : "Todos"}</div>

        <div><b>Total:</b> ${dadosImpressao.length} SKUs</div>

    </div>

</th>

</tr>

<tr>

<th class="colSku">

SKU / Descrição

</th>

<th class="colApanha">

Apanha

</th>

<th class="colAlerta">

Situação

</th>

<th class="colReposicao">

Reposição

</th>

</tr>

</thead>

<tbody>

`;

let ruaAtual = "";

dadosImpressao.forEach(item=>{

    const rua =
    item.endereco.split(".")[0];

    if(rua !== ruaAtual){

        ruaAtual = rua;

        html += `

        <tr>

            <td
                colspan="4"
                class="rua">

                📍 RUA ${rua}

            </td>

        </tr>

        `;

    }

    html += `

    <tr>

        <td>

            <div class="sku">

                ${item.sku}

            </div>

            <div class="descricao">

                ${item.descricao}

            </div>

        </td>

        <td class="apanha">

            ${item.endereco}

        </td>

        <td class="alerta">

            ⚠️ Nenhum pulmão cadastrado.<br>
            Verificar estoque manualmente.

        </td>

        <td class="reposicao">

            <div class="pedido-linha">Pedido: ${item.pedido}</div>

            <div class="campo-manual">
                <span class="rotulo-manual">Volume abastecido</span>
                <span class="caixa-escrever"></span>
            </div>

            <div class="campo-manual">
                <span class="rotulo-manual">Origem usada</span>
                <span class="caixa-escrever"></span>
            </div>

        </td>

    </tr>

    `;

});

html += `

</tbody>

</table>

<script>
window.PagedConfig = {
    after: () => {
        window.focus();
        window.print();
    }
};
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

</body>

</html>

`;
const janela = window.open("", "_blank");

if(!janela){

    alert("O navegador bloqueou a janela de impressão.");

    return;

}

janela.document.open();

janela.document.write(html);

janela.document.close();

}

// =====================================
// IMPRIMIR PEDIDO GERAL
// =====================================
// Lista TODOS os SKUs do pedido, de qualquer status
// (OK, ABASTECER, SEM APANHA) — sem descontar o saldo
// da apanha. É a visão bruta do pedido inteiro, igual
// ao KPI "Pedido Total (Unidades)".
function imprimirPedidoGeral(){

    // Respeita o pavilhão selecionado em Filtros. Se estiver
    // em "Todos Pavilhões", imprime tudo como antes.
    const pavilhoesFiltro =
    obterPavilhoesFiltroAtual();

    const dadosImpressao =

    resultado

    .filter(item =>
        !pavilhoesFiltro.length ||
        pavilhoesFiltro.includes(item.pavilhao)
    )

    // Sempre por quantidade pedida, do maior para o menor.
    .sort((a,b)=> (b.pedido||0) - (a.pedido||0));

    if(!dadosImpressao.length){

        alert("Nenhum SKU para imprimir (com os filtros atuais).");

        return;

    }

    const totalPedido =
    dadosImpressao.reduce(
        (s,x)=>s+(x.pedido||0),
        0
    );

    let html = `

<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Gerador de Abastecimento PCP — Pedido Geral</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm 8mm 14mm 8mm;

}

/* Numeração de páginas — ímpar = frente, par = verso */
@page :right{

    @bottom-center{
        content:"Página " counter(page) " (frente)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

@page :left{

    @bottom-center{
        content:"Página " counter(page) " (verso)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

*{

    box-sizing:border-box;

}

body{

    font-family:Arial,Helvetica,sans-serif;

    color:#222;

    margin:0;

    padding:0;

}

h1{

    margin:0;

    text-align:center;

    color:#1e3a8a;

    font-size:18px;

    margin-bottom:8px;

}

.cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

    margin-bottom:8px;

    font-size:12px;

}

table{

    width:100%;

    border-collapse:collapse;

    table-layout:fixed;

    page-break-before:auto;

}


tr{

    page-break-inside:avoid;

}

th{

    background:#2563eb;

    color:white;

    padding:10px;

    border:1px solid #d9d9d9;

    font-size:12px;

}

td{

    border:1px solid #d9d9d9;

    padding:8px;

    vertical-align:top;

    font-size:11px;

}

.colSku{

    width:26%;

}

.colApanha{

    width:13%;

}

.colPulmao{

    width:24%;

}

.colReposicao{

    width:37%;

}

.critico{

    background:#ffe5e5;

}

.alta{

    background:#fff4cf;

}

.normal{

    background:white;

}

.sku{

    font-size:20px;

    font-weight:bold;

    margin-bottom:6px;

}

.descricao{

    font-size:12px;

    line-height:17px;

}

.apanha{

    font-size:15px;

    font-weight:bold;

}

.pulmao{

    line-height:18px;

}

.reposicao{

    text-align:left;

    font-size:11px;

    line-height:16px;

}

.reposicao .pedido-linha{

    font-weight:bold;

    font-size:14px;

    margin-bottom:8px;

}

.reposicao .campo-manual{

    margin-top:8px;

}

.reposicao .rotulo-manual{

    display:block;

    font-size:10px;

    color:#555;

    margin-bottom:3px;

}

.reposicao .caixa-escrever{

    display:block;

    height:36px;

    border:1.5px solid #888;

    border-radius:4px;

    background:#fff;

}

.titulo-pagina th{

    background:#fff !important;

    color:#1e3a8a;

    border:none;

    padding:2px 0 8px 0;

    font-size:18px;

    font-weight:bold;

    text-align:center;

}

.meta-pagina th{

    background:#fff !important;

    color:#222;

    border:none;

    border-bottom:2px solid #2563eb;

    padding:0 0 8px 0;

    font-size:12px;

    font-weight:normal;

    text-align:left;

}

.meta-pagina .cabecalho{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

}

@media print{

    body{

        zoom:100%;

    }

    .critico,
    .alta,
    .titulo-pagina th,
    .meta-pagina th{

        -webkit-print-color-adjust:exact;

        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<table>

<thead>

<tr class="titulo-pagina">

<th colspan="4">📋 GERADOR DE ABASTECIMENTO PCP — PEDIDO GERAL</th>

</tr>

<tr class="meta-pagina">

<th colspan="4">

    <div class="cabecalho">

        <div><b>Data:</b> ${new Date().toLocaleString("pt-BR")}</div>

        <div><b>Pavilhão:</b> ${pavilhoesFiltro.length ? pavilhoesFiltro.join(", ") : "Todos"}</div>

        <div><b>Total:</b> ${dadosImpressao.length} SKUs — ${totalPedido.toLocaleString("pt-BR")} unidades pedidas</div>

    </div>

</th>

</tr>

<tr>

<th class="colSku">

SKU / Descrição

</th>

<th class="colApanha">

Apanha

</th>

<th class="colPulmao">

Pulmões

</th>

<th class="colReposicao">

Reposição

</th>

</tr>

</thead>

<tbody>

`;

dadosImpressao.forEach(item=>{

    let classe = "normal";

    if(item.prioridade === "🔴 CRÍTICO"){

        classe = "critico";

    }
    else if(item.prioridade === "🟠 ALTA"){

        classe = "alta";

    }

    let pulmoes =
    item.pulmao;

    pulmoes =

    pulmoes

    .replace(/\s*\|\s*/g,"<br>• ")

    .replace(/^/,"• ")

    .replace("<br>• (+","<br><b>(+");

    html += `

    <tr class="${classe}">

        <td>

            <div class="sku">

                ${item.sku}

            </div>

            <div class="descricao">

                ${item.descricao}

            </div>

        </td>

        <td class="apanha">

            ${item.endereco}

        </td>

        <td class="pulmao">

            ${pulmoes}

        </td>

        <td class="reposicao">

            <div class="pedido-linha">Pedido: ${item.pedido}</div>

            <div class="campo-manual">
                <span class="rotulo-manual">Volume abastecido</span>
                <span class="caixa-escrever"></span>
            </div>

            <div class="campo-manual">
                <span class="rotulo-manual">Ajuste apanha</span>
                <span class="caixa-escrever"></span>
            </div>

        </td>

    </tr>

    `;

});

html += `

</tbody>

</table>

<script>
window.PagedConfig = {
    after: () => {
        window.focus();
        window.print();
    }
};
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

</body>

</html>

`;
const janela = window.open("", "_blank");

if(!janela){

    alert("O navegador bloqueou a janela de impressão.");

    return;

}

janela.document.open();

janela.document.write(html);

janela.document.close();

}

// =====================================
// MAPA DE PULMÕES LIVRES (PRÉ-CALCULADO)
// =====================================
// Antes: buscarPulmaoLivre() filtrava TODAS as
// dadosPosicoes a cada chamada. Como ela é chamada
// dentro de dois forEach aninhados (resultado x
// pulmoes), isso gerava centenas de milhares/milhões
// de comparações e travava a tela.
// Agora: montamos o mapa rua -> [candidatos livres]
// UMA ÚNICA VEZ, e a busca vira O(1).

function construirMapaPulmoesLivres(dadosPosicoes){

    const mapa = {};

    dadosPosicoes.forEach(p=>{

        const especie =
        String(
            p.ESPECIE_END || ""
        )
        .toUpperCase();

        if(!especie.includes("PULM")){
            return;
        }

        const status =
        String(
            p.STATUS_ENDERECO || ""
        )
        .toUpperCase()
        .trim();

        // Apenas endereços com status "Disponivel" podem
        // ser usados como destino. "Reservado" já está
        // comprometido para outra finalidade e não é
        // uma vaga real, mesmo estando com QTD_END vazio.
        const livre =
            status === "DISPONIVEL";

        if(!livre){
            return;
        }

        const rua = Number(p.CODRUA);

        if(!mapa[rua]){
            mapa[rua] = [];
        }

        mapa[rua].push(p);

    });

    // ordena cada rua por prédio, uma vez só
    Object.values(mapa).forEach(lista=>{

        lista.sort((a,b)=>
            Number(a.NROPREDIO) - Number(b.NROPREDIO)
        );

    });

    return mapa;

}

// =====================================
// BUSCAR MELHOR PULMÃO LIVRE (O(1) via mapa)
// =====================================

function buscarPulmaoLivre(rua, mapaPulmoesLivres){

    const candidatos =
    mapaPulmoesLivres[Number(rua)];

    if(!candidatos || !candidatos.length){

        return null;

    }

    // Remove o candidato da lista (splice) em vez de
    // apenas lê-lo (candidatos[0]). Assim, uma vez que
    // um endereço é dado como destino para uma linha,
    // ele deixa de existir no pool e não pode ser
    // sugerido novamente para outra linha até que a
    // movimentação real seja executada e a base
    // recarregada.
    return candidatos.shift();

}

// =====================================
// SUGESTÃO DE MOVIMENTAÇÃO
// =====================================

let sugestoesMovimentacao = [];

async function gerarSugestoesMovimentacao(){

    if(!resultado.length){

        alert(
            "Processe os arquivos primeiro."
        );

        return;

    }

    mostrarLoading();

    // libera a thread principal por um instante
    // para o navegador conseguir pintar o spinner
    // antes de começar o processamento pesado
    await new Promise(resolve=>setTimeout(resolve,50));

    try{

        sugestoesMovimentacao = [];

        const mapaPulmoesLivres =
        construirMapaPulmoesLivres(
            dadosPosicoes
        );

        // =====================================
        // 1) MONTA CANDIDATOS (sem reservar destino)
        // =====================================
        // Antes, o destino era reservado na mesma hora
        // em que o candidato era encontrado — como o loop
        // segue a ordem do arquivo (rua crescente), os
        // pulmões mais PRÓXIMOS acabavam consumindo os
        // endereços livres antes dos mais DISTANTES,
        // mesmo estes tendo mais economia a ganhar.

        const candidatos = [];

        resultado.forEach(item=>{

            // sem apanha cadastrada, não dá pra
            // comparar rua da apanha x rua do pulmão

            if(item.status === "SEM APANHA"){

                return;

            }

            if(
                !item.pulmoes ||
                !item.pulmoes.length
            ){

                return;

            }

            item.pulmoes.forEach(pulmao=>{

                if(pulmao.quantidade <= 0){

                    return; // pulmão vazio, nada a mover

                }

                // NÍVEL 1: só interessa quando a rua
                // do pulmão é DIFERENTE da rua da apanha

                if(pulmao.rua === item.ruaApanha){

                    return;

                }

                const economia =
                Math.abs(
                    pulmao.rua - item.ruaApanha
                );

                candidatos.push({
                    item,
                    pulmao,
                    economia
                });

            });

        });

        // =====================================
        // 2) PRIORIZA MAIOR ECONOMIA
        // =====================================
        // Reordena os candidatos por economia decrescente
        // ANTES de reservar qualquer endereço. Assim, quando
        // há poucas vagas livres numa rua, elas vão para quem
        // realmente ganha mais com a movimentação (pulmão
        // mais distante primeiro).

        candidatos.sort(
            (a,b)=>b.economia - a.economia
        );

        // =====================================
        // 3) RESERVA OS DESTINOS NESSA ORDEM
        // =====================================

        candidatos.forEach(({item,pulmao,economia})=>{

            const destino =
            buscarPulmaoLivre(
                item.ruaApanha,
                mapaPulmoesLivres
            );

            const enderecoDestino =
            destino
            ? `${destino.CODRUA}.${destino.NROPREDIO}.${destino.NROAPARTAMENTO}.${destino.NROSALA}`
            : null;

            sugestoesMovimentacao.push({

                sku: item.sku,

                descricao: item.descricao,

                ruaApanha: item.ruaApanha,

                ruaPulmao: pulmao.rua,

                enderecoApanha: item.enderecoApanha,

                enderecoPulmaoAtual: pulmao.endereco,

                moverPara: enderecoDestino,

                economia,

                quantidade: pulmao.quantidade

            });

        });

        // ordenação final só para exibição
        // (a alocação já respeitou a prioridade)

        sugestoesMovimentacao.sort(
            (a,b)=>b.economia - a.economia
        );

        abrirModalSugestao();

    }

    catch(erro){

        console.error(erro);

        alert(
            "Erro ao gerar sugestões de movimentação."
        );

    }

    finally{

        ocultarLoading();

    }

}

// =====================================
// MODAL DE SUGESTÃO
// =====================================

function abrirModalSugestao(){

    const modal =
    document.getElementById("modalSugestao");

    if(!modal){

        alert(
            "Modal de sugestão não encontrado no HTML."
        );

        return;

    }

    document.getElementById("filtroMovSKU").value = "";

    document.getElementById("filtroMovRua").value = "";

    atualizarKPIsSugestao();

    renderizarTabelaSugestoes(
        sugestoesMovimentacao
    );

    modal.classList.add("ativo");

}

function fecharModalSugestao(){

    document
    .getElementById("modalSugestao")
    .classList.remove("ativo");

}

function atualizarKPIsSugestao(){

    document.getElementById("movTotal").innerText =
    sugestoesMovimentacao.length;

    document.getElementById("movAlta").innerText =
    sugestoesMovimentacao.filter(
        x=>x.economia >= 20
    ).length;

    document.getElementById("movMedia").innerText =
    sugestoesMovimentacao.filter(
        x=>x.economia >= 10 && x.economia < 20
    ).length;

    document.getElementById("movUnidades").innerText =
    sugestoesMovimentacao.reduce(
        (s,x)=>s+x.economia,
        0
    );

}

function renderizarTabelaSugestoes(dados){

    const tbody =
    document.getElementById("tbodySugestoes");

    if(!dados.length){

        tbody.innerHTML =
        `<tr><td colspan="6" style="text-align:center;padding:30px;color:#6b7280;">
        Nenhuma sugestão encontrada. Todos os pulmões já estão na mesma rua da apanha.
        </td></tr>`;

        return;

    }

    let html = "";

    dados.forEach(item=>{

        const classe =

        item.economia >= 20
        ? "prioridade-alta"
        : item.economia >= 10
        ? "prioridade-media"
        : "prioridade-baixa";

        const moverParaTexto =

        item.moverPara

        ? item.moverPara

        : `<span style="color:#d32f2f;">Sem posição livre na rua ${String(item.ruaApanha).padStart(3,"0")}</span>`;

        html += `
        <tr>
            <td>${item.sku}</td>
            <td style="text-align:left;">${item.descricao}</td>
            <td>${item.enderecoApanha}</td>
            <td>${item.enderecoPulmaoAtual}</td>
            <td>${moverParaTexto}</td>
            <td class="${classe}">${item.economia} ${item.economia===1?"rua":"ruas"}</td>
        </tr>
        `;

    });

    tbody.innerHTML = html;

}

function obterSugestoesFiltradas(){

    const skuFiltro =
    document
    .getElementById("filtroMovSKU")
    .value
    .toLowerCase()
    .trim();

    const ruaFiltro =
    document
    .getElementById("filtroMovRua")
    .value
    .toLowerCase()
    .trim();

    return sugestoesMovimentacao.filter(item=>{

        const skuOk =
        item.sku
        .toString()
        .toLowerCase()
        .includes(skuFiltro);

        const ruaOk =

        !ruaFiltro ||

        String(item.ruaApanha)
        .toLowerCase()
        .includes(ruaFiltro) ||

        String(item.ruaPulmao)
        .toLowerCase()
        .includes(ruaFiltro);

        return skuOk && ruaOk;

    });

}

function aplicarFiltrosSugestao(){

    renderizarTabelaSugestoes(
        obterSugestoesFiltradas()
    );

}

function imprimirSugestoesModal(){

    if(!sugestoesMovimentacao.length){

        alert("Nenhuma sugestão para imprimir.");

        return;

    }

    const janela = window.open("", "_blank");

    if(!janela){

        alert("Permita pop-ups para este site.");

        return;

    }

    // Imprime respeitando o filtro de SKU/Rua que
    // estiver digitado na tela naquele momento. Se os
    // campos estiverem vazios, imprime tudo (comportamento
    // igual a antes).
    imprimirSugestoes(
        janela,
        obterSugestoesFiltradas()
    );

}

// =====================================
// IMPRIMIR SUGESTÕES
// =====================================
function imprimirSugestoes(janela, dadosBase){

    const base =
    dadosBase || sugestoesMovimentacao;

    // Na impressão, mostramos apenas sugestões que
    // realmente têm um pulmão livre para mover. Itens
    // sem posição livre continuam visíveis no modal em
    // tela, só não entram na versão impressa.
    const dados =
    base.filter(
        item => item.moverPara
    );

    if(!dados.length){

        alert("Nenhuma sugestão com posição livre para imprimir.");

        return;

    }

    // Ordena só por economia — quem está mais longe
    // (maior economia ao mover) vem primeiro, sem
    // agrupar/priorizar por rua.
    dados.sort((a,b)=> b.economia - a.economia);


    let html = `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Sugestão de Movimentação</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm 8mm 14mm 8mm;

}

/* Numeração de páginas — ímpar = frente, par = verso */
@page :right{

    @bottom-center{
        content:"Página " counter(page) " (frente)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

@page :left{

    @bottom-center{
        content:"Página " counter(page) " (verso)";
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#666;
    }

}

*{

    box-sizing:border-box;

}

body{

    font-family:Arial,Helvetica,sans-serif;

    margin:0;

    color:#222;

}

h1{

    margin:0;

    text-align:center;

    color:#0F4C81;

    font-size:22px;

}

.info{

    display:flex;

    justify-content:space-between;

    margin:15px 0;

    font-size:13px;

}

table{

    width:100%;

    border-collapse:collapse;

}

th{

    background:#0F4C81;

    color:#fff;

    padding:10px;

    border:1px solid #DDD;

    font-size:12px;

}

td{

    border:1px solid #DDD;

    padding:8px;

    font-size:11px;

}

.rua{

    background:#1E3A8A;

    color:white;

    font-weight:bold;

    font-size:15px;

}

.alta{

    background:#ffdede;

}

.media{

    background:#fff2d6;

}

.baixa{

    background:#ffffdd;

}

@media print{

    .rua,
    th,
    .alta,
    .media,
    .baixa{

        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<h1>

📦 SUGESTÃO DE MOVIMENTAÇÃO

</h1>

<div class="info">

<div>

<b>Data:</b>

${new Date().toLocaleString("pt-BR")}

</div>

<div>

<b>Total:</b>

${dados.length}

</div>

</div>

<table>

<thead>

<tr>

<th>SKU</th>

<th>Produto</th>

<th>Apanha</th>

<th>Pulmão Atual</th>

<th>Mover para</th>

<th>Economia</th>

</tr>

</thead>

<tbody>

`;

    dados.forEach(item=>{

        let classe="";

        if(item.economia>=20){

            classe="alta";

        }
        else if(item.economia>=10){

            classe="media";

        }
        else{

            classe="baixa";

        }

        html += `

<tr class="${classe}">

<td>

<b>${item.sku}</b>

</td>

<td>

${item.descricao}

</td>

<td>

${item.enderecoApanha}

</td>

<td>

${item.enderecoPulmaoAtual}

</td>

<td>

${item.moverPara || "Sem posição livre"}

</td>

<td style="text-align:center;">

<b>${item.economia} ${item.economia===1?"rua":"ruas"}</b>

</td>

</tr>

`;

    });

    html += `

</tbody>

</table>

<script>
window.PagedConfig = {
    after: () => {
        window.focus();
        window.print();
    }
};
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

</body>

</html>

`;



    janela.document.open();

    janela.document.write(html);

    janela.document.close();

}
