// Meu Bolso — assistente.
// Recebe uma frase ou a foto de um cupom, pede ao Gemini para entender
// e grava ou consulta a tabela gastos com o login da própria pessoa.
// A chave do Gemini vem só do servidor (CHAVE_GEMINI). Nenhuma chave secreta aqui.

// Copiados de app/configuracao.js (endereço e chave PÚBLICA).
const SUPABASE_URL = "https://rpttkdhqtcefkizpdnla.supabase.co";
const SUPABASE_CHAVE_PUBLICA = "sb_publishable_HoPFtJbpyFAPKZD46IZN0w_oJmU18xK";

const MODELO = "gemini-3.5-flash-lite";
const CATEGORIAS_PADRAO = [
  "Mercado", "Restaurante", "Divertimento", "Transporte", "Contas da casa", "Saúde", "Outros"
];

export const config = { path: "/api/assistente" };

// ---------- Respostas ----------

function responder(status, corpo) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

class ErroFrase extends Error {
  constructor(status, frase) {
    super(frase);
    this.status = status;
  }
}

const LOGIN_VENCIDO = "Seu login venceu. Toque em Sair e entre de novo.";
const TABELA_INEXISTENTE = "A tabela gastos não existe no Supabase. Crie a tabela e tente de novo.";

// ---------- Datas e valores ----------

function hojeSaoPaulo() {
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function dataValida(texto) {
  return typeof texto === "string" && /^\d{4}-\d{2}-\d{2}$/.test(texto) && !isNaN(Date.parse(texto));
}

function dataBr(iso) {
  const [a, m, d] = iso.split("-");
  return d + "/" + m + "/" + a;
}

const dinheiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ---------- Supabase com o login da pessoa ----------

function cabecalhosSupabase(token) {
  return {
    apikey: SUPABASE_CHAVE_PUBLICA,
    Authorization: "Bearer " + token,
    "Content-Type": "application/json"
  };
}

async function conferirLogin(token) {
  const r = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: cabecalhosSupabase(token) });
  if (r.status === 401 || r.status === 403) throw new ErroFrase(401, LOGIN_VENCIDO);
  if (!r.ok) throw new ErroFrase(502, "Não consegui falar com o Supabase. Tente de novo em instantes.");
  const usuario = await r.json();
  if (!usuario || !usuario.id) throw new ErroFrase(401, LOGIN_VENCIDO);
  return usuario;
}

async function erroDoBanco(r) {
  let corpo = {};
  try { corpo = await r.json(); } catch {}
  const texto = String(corpo.message || "") + " " + String(corpo.code || "");
  if (r.status === 401 || /JWT/i.test(texto)) return new ErroFrase(401, LOGIN_VENCIDO);
  if (r.status === 404 || /PGRST205|42P01|does not exist|Could not find the table/i.test(texto))
    return new ErroFrase(500, TABELA_INEXISTENTE);
  if (/row-level security|permission denied/i.test(texto))
    return new ErroFrase(403, "O banco não deixou fazer isso. Toque em Sair e entre de novo.");
  return new ErroFrase(502, "O banco não aceitou o pedido. Tente de novo em instantes.");
}

async function gravarGasto(token, gasto) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/gastos", {
    method: "POST",
    headers: { ...cabecalhosSupabase(token), Prefer: "return=minimal" },
    body: JSON.stringify(gasto)
  });
  if (!r.ok) throw await erroDoBanco(r);
}

async function somarGastos(token, desde, ate, categoria) {
  const params = new URLSearchParams();
  params.append("select", "valor");
  params.append("data", "gte." + desde);
  params.append("data", "lte." + ate);
  if (categoria) params.append("categoria", "eq." + categoria);

  const r = await fetch(SUPABASE_URL + "/rest/v1/gastos?" + params.toString(), {
    headers: cabecalhosSupabase(token)
  });
  if (!r.ok) throw await erroDoBanco(r);
  const linhas = await r.json();
  // Soma em centavos para não errar nas casas decimais.
  const centavos = linhas.reduce((s, l) => s + Math.round(Number(l.valor) * 100 || 0), 0);
  return { total: centavos / 100, quantidade: linhas.length };
}

