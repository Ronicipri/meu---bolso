// Meu Bolso — lógica do app.
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const cfg = window.MEU_BOLSO;

  if (!cfg || !window.supabase) {
    document.body.textContent =
      "Não foi possível carregar o app. Confira a internet e recarregue a página.";
    return;
  }

  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_CHAVE_PUBLICA);
  const dinheiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const CHAVE_LIMITE = "meu-bolso-limite";

  let usuario = null;
  let gastos = [];

  // ---------- Erros viram frases em português ----------

  function frase(erro) {
    const msg = String((erro && (erro.message || erro.error_description)) || erro || "");
    if (/Invalid login credentials/i.test(msg))
      return "E-mail ou senha não conferem. Confira e tente de novo, ou toque em Criar conta.";
    if (/already registered|already exists/i.test(msg))
      return "Este e-mail já tem conta. Toque em Entrar.";
    if (/Password should be|at least 6/i.test(msg))
      return "A senha precisa ter pelo menos 6 caracteres.";
    if (/Email not confirmed/i.test(msg))
      return "Este e-mail ainda não foi confirmado. Desligue \"Confirm email\" no painel do Supabase e crie a conta de novo.";
    if (/invalid.*email|Unable to validate email/i.test(msg))
      return "Digite um e-mail válido, como nome@exemplo.com.";
    if (/rate limit|too many/i.test(msg))
      return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
    if (/Failed to fetch|NetworkError|network/i.test(msg))
      return "Sem conexão com a internet. Confira a rede e tente de novo.";
    if (/JWT|session|not authenticated/i.test(msg))
      return "Sua entrada expirou. Toque em Sair e entre de novo.";
    if (/row-level security|permission denied/i.test(msg))
      return "O banco não deixou fazer isso. Toque em Sair e entre de novo.";
    return "Algo deu errado. Tente de novo em instantes.";
  }

  function avisar(id, texto) {
    $(id).textContent = texto || "";
  }

  // ---------- Datas e valores ----------

  function isoLocal(d) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + dia;
  }

  function faixaDoMes() {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    return {
      inicio: isoLocal(inicio),
      fim: isoLocal(fim),
      nome: hoje.toLocaleDateString("pt-BR", { month: "long" })
    };
  }

  // Aceita "12,50", "1.234,56" e "12.50".
  function lerValor(texto) {
    let t = String(texto || "").trim().replace(/[R$\s]/g, "");
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    const n = Number(t);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  }

  function diaMes(iso) {
    const [, m, d] = String(iso).split("-");
    return d + "/" + m;
  }

  // ---------- Limite do mês (guardado neste aparelho) ----------

  function lerLimite() {
    try {
      const v = Number(localStorage.getItem(CHAVE_LIMITE));
      return v > 0 ? v : null;
    } catch (e) {
      return null;
    }
  }

  function guardarLimite(v) {
    try {
      localStorage.setItem(CHAVE_LIMITE, String(v));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------- Telas ----------

  function mostrarEntrada() {
    usuario = null;
    gastos = [];
    $("tela-principal").hidden = true;
    $("tela-entrada").hidden = false;
  }

  function mostrarPrincipal() {
    $("tela-entrada").hidden = true;
    $("tela-principal").hidden = false;
    $("data").value = isoLocal(new Date());
    carregarGastos();
    carregarResumo();
  }

  // ---------- Entrada ----------

  function lerEntrada() {
    const email = $("email").value.trim();
    const senha = $("senha").value;
    if (!email || !senha) {
      avisar("entrada-msg", "Preencha o e-mail e a senha.");
      return null;
    }
    return { email: email, password: senha };
  }

  function travarEntrada(travar) {
    document.querySelectorAll("#form-entrada button").forEach((b) => (b.disabled = travar));
  }

  $("form-entrada").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const dados = lerEntrada();
    if (!dados) return;
    travarEntrada(true);
    avisar("entrada-msg", "Entrando…");
    const { error } = await sb.auth.signInWithPassword(dados);
    travarEntrada(false);
    avisar("entrada-msg", error ? frase(error) : "");
  });

  $("botao-criar").addEventListener("click", async () => {
    const dados = lerEntrada();
    if (!dados) return;
    travarEntrada(true);
    avisar("entrada-msg", "Criando a conta…");
    const { data, error } = await sb.auth.signUp(dados);
    travarEntrada(false);
    if (error) return avisar("entrada-msg", frase(error));
    if (!data.session) {
      return avisar("entrada-msg",
        "Conta criada, mas o Supabase pediu confirmação de e-mail. Desligue \"Confirm email\" no painel do Supabase e toque em Entrar.");
    }
    avisar("entrada-msg", "");
  });

  $("botao-sair").addEventListener("click", async () => {
    await sb.auth.signOut();
  });

  // ---------- Gastos ----------

  async function carregarGastos() {
    const mes = faixaDoMes();
    $("nome-mes").textContent = mes.nome;
    const { data, error } = await sb
      .from("gastos")
      .select("id, data, descricao, valor, categoria, origem, criado_em")
      .gte("data", mes.inicio)
      .lt("data", mes.fim)
      .order("data", { ascending: false })
      .order("criado_em", { ascending: false });
    if (error) {
      // O erro aparece na própria lista, e a frase de lista vazia some.
      avisar("lista-msg", "Não consegui carregar os gastos. " + frase(error));
      $("lista-msg").hidden = false;
      $("lista-vazia").hidden = true;
      return;
    }
    avisar("lista-msg", "");
    $("lista-msg").hidden = true;
    gastos = (data || []).map((g) => ({ ...g, valor: Number(g.valor) || 0 }));
    desenhar();
  }

  function desenhar() {
    const total = gastos.reduce((s, g) => s + g.valor, 0);
    $("total-mes").textContent = dinheiro.format(total);
    desenharDestaque(total);
    desenharBarras();
    desenharLista();
  }

  function desenharDestaque(total) {
    const limite = lerLimite();
    const restante = $("restante");
    restante.classList.remove("passou");
    $("botao-limite").textContent = limite ? "Mudar limite" : "Definir limite";
    $("limite-atual").textContent = limite ? dinheiro.format(limite) : "não definido";

    if (!limite) {
      restante.textContent = "—";
      $("frase-limite").textContent = "Defina um limite do mês para ver quanto ainda pode gastar.";
      return;
    }
    const sobra = limite - total;
    if (sobra >= 0) {
      restante.textContent = dinheiro.format(sobra);
      $("frase-limite").textContent = "";
    } else {
      restante.textContent = dinheiro.format(0);
      restante.classList.add("passou");
      $("frase-limite").textContent =
        "O limite deste mês já foi usado (" + dinheiro.format(-sobra) +
        " a mais). Tudo bem: no dia 1 o mês recomeça.";
    }
  }

  function desenharBarras() {
    const porCategoria = {};
    cfg.CATEGORIAS.forEach((c) => (porCategoria[c] = 0));
    gastos.forEach((g) => {
      const c = porCategoria[g.categoria] !== undefined ? g.categoria : "Outros";
      porCategoria[c] += g.valor;
    });
    const maior = Math.max(...Object.values(porCategoria), 0);

    const ul = $("barras");
    ul.replaceChildren();
    cfg.CATEGORIAS.forEach((c) => {
      const li = document.createElement("li");
      const topo = document.createElement("div");
      topo.className = "barra-topo";
      const nome = document.createElement("span");
      nome.textContent = c;
      const valor = document.createElement("span");
      valor.textContent = dinheiro.format(porCategoria[c]);
      topo.append(nome, valor);

      const fundo = document.createElement("div");
      fundo.className = "barra-fundo";
      const cheia = document.createElement("div");
      cheia.className = "barra-cheia";
      cheia.style.width = (maior > 0 ? (porCategoria[c] / maior) * 100 : 0) + "%";
      fundo.append(cheia);

      li.append(topo, fundo);
      ul.append(li);
    });
  }

  function desenharLista() {
    const ul = $("lista");
    ul.replaceChildren();
    $("lista-vazia").hidden = gastos.length > 0;

    gastos.forEach((g) => {
      const li = document.createElement("li");

      const info = document.createElement("div");
      info.className = "item-info";
      const desc = document.createElement("div");
      desc.className = "item-desc";
      desc.textContent = g.descricao || g.categoria;
      const det = document.createElement("div");
      det.className = "item-detalhe";
      det.textContent = diaMes(g.data) + " · " + g.categoria;
      info.append(desc, det);

      const valor = document.createElement("span");
      valor.className = "item-valor";
      valor.textContent = dinheiro.format(g.valor);

      const apagar = document.createElement("button");
      apagar.type = "button";
      apagar.className = "botao-apagar";
      apagar.textContent = "Apagar";
      apagar.setAttribute("aria-label", "Apagar " + (g.descricao || g.categoria));
      apagar.addEventListener("click", () => apagarGasto(g, apagar));

      li.append(info, valor, apagar);
      ul.append(li);
    });
  }

  async function apagarGasto(g, botao) {
    if (!confirm("Apagar \"" + (g.descricao || g.categoria) + "\" de " + dinheiro.format(g.valor) + "?")) return;
    botao.disabled = true;
    const { error } = await sb.from("gastos").delete().eq("id", g.id);
    if (error) {
      botao.disabled = false;
      avisar("gasto-msg", "Não consegui apagar. " + frase(error));
      return;
    }
    gastos = gastos.filter((x) => x.id !== g.id);
    desenhar();
  }

  // ---------- Lançar à mão ----------

  const select = $("categoria");
  cfg.CATEGORIAS.forEach((c) => {
    const op = document.createElement("option");
    op.value = c;
    op.textContent = c;
    select.append(op);
  });

  $("form-gasto").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const valor = lerValor($("valor").value);
    if (!valor) return avisar("gasto-msg", "Digite o valor do gasto, por exemplo 12,50.");
    const data = $("data").value || isoLocal(new Date());
    const categoria = select.value;
    const descricao = $("descricao").value.trim() || categoria;

    const botao = ev.submitter || $("form-gasto").querySelector("button");
    botao.disabled = true;
    avisar("gasto-msg", "Salvando…");
    const { error } = await sb.from("gastos").insert({
      dono: usuario.id,
      data: data,
      descricao: descricao,
      valor: valor,
      categoria: categoria,
      origem: "manual"
    });
    botao.disabled = false;
    if (error) return avisar("gasto-msg", "Não consegui salvar. " + frase(error));

    $("valor").value = "";
    $("descricao").value = "";
    $("data").value = isoLocal(new Date());
    avisar("gasto-msg", "Gasto salvo.");
    carregarGastos();
  });

  // ---------- Limite ----------

  $("botao-limite").addEventListener("click", () => {
    const form = $("form-limite");
    form.hidden = !form.hidden;
    if (!form.hidden) {
      const atual = lerLimite();
      $("valor-limite").value = atual ? String(atual).replace(".", ",") : "";
      $("valor-limite").focus();
    }
  });

  $("form-limite").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const v = lerValor($("valor-limite").value);
    if (!v) return avisar("limite-msg", "Digite o limite do mês, por exemplo 1500,00.");
    if (!guardarLimite(v))
      return avisar("limite-msg", "Este navegador não deixou guardar o limite. Saia do modo anônimo e tente de novo.");
    avisar("limite-msg", "");
    $("form-limite").hidden = true;
    desenhar();
  });

  // ---------- Resumo da semana ----------

  async function carregarResumo() {
    const { data, error } = await sb
      .from("resumos")
      .select("texto, criado_em")
      .order("criado_em", { ascending: false })
      .limit(1);
    const texto = !error && data && data[0] && data[0].texto;
    $("cartao-resumo").hidden = !texto;
    $("texto-resumo").textContent = texto || "";
  }

  // ---------- Assistente ----------

  const LADO_MAXIMO = 1600;
  const botoesAssistente = () => $("form-assistente").querySelectorAll("button");

  function travarAssistente(travar) {
    botoesAssistente().forEach((b) => (b.disabled = travar));
    $("frase-assistente").disabled = travar;
  }

  async function falarComAssistente(pedido) {
    const { data } = await sb.auth.getSession();
    const token = data && data.session && data.session.access_token;
    if (!token) return avisar("assistente-msg", "Sua entrada expirou. Toque em Sair e entre de novo.");

    travarAssistente(true);
    avisar("assistente-msg", pedido.imagem ? "Lendo o cupom…" : "Pensando…");
    try {
      const r = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ ...pedido, categorias: cfg.CATEGORIAS })
      });
      let corpo = {};
      try { corpo = await r.json(); } catch (e) {}
      if (!r.ok) {
        avisar("assistente-msg", corpo.erro ||
          "O assistente não respondeu. Tente de novo em instantes ou lance à mão.");
        return;
      }
      avisar("assistente-msg", corpo.resposta || "");
      if (corpo.lancado) {
        $("frase-assistente").value = "";
        carregarGastos();
      }
    } catch (e) {
      avisar("assistente-msg", "Sem conexão com a internet. Confira a rede e tente de novo.");
    } finally {
      travarAssistente(false);
    }
  }

  $("form-assistente").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const mensagem = $("frase-assistente").value.trim();
    if (!mensagem) return avisar("assistente-msg", "Escreva o gasto numa frase, por exemplo: mercado 50 hoje.");
    falarComAssistente({ mensagem });
  });

  // Reduz a foto no próprio aparelho (no máximo 1600 px, JPEG). Nada é guardado.
  function reduzirFoto(arquivo) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(arquivo);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
        const tela = document.createElement("canvas");
        tela.width = Math.round(img.width * escala);
        tela.height = Math.round(img.height * escala);
        tela.getContext("2d").drawImage(img, 0, 0, tela.width, tela.height);
        resolve(tela.toDataURL("image/jpeg", 0.85).split(",")[1]);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("foto"));
      };
      img.src = url;
    });
  }

  const seletorFoto = document.createElement("input");
  seletorFoto.type = "file";
  seletorFoto.accept = "image/*";
  seletorFoto.hidden = true;
  document.body.append(seletorFoto);

  $("botao-foto").addEventListener("click", () => seletorFoto.click());

  seletorFoto.addEventListener("change", async () => {
    const arquivo = seletorFoto.files && seletorFoto.files[0];
    seletorFoto.value = "";
    if (!arquivo) return;
    let imagem;
    try {
      imagem = await reduzirFoto(arquivo);
    } catch (e) {
      return avisar("assistente-msg", "Não consegui abrir essa foto. Tire outra foto do cupom e tente de novo.");
    }
    falarComAssistente({ mensagem: $("frase-assistente").value.trim(), imagem, mime: "image/jpeg" });
  });

  // ---------- Quem está dentro ----------

  sb.auth.onAuthStateChange((evento, sessao) => {
    const novo = sessao ? sessao.user : null;
    if (!novo) return mostrarEntrada();
    if (usuario && usuario.id === novo.id) return;
    usuario = novo;
    // Sai do aviso do Supabase antes de chamar o banco.
    setTimeout(mostrarPrincipal, 0);
  });
})();
