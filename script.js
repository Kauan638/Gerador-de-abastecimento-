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
            x=>x.ESTATUS_ENDERECO
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

        `${posicao.CODRUA}.
        ${posicao.NROPREDIO}.
        ${posicao.NROAPARTAMENTO}.
        ${posicao.NROSALA}`

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
                p.ESTATUS_ENDERECO||""
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

});

function aplicarFiltros(){

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

    const filtrado =
    resultado.filter(item=>{

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

    renderizarTabela(
        filtrado
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
// BUSCAR MELHOR PULMÃO LIVRE
// =====================================

function buscarPulmaoLivre(rua){

    const candidatos =

    dadosPosicoes.filter(p=>{

        const especie =
        String(
            p.ESPECIE_END || ""
        )
        .toUpperCase();

        if(
            !especie.includes("PULM")
        ){
            return false;
        }

        if(
            Number(p.CODRUA) !== Number(rua)
        ){
            return false;
        }

        const quantidade =
        Number(
            p.QTD_END || 0
        );

        const status =
        String(
            p.ESTATUS_ENDERECO || ""
        )
        .toUpperCase();

        return (

            quantidade===0

            ||

            status.includes("LIV")

            ||

            status.includes("VAZ")

        );

    });

    if(!candidatos.length){

        return null;

    }

    candidatos.sort((a,b)=>{

        const predioA =
        Number(a.NROPREDIO);

        const predioB =
        Number(b.NROPREDIO);

        return predioA-predioB;

    });

    return candidatos[0];

}

// =====================================
// SUGESTÃO DE MOVIMENTAÇÃO
// =====================================

let sugestoesMovimentacao = [];

function gerarSugestoesMovimentacao(){

    sugestoesMovimentacao = [];

    resultado.forEach(item=>{

        if(!item.pulmoes.length){
            return;
        }

        // Se já existe pulmão na mesma rua, ignora
        if(item.pulmoes.some(p => p.rua === item.ruaApanha)){
            return;
        }

        // Pega o pulmão mais distante
        let piorPulmao = item.pulmoes[0];

        item.pulmoes.forEach(p=>{

            if(
                Math.abs(p.rua-item.ruaApanha) >
                Math.abs(piorPulmao.rua-item.ruaApanha)
            ){

                piorPulmao = p;

            }

        });

        const economia = Math.abs(
            piorPulmao.rua -
            item.ruaApanha
        );

        const destinoLivre = buscarPulmaoLivre(item.ruaApanha);

        sugestoesMovimentacao.push({

            sku:item.sku,

            descricao:item.descricao,

            ruaApanha:item.ruaApanha,

            enderecoAtual:piorPulmao.endereco,

            moverPara: destinoLivre
                ? `${destinoLivre.CODRUA}.${destinoLivre.NROPREDIO}.${destinoLivre.NROAPARTAMENTO}.${destinoLivre.NROSALA}`
                : "Não encontrado",

            economia

        });

    });

    sugestoesMovimentacao.sort((a,b)=>b.economia-a.economia);

    if(!sugestoesMovimentacao.length){

        alert("Nenhuma sugestão encontrada.");

        return;

    }

    imprimirSugestoes();

}

// =====================================
// IMPRIMIR SUGESTÕES
// =====================================
function imprimirSugestoes(){

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

<th>Atual</th>

<th>Novo</th>

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

${item.enderecoAtual}

</td>

<td>

${item.moverPara}

</td>

<td style="text-align:center;">

<b>${item.economia}</b>

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

console.log("Janela:", janela);

if(!janela){

    alert("Popup bloqueado.");

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

