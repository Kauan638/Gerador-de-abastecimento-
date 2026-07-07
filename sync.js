// ========================================================
// ========================================================
// SINCRONIZAÇÃO AUTOMÁTICA — File System Access API
//
// Conecta a subpasta "Gerador de Abastecimento" (dentro da
// pasta mestre) uma única vez. A partir daí, detecta sozinho:
//   - o arquivo Metabase Pedidos     (extensão .xlsx / .xls)
//   - o arquivo Posição de Endereços (extensão .txt / .csv)
// e reprocessa automaticamente sempre que qualquer um dos
// dois for salvo/atualizado no disco.
//
// Reaproveita 100% da lógica já existente no projeto:
// lerExcel(arquivo), lerTXT(arquivo), gerarAbastecimento().
// ========================================================
// ========================================================

const SYNC_DB_NAME = "gerador-abastecimento-sync-db";
const SYNC_STORE_NAME = "handles";
const SYNC_HANDLE_KEY = "pastaAbastecimento";
const SYNC_INTERVALO_MS = 5000; // checa a cada 5s

let syncDirHandle = null;
let syncArquivoPedidosHandle = null;
let syncArquivoPosicoesHandle = null;
let syncLastModifiedPedidos = 0;
let syncLastModifiedPosicoes = 0;
let syncIntervalId = null;

// ---------- IndexedDB: persistir o handle da pasta ----------

function syncAbrirDB(){

    return new Promise((resolve, reject)=>{

        const req = indexedDB.open(SYNC_DB_NAME, 1);

        req.onupgradeneeded = ()=>
        req.result.createObjectStore(SYNC_STORE_NAME);

        req.onsuccess = ()=> resolve(req.result);

        req.onerror = ()=> reject(req.error);

    });

}

async function syncSalvarHandle(handle){

    const db = await syncAbrirDB();

    return new Promise((resolve, reject)=>{

        const tx = db.transaction(SYNC_STORE_NAME, "readwrite");

        tx.objectStore(SYNC_STORE_NAME).put(handle, SYNC_HANDLE_KEY);

        tx.oncomplete = resolve;

        tx.onerror = ()=> reject(tx.error);

    });

}

async function syncCarregarHandle(){

    const db = await syncAbrirDB();

    return new Promise((resolve, reject)=>{

        const tx = db.transaction(SYNC_STORE_NAME, "readonly");

        const req = tx.objectStore(SYNC_STORE_NAME).get(SYNC_HANDLE_KEY);

        req.onsuccess = ()=> resolve(req.result || null);

        req.onerror = ()=> reject(req.error);

    });

}

async function syncLimparHandle(){

    const db = await syncAbrirDB();

    const tx = db.transaction(SYNC_STORE_NAME, "readwrite");

    tx.objectStore(SYNC_STORE_NAME).delete(SYNC_HANDLE_KEY);

}

async function syncGarantirPermissao(handle){

    const opcoes = { mode: "read" };

    if((await handle.queryPermission(opcoes)) === "granted") return true;

    if((await handle.requestPermission(opcoes)) === "granted") return true;

    return false;

}

// ---------- UI ----------

function syncSetStatus(tipo, textoExtra){

    const el = document.getElementById("syncStatus");

    if(!el) return;

    const mapa = {

        off: [
            "sync-off",
            '<span class="sync-dot"></span> Sincronização desligada'
        ],

        scan: [
            "sync-scan",
            '<span class="sync-dot"></span> Procurando arquivos na pasta...'
        ],

        on: [
            "sync-on",
            '<span class="sync-dot"></span> Conectado — monitorando' +
            (textoExtra ? ` (${textoExtra})` : "")
        ]

    };

    el.className = mapa[tipo][0];
    el.innerHTML = mapa[tipo][1];

    const btnConectar = document.getElementById("btnConectarPasta");
    const btnDesconectar = document.getElementById("btnDesconectarPasta");

    if(btnConectar) btnConectar.style.display = tipo === "off" ? "inline-block" : "none";
    if(btnDesconectar) btnDesconectar.style.display = tipo === "off" ? "none" : "inline-block";

}

function syncAtualizarUltimaChecagem(){

    const el = document.getElementById("syncUltimaChecagem");

    if(!el) return;

    el.style.display = "inline";

    el.textContent =
    "Última checagem: " +
    new Date().toLocaleTimeString("pt-BR");

}

// ---------- Varredura da subpasta ----------

const SYNC_EXT_PEDIDOS = [".xlsx",".xls"];
const SYNC_EXT_POSICOES = [".txt",".csv"];

function syncTemExtensao(nome, lista){

    const n = nome.toLowerCase();

    return lista.some(ext=> n.endsWith(ext));

}

