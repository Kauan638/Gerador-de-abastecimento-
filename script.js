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


const pulmoesExibidos =
pulmoes.slice(0,3);

let enderecoPulmao =
"Sem Pulmão";

if(pulmoes.length > 0){

    enderecoPulmao =

    pulmoesExibidos

    .map(p => {

        return `${p.CODRUA}.${p.NROPREDIO}.${p.NROAPARTAMENTO}.${p.NROSALA}`;

    })

    .join(" | ");

    if(pulmoes.length > 3){

        enderecoPulmao +=
        ` (+${pulmoes.length - 3} mais)`;

    }

}

    
        resultado.push({

            sku: item.sku,

            descricao: item.descricao,

            pedido: item.pedido,

            endereco,

            pulmao: enderecoPulmao,
            
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

.filter(x => x.status === "ABASTECER")

.sort((a,b)=>{

    if(peso[b.prioridade] !== peso[a.prioridade]){

        return peso[b.prioridade] - peso[a.prioridade];

    }

    return b.falta - a.falta;

});

    let html = `
    <html>
    <head>

    <title>Abastecimento PCP</title>

    <style>

    @page{
        size:A4 portrait;
        margin:10mm;
    }

    body{
        font-family:Arial,sans-serif;
        padding:15px;
    }

    h2{
        text-align:center;
        margin-bottom:20px;
    }

   table{

    width:100%;

    border-collapse:collapse;

    table-layout:fixed;

}

th{

    background:#2563eb;

    color:white;

    font-size:13px;

    padding:10px;

}

td{

    border:1px solid #ddd;

    padding:8px;

    font-size:12px;

    vertical-align:top;

}

tr{

    page-break-inside:avoid;

}

    </style>

    </head>

    <body>

    <h2>🚚 GERADOR DE ABASTECIMENTO PCP</h2>

<p>

<b>Data:</b>
${new Date().toLocaleString("pt-BR")}

<br>

<b>Total para abastecer:</b>
${dadosImpressao.length} SKUs

</p>

    <table class="tabela-impressao">

   <thead>

<tr>

    <th style="width:34%;">SKU / Descrição</th>

    <th style="width:18%;">Apanha</th>

    <th style="width:28%;">Pulmões</th>

    <th style="width:10%;">Falta</th>

    <th style="width:10%;">Prioridade</th>

</tr>

</thead>
    `;

    dadosImpressao.forEach(item=>{

    let classe = "normal";

    if(item.prioridade === "🔴 CRÍTICO"){
        classe = "critico";
    }
    else if(item.prioridade === "🟠 ALTA"){
        classe = "alta";
    }

    const pulmoes = item.pulmao
        .replaceAll(" | ", "<br>")
        .replace(/\(\+/g,"<br>(+");

    html += `

    <tr class="${classe}">

        <td>

            <b>${item.sku}</b>

            <br><br>

            ${item.descricao}

        </td>

        <td>

            ${item.endereco}

        </td>

        <td>

            ${pulmoes}

        </td>

        <td style="text-align:center;font-size:18px;">

            <b>${item.falta}</b>

        </td>

        <td style="text-align:center;font-size:16px;">

            ${item.prioridade}

        </td>

    </tr>

    `;

});

    html += `
    </table>

    </body>
    </html>
    `;

    const janela = window.open("","_blank");

    janela.document.write(html);

    janela.document.close();

    janela.print();

}
