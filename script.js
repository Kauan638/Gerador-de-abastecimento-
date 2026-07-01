// =====================================
// VARIÁVEIS GLOBAIS
// =====================================

let dadosPedidos = [];
let dadosPosicoes = [];
let resultado = [];

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

        const norma =
        Number(
            String(
                posicao?.NORMA_APANHA || 0
            )
            .match(/\d+/)?.[0]
        ) || 0;

        let falta = 0;

        if(!posicao){

            falta = item.pedido;

        }else{

            falta = Math.max(
                item.pedido - saldo,
                0
            );

        }

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

    saldo,

    norma,

    falta,

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

    renderizarTabela();

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
    resultado.reduce(
        (s,x)=>s+x.falta,
        0
    );

    document
    .getElementById("kpiSemApanha")
    .innerText =
    resultado.filter(
        x=>x.status==="SEM APANHA"
    ).length;

}


function renderizarTabela(
    dados = resultado
){

    const tbody =
    document.getElementById(
        "tbodyResultados"
    );

    let html = "";

    dados.forEach(item=>{

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
            <td>${item.prioridade}</td>

        </tr>
        `;

    });

    tbody.innerHTML = html;

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

        return skuOk && statusOk;

    });

}

function aplicarFiltros(){

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


function imprimirAbastecimento(){

    const peso = {

        "🔴 CRÍTICO":3,
        "🟠 ALTA":2,
        "🟡 NORMAL":1,
        "🟢 OK":0

    };

    const dadosImpressao =

    resultado

    .filter(item => item.status === "ABASTECER")

    .sort((a,b)=>{

        const ruaA =
        Number(a.endereco.split(".")[0]) || 0;

        const ruaB =
        Number(b.endereco.split(".")[0]) || 0;

        if(ruaA !== ruaB){

            return ruaA - ruaB;

        }

        if(
            peso[b.prioridade] !==
            peso[a.prioridade]
        ){

            return peso[b.prioridade] -
                   peso[a.prioridade];

        }

        return b.falta - a.falta;

    });

    let html = `

<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Gerador de Abastecimento PCP</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm;

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

    width:30%;

}

.colApanha{

    width:15%;

}

.colPulmao{

    width:30%;

}

.colFalta{

    width:10%;

}

.colPrioridade{

    width:15%;

}

.rua{

    background:#1e40af !important;

    color:#fff !important;

    font-size:18px;

    font-weight:bold;

    padding:12px;

    text-align:left;

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

.falta{

    text-align:center;

    font-size:20px;

    font-weight:bold;

    color:#dc2626;

}

.prioridade{

    text-align:center;

    font-size:14px;

    font-weight:bold;

}

@media print{

    body{

        zoom:100%;

    }

    .rua,
    .critico,
    .alta{

        -webkit-print-color-adjust:exact;

        print-color-adjust:exact;

    }

}

</style>

</head>

<body>

<h1>

🚚 GERADOR DE ABASTECIMENTO PCP

</h1>

<div class="cabecalho">

    <div>

        <b>Data:</b>

        ${new Date().toLocaleString("pt-BR")}

    </div>

    <div>

        <b>Total:</b>

        ${dadosImpressao.length} SKUs

    </div>

</div>

<table>

<thead>

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

<th class="colFalta">

Falta

</th>

<th class="colPrioridade">

Prioridade

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
                colspan="5"
                class="rua">

                📍 RUA ${rua}

            </td>

        </tr>

        `;

    }

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

        <td class="falta">

            ${item.falta}

        </td>

        <td class="prioridade">

            ${item.prioridade}

        </td>

    </tr>

    `;

});

html += `

</tbody>

</table>

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

setTimeout(()=>{

    janela.focus();

    janela.print();

},500);

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

                // NÍVEL 2: procura um pulmão livre
                // na MESMA rua da apanha (agora via mapa
                // pré-calculado, sem refiltrar tudo)

                const destino =
                buscarPulmaoLivre(
                    item.ruaApanha,
                    mapaPulmoesLivres
                );

                const enderecoDestino =
                destino
                ? `${destino.CODRUA}.${destino.NROPREDIO}.${destino.NROAPARTAMENTO}.${destino.NROSALA}`
                : null;

                // NÍVEL 3: economia = nº de ruas
                // de distância que deixam de ser
                // percorridas na hora de abastecer

                const economia =
                Math.abs(
                    pulmao.rua - item.ruaApanha
                );

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

        });

        // NÍVEL 3: maiores economias primeiro

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

function aplicarFiltrosSugestao(){

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

    const filtrado =
    sugestoesMovimentacao.filter(item=>{

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

    renderizarTabelaSugestoes(filtrado);

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

    imprimirSugestoes(janela);

}

// =====================================
// IMPRIMIR SUGESTÕES
// =====================================
function imprimirSugestoes(janela){

    const dados = [...sugestoesMovimentacao];

    if(!dados.length){

        alert("Nenhuma sugestão encontrada.");

        return;

    }

    dados.sort((a,b)=>{

        if(a.ruaApanha !== b.ruaApanha){

            return a.ruaApanha - b.ruaApanha;

        }

        return b.economia - a.economia;

    });

    let html = `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Sugestão de Movimentação</title>

<style>

@page{

    size:A4 portrait;

    margin:8mm;

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

    let ruaAtual = "";

    dados.forEach(item=>{

        if(item.ruaApanha != ruaAtual){

            ruaAtual = item.ruaApanha;

            html += `

<tr>

<td colspan="5" class="rua">

📍 RUA ${String(ruaAtual).padStart(3,"0")}

</td>

</tr>

`;

        }

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

</body>

</html>

`;



    janela.document.open();

    janela.document.write(html);

    janela.document.close();

    setTimeout(()=>{

        janela.focus();

        janela.print();

    },500);

}
