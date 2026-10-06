// Netlify Function que atende os dois endpoints:
//   POST /api/mensagem   -> registra uma mensagem
//   GET  /api/mensagens  -> lista as mensagens
//
// ATENÇÃO: as mensagens ficam em memória (e em /tmp como reforço).
// Elas podem desaparecer quando a função for reiniciada. É só para aprendizado.

const fs = require("fs");

const ARQUIVO_TEMP = "/tmp/mensagens.json";
const MAX_MENSAGENS = 100;

let mensagens = null;

function carregar() {
  if (mensagens) return mensagens;
  try {
    mensagens = JSON.parse(fs.readFileSync(ARQUIVO_TEMP, "utf8"));
  } catch {
    mensagens = [];
  }
  return mensagens;
}

function salvar() {
  try {
    fs.writeFileSync(ARQUIVO_TEMP, JSON.stringify(mensagens));
  } catch {
    // Se não der para gravar, seguimos só com a memória.
  }
}

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function resposta(statusCode, corpo) {
  return { statusCode, headers: HEADERS, body: JSON.stringify(corpo) };
}

exports.handler = async (event) => {
  const metodo = event.httpMethod;
  const caminho = (event.path || "").replace(/\/+$/, "");

  if (metodo === "OPTIONS") {
    return { statusCode: 204, headers: HEADERS, body: "" };
  }

  const lista = carregar();

  // GET /api/mensagens
  if (caminho.endsWith("/mensagens")) {
    if (metodo !== "GET") {
      return resposta(405, { sucesso: false, mensagem: "Use o método GET" });
    }
    return resposta(200, { sucesso: true, total: lista.length, mensagens: lista });
  }

  // POST /api/mensagem
  if (caminho.endsWith("/mensagem")) {
    if (metodo !== "POST") {
      return resposta(405, { sucesso: false, mensagem: "Use o método POST" });
    }

    let dados;
    try {
      const bruto = event.isBase64Encoded
        ? Buffer.from(event.body || "", "base64").toString("utf8")
        : event.body || "";
      dados = JSON.parse(bruto);
    } catch {
      return resposta(400, { sucesso: false, mensagem: "JSON inválido" });
    }

    const empresa = typeof dados?.empresa === "string" ? dados.empresa.trim() : "";
    const texto = typeof dados?.mensagem === "string" ? dados.mensagem.trim() : "";

    if (!empresa || !texto) {
      return resposta(400, {
        sucesso: false,
        mensagem: 'Os campos "empresa" e "mensagem" são obrigatórios (texto não vazio)',
      });
    }
    if (empresa.length > 100 || texto.length > 500) {
      return resposta(400, {
        sucesso: false,
        mensagem: "Limites: empresa até 100 caracteres, mensagem até 500",
      });
    }

    lista.unshift({
      empresa,
      mensagem: texto,
      dataHora: new Date().toISOString(),
    });
    if (lista.length > MAX_MENSAGENS) lista.length = MAX_MENSAGENS;
    salvar();

    return resposta(201, { sucesso: true, mensagem: "Mensagem recebida com sucesso" });
  }

  return resposta(404, { sucesso: false, mensagem: "Rota não encontrada" });
};
