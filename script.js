const lista = document.getElementById("lista");
const status = document.getElementById("status");
const contador = document.getElementById("contador");
const botao = document.getElementById("btn-atualizar");

function formatarData(iso) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
}

function renderizar(mensagens) {
  lista.innerHTML = "";
  contador.textContent = mensagens.length;

  if (mensagens.length === 0) {
    status.textContent = "Nenhuma mensagem recebida ainda. Envie uma com POST /api/mensagem.";
    return;
  }
  status.textContent = "";

  for (const m of mensagens) {
    const item = document.createElement("li");
    item.className = "mensagem";

    const empresa = document.createElement("div");
    empresa.className = "empresa";
    empresa.textContent = m.empresa; // textContent evita injeção de HTML

    const texto = document.createElement("div");
    texto.className = "texto";
    texto.textContent = m.mensagem;

    const data = document.createElement("div");
    data.className = "data";
    data.textContent = formatarData(m.dataHora);

    item.append(empresa, texto, data);
    lista.appendChild(item);
  }
}

async function carregar() {
  botao.disabled = true;
  try {
    const resposta = await fetch("/api/mensagens");
    if (!resposta.ok) throw new Error("HTTP " + resposta.status);
    const dados = await resposta.json();
    renderizar(dados.mensagens || []);
  } catch (erro) {
    status.textContent = "Não foi possível carregar as mensagens (" + erro.message + ").";
  } finally {
    botao.disabled = false;
  }
}

botao.addEventListener("click", carregar);
carregar();
setInterval(carregar, 10000); // atualiza sozinho a cada 10 segundos