async function syncVarrerPasta(){

    syncSetStatus("scan");

    syncArquivoPedidosHandle = null;
    syncArquivoPosicoesHandle = null;

    for await (const [nome, handle] of syncDirHandle.entries()){

        if(handle.kind !== "file") continue;

        if(
            !syncArquivoPedidosHandle &&
            syncTemExtensao(nome, SYNC_EXT_PEDIDOS)
        ){

            syncArquivoPedidosHandle = handle;

        }else if(
            !syncArquivoPosicoesHandle &&
            syncTemExtensao(nome, SYNC_EXT_POSICOES)
        ){

            syncArquivoPosicoesHandle = handle;

        }

    }

    const faltando = [];

    if(!syncArquivoPedidosHandle) faltando.push('.xlsx/.xls (Metabase Pedidos)');
    if(!syncArquivoPosicoesHandle) faltando.push('.txt/.csv (Posição de Endereços)');

    if(faltando.length){

        alert(
            "Não encontrei na pasta um arquivo pra cada tipo esperado.\n\n" +
            "Faltando:\n" +
            faltando.map(f=>"• " + f).join("\n")
        );

        return false;

    }

    return true;

}

// ---------- Processamento automático (reaproveita as funções originais) ----------

async function syncProcessarArquivos(){

    mostrarLoading();

    try{

        const arquivoPedidos =
        await syncArquivoPedidosHandle.getFile();

        const arquivoPosicoes =
        await syncArquivoPosicoesHandle.getFile();

        dadosPedidos =
        await lerExcel(arquivoPedidos);

        dadosPosicoes =
        await lerTXT(arquivoPosicoes);

        gerarAbastecimento();

        ocultarLoading();

        // reflete nos campos de nome de arquivo da UI manual também
        document.getElementById("nomePedidos").innerText =
        "🔗 " + arquivoPedidos.name + " (auto)";

        document.getElementById("nomePosicoes").innerText =
        "🔗 " + arquivoPosicoes.name + " (auto)";

        console.log("Sincronização automática concluída");

    }catch(erro){

        console.error(erro);

        ocultarLoading();

    }

}

// ---------- Loop de monitoramento ----------

function syncPararMonitoramento(){

    if(syncIntervalId){

        clearInterval(syncIntervalId);

        syncIntervalId = null;

    }

}

function syncIniciarMonitoramento(){

    syncPararMonitoramento();

    const nomesDetectados = [

        syncArquivoPedidosHandle?.name,
        syncArquivoPosicoesHandle?.name

    ].filter(Boolean).join(" + ");

    syncSetStatus("on", nomesDetectados);

    syncIntervalId = setInterval(
        syncChecarMudancas,
        SYNC_INTERVALO_MS
    );

}

async function syncChecarMudancas(){

    try{

        let mudou = false;

        const filePedidos =
        await syncArquivoPedidosHandle.getFile();

        if(filePedidos.lastModified !== syncLastModifiedPedidos){

            syncLastModifiedPedidos = filePedidos.lastModified;

            mudou = true;

        }

        const filePosicoes =
        await syncArquivoPosicoesHandle.getFile();

        if(filePosicoes.lastModified !== syncLastModifiedPosicoes){

            syncLastModifiedPosicoes = filePosicoes.lastModified;

            mudou = true;

        }

        syncAtualizarUltimaChecagem();

        if(mudou){

            await syncProcessarArquivos();

        }

    }catch(erro){

        console.error(
            "Erro ao checar mudanças na pasta:",
            erro
        );

    }

}

// ---------- Ações de UI (botões) ----------

async function conectarPastaAbastecimento(){

    try{

        syncDirHandle = await window.showDirectoryPicker();

        await syncSalvarHandle(syncDirHandle);

        const encontrou = await syncVarrerPasta();

        if(!encontrou){

            syncSetStatus("off");

            return;

        }

        // primeira carga imediata + marca os lastModified atuais
        await syncProcessarArquivos();

        const filePedidos = await syncArquivoPedidosHandle.getFile();
        syncLastModifiedPedidos = filePedidos.lastModified;

        const filePosicoes = await syncArquivoPosicoesHandle.getFile();
        syncLastModifiedPosicoes = filePosicoes.lastModified;

        syncIniciarMonitoramento();

    }catch(erro){

        if(erro.name !== "AbortError"){

            console.error(erro);

            alert("Erro ao conectar a pasta: " + erro.message);

        }

    }

}

async function desconectarPastaAbastecimento(){

    syncPararMonitoramento();

    syncDirHandle = null;
    syncArquivoPedidosHandle = null;
    syncArquivoPosicoesHandle = null;
    syncLastModifiedPedidos = 0;
    syncLastModifiedPosicoes = 0;

    await syncLimparHandle();

    syncSetStatus("off");

    const elChecagem = document.getElementById("syncUltimaChecagem");

    if(elChecagem) elChecagem.style.display = "none";

}

// ---------- Reconexão automática ao abrir a página ----------

(async function syncTentarReconectar(){

    const handleSalvo = await syncCarregarHandle();

    if(!handleSalvo) return;

    const temPermissao = await syncGarantirPermissao(handleSalvo);

    if(!temPermissao){

        // não força popup de permissão sem interação do usuário;
        // ele clica em "Conectar Pasta" de novo se precisar
        return;

    }

    syncDirHandle = handleSalvo;

    const encontrou = await syncVarrerPasta();

    if(!encontrou) return;

    const filePedidos = await syncArquivoPedidosHandle.getFile();
    syncLastModifiedPedidos = filePedidos.lastModified;

    const filePosicoes = await syncArquivoPosicoesHandle.getFile();
    syncLastModifiedPosicoes = filePosicoes.lastModified;

    await syncProcessarArquivos();

    syncIniciarMonitoramento();

})();
