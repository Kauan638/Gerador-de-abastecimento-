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

        especie === "APANHA"

        &&

        !mapaApanhas[codigo]

    ){

        mapaApanhas[codigo] = p;

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

        resultado.push({

            sku: item.sku,

            descricao: item.descricao,

            pedido: item.pedido,

            endereco,

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


function renderizarTabela(){

    const tbody =
    document.getElementById(
        "tbodyResultados"
    );

    let html = "";

    resultado.forEach(item=>{

        html += `
        <tr>

            <td>${item.sku}</td>
            <td>${item.descricao}</td>
            <td>${item.pedido}</td>
            <td>${item.endereco}</td>
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