// ---------- Gemini ----------

function ferramentas(categorias) {
  return [{
    function_declarations: [
      {
        name: "registrar_gasto",
        description: "Lança um gasto da pessoa.",
        parameters: {
          type: "object",
          properties: {
            data: { type: "string", description: "Data do gasto no formato AAAA-MM-DD." },
            descricao: { type: "string", description: "Onde ou com o quê, curto. Para cupom, o nome da loja." },
            valor: { type: "number", description: "Valor em reais, positivo. Para cupom, o VALOR TOTAL." },
            categoria: { type: "string", enum: categorias, description: "Uma das categorias da pessoa." }
          },
          required: ["data", "descricao", "valor", "categoria"]
        }
      },
      {
        name: "consultar_gastos",
        description: "Consulta quanto a pessoa gastou num período, opcionalmente numa categoria.",
        parameters: {
          type: "object",
          properties: {
            desde: { type: "string", description: "Primeiro dia do período, AAAA-MM-DD." },
            ate: { type: "string", description: "Último dia do período, AAAA-MM-DD (incluído)." },
            categoria: { type: "string", enum: categorias, description: "Categoria, se a pergunta citar uma." }
          },
          required: ["desde", "ate"]
        }
      }
    ]
  }];
}

function instrucoes(hoje, categorias) {
  return [
    "Você é o assistente do Meu Bolso, um app de gastos pessoais. Responda sempre em português do Brasil, em uma ou duas frases curtas.",
    "Hoje é " + hoje + " (horário de São Paulo). Use esta data para entender 'hoje', 'ontem', 'este mês' e parecidos.",
    "As categorias da pessoa são: " + categorias.join(", ") + ". Escolha sempre uma delas; na dúvida, use Outros.",
    "Se a pessoa contar um gasto, chame registrar_gasto. Se a pessoa perguntar quanto gastou, chame consultar_gastos e nunca calcule totais você mesmo.",
    "Quando vier a foto de um cupom fiscal, use o VALOR TOTAL do cupom, a data de emissão do cupom e o nome da loja como descrição.",
    "Se faltar o valor ou não der para ler o cupom, não chame nenhuma ferramenta: peça o que falta em uma frase."
  ].join("\n");
}

async function perguntarGemini(chave, { mensagem, imagem, mime, categorias, hoje }) {
  const partes = [{ text: mensagem || "Lance o gasto deste cupom fiscal." }];
  if (imagem) partes.push({ inline_data: { mime_type: mime || "image/jpeg", data: imagem } });

  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/" + MODELO + ":generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: instrucoes(hoje, categorias) }] },
        contents: [{ role: "user", parts: partes }],
        tools: ferramentas(categorias),
        tool_config: { function_calling_config: { mode: "AUTO" } }
      })
    }
  );

  if (r.status === 429)
    throw new ErroFrase(429, "O assistente atingiu o limite de uso por agora. Espere um minuto e tente de novo, ou lance à mão.");
  if (r.status === 400 || r.status === 401 || r.status === 403) {
    let corpo = {};
    try { corpo = await r.json(); } catch {}
    const texto = JSON.stringify(corpo);
    if (/API key|API_KEY|PERMISSION_DENIED|UNAUTHENTICATED/i.test(texto))
      throw new ErroFrase(500, "A chave do Gemini não foi aceita. Confira a variável CHAVE_GEMINI na Netlify.");
    throw new ErroFrase(400, "O assistente não entendeu o pedido. Tente escrever de outro jeito ou mande outra foto.");
  }
  if (!r.ok) throw new ErroFrase(502, "O assistente está fora do ar agora. Tente de novo em instantes ou lance à mão.");

  const dados = await r.json();
  const partesResposta = (dados.candidates && dados.candidates[0] && dados.candidates[0].content &&
    dados.candidates[0].content.parts) || [];
  const chamada = partesResposta.find((p) => p.functionCall || p.function_call);
  const texto = partesResposta.map((p) => p.text || "").join(" ").trim();
  return { chamada: chamada ? (chamada.functionCall || chamada.function_call) : null, texto };
}

