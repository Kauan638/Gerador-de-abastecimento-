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

        // =========================
        // LEITURA METABASE
        // =========================

        dadosPedidos =
        await lerExcel(
            arquivoPedidos
        );

        console.log(
            "PEDIDOS:"
        );

        console.log(
            dadosPedidos[0]
        );

        // =========================
        // LEITURA POSIÇÕES
        // =========================

        dadosPosicoes =
        await lerTXT(
            arquivoPosicoes
        );

        console.log(
            "POSIÇÕES:"
        );

        console.log(
            dadosPosicoes[0]
        );

        ocultarLoading();

        alert(
            "Arquivos carregados com sucesso!"
        );

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
        ).trim();

        if(!pedidosAgrupados[sku]){

            pedidosAgrupados[sku] = {

                sku,

                descricao:
                item.Desccompleta,

                pedido:0

            };

        }

        pedidosAgrupados[sku].pedido +=
        Number(
            item.Quantidade
        ) || 0;

    });

    // CRUZAMENTO

    Object.values(
        pedidosAgrupados
    ).forEach(item=>{

        const posicao =
        dadosPosicoes.find(p=>

            String(
                p.CODIGO
            ).trim() === item.sku

        );

        const saldo =
        Number(
            posicao?.QTD_END
        ) || 0;

        const norma =
        Number(
            posicao?.NORMA_APANHA
        ) || 0;

        const falta =
        Math.max(
            item.pedido - saldo,
            0
        );

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

            status =
            "SEM APANHA";

        }

        else if(falta > 0){

            status =
            "ABASTECER";

        }

        resultado.push({

            sku:item.sku,

            descricao:
            item.descricao,

            pedido:
            item.pedido,

            endereco,

            saldo,

            norma,

            falta,

            status

        });

    });

    atualizarKPIs();

    renderizarTabela();

}