// ---------- A função ----------

export default async (req) => {
  if (req.method !== "POST") return responder(405, { erro: "Use o app para falar com o assistente." });

  try {
    const chave = process.env.CHAVE_GEMINI;
    if (!chave)
      throw new ErroFrase(500, "O assistente ainda não tem a chave do Gemini. Cadastre a variável CHAVE_GEMINI na Netlify e publique de novo.");

    const auth = req.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token) throw new ErroFrase(401, LOGIN_VENCIDO);
    const usuario = await conferirLogin(token);

    let corpo;
    try { corpo = await req.json(); } catch { corpo = null; }
    if (!corpo) throw new ErroFrase(400, "Não recebi o pedido. Escreva o gasto ou mande a foto de novo.");

    const mensagem = typeof corpo.mensagem === "string" ? corpo.mensagem.trim().slice(0, 500) : "";
    const imagem = typeof corpo.imagem === "string" && corpo.imagem ? corpo.imagem : null;
    const mime = typeof corpo.mime === "string" && /^image\//.test(corpo.mime) ? corpo.mime : "image/jpeg";
    if (!mensagem && !imagem) throw new ErroFrase(400, "Escreva o gasto numa frase ou mande a foto do cupom.");

    let categorias = Array.isArray(corpo.categorias)
      ? corpo.categorias.filter((c) => typeof c === "string" && c.trim()).map((c) => c.trim().slice(0, 40)).slice(0, 30)
      : [];
    if (!categorias.length) categorias = CATEGORIAS_PADRAO;
    const reserva = categorias.includes("Outros") ? "Outros" : categorias[categorias.length - 1];

    const hoje = hojeSaoPaulo();
    const { chamada, texto } = await perguntarGemini(chave, { mensagem, imagem, mime, categorias, hoje });

    if (chamada && chamada.name === "registrar_gasto") {
      const a = chamada.args || {};
      const valor = Math.round(Number(a.valor) * 100) / 100;
      if (!(valor > 0))
        return responder(200, { resposta: "Não consegui achar o valor. Qual foi o valor do gasto?", lancado: false });
      const categoria = categorias.includes(a.categoria) ? a.categoria : reserva;
      const data = dataValida(a.data) ? a.data : hoje;
      const descricao = (typeof a.descricao === "string" && a.descricao.trim().slice(0, 80)) || categoria;

      await gravarGasto(token, {
        dono: usuario.id,
        data,
        descricao,
        valor,
        categoria,
        origem: imagem ? "foto" : "texto"
      });

      return responder(200, {
        resposta: "Lancei " + dinheiro.format(valor) + " em " + categoria + ": " + descricao + ", " + dataBr(data) + ".",
        lancado: true
      });
    }

    if (chamada && chamada.name === "consultar_gastos") {
      const a = chamada.args || {};
      const desde = dataValida(a.desde) ? a.desde : hoje.slice(0, 8) + "01";
      const ate = dataValida(a.ate) ? a.ate : hoje;
      const categoria = categorias.includes(a.categoria) ? a.categoria : null;

      const { total, quantidade } = await somarGastos(token, desde, ate, categoria);
      const onde = categoria ? " com " + categoria : "";
      const periodo = desde === ate ? " em " + dataBr(desde) : " de " + dataBr(desde) + " a " + dataBr(ate);
      const resposta = quantidade
        ? "Você gastou " + dinheiro.format(total) + onde + periodo + " (" + quantidade + (quantidade === 1 ? " gasto)." : " gastos).")
        : "Não achei gastos" + onde + periodo + ".";
      return responder(200, { resposta, lancado: false });
    }

    return responder(200, {
      resposta: texto || "Não entendi. Escreva algo como \"mercado 50 hoje\".",
      lancado: false
    });
  } catch (e) {
    if (e instanceof ErroFrase) return responder(e.status, { erro: e.message });
    return responder(500, { erro: "Algo deu errado no assistente. Tente de novo em instantes ou lance à mão." });
  }
};
