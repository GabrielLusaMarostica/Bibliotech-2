/*
 * validacao.js – regras de validação reutilizáveis nos formulários.
 * Cada regra recebe o texto digitado e devolve uma mensagem de erro ou "" quando válido.
 * As mesmas regras existem no servidor (classe Validacao do núcleo Java): a validação
 * aqui serve para dar resposta rápida ao usuário, nunca como única proteção.
 */
const Validacao = (() => {
  const obrigatorio = (rotulo) => (v) => (v.trim() ? "" : `Informe ${rotulo}.`);

  const tamanho = (rotulo, min, max) => (v) => {
    const t = v.trim();
    if (!t) return "";
    if (t.length < min) return `${rotulo} deve ter ao menos ${min} caracteres.`;
    if (t.length > max) return `${rotulo} deve ter no máximo ${max} caracteres.`;
    return "";
  };

  const nomeProprio = (v) => {
    const t = v.trim();
    if (!t) return "";
    return /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/.test(t) ? "" : "Use apenas letras, espaços, apóstrofo, ponto ou hífen.";
  };

  const matricula = (v) => {
    const t = v.trim();
    if (!t) return "";
    return /^[A-Za-z0-9-]{3,30}$/.test(t) ? "" : "Use de 3 a 30 letras, números ou hífen, sem espaços.";
  };

  const contato = (v) => {
    const t = v.trim();
    if (!t) return ""; // campo opcional
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
    const telefone = /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(t);
    return email || telefone ? "" : "Informe um e-mail válido ou telefone no formato (41) 99999-9999.";
  };

  const inteiro = (rotulo, min, max) => (v) => {
    const t = String(v).trim();
    if (!t) return "";
    if (!/^-?\d+$/.test(t)) return `${rotulo} deve ser um número inteiro.`;
    const n = Number(t);
    if (n < min) return `${rotulo} deve ser no mínimo ${min}.`;
    if (max !== undefined && n > max) return `${rotulo} deve ser no máximo ${max}.`;
    return "";
  };

  const ano = inteiro("O ano", 1000, new Date().getFullYear());

  const dataValida = (v) => {
    if (!v) return "";
    return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? "" : "Informe uma data válida.";
  };

  const dataNaoAnterior = (limite, rotulo) => (v) => (v && v < limite() ? `${rotulo}` : "");

  // Executa as regras em ordem e devolve a primeira mensagem de erro.
  const compor = (...regras) => (valor) => {
    for (const regra of regras) {
      const erro = regra(valor);
      if (erro) return erro;
    }
    return "";
  };

  /* ---------- ligação com o HTML ---------- */
  function mostrarErro(campo, mensagem) {
    const grupo = campo.closest(".campo");
    const alvo = grupo.querySelector(".campo__erro");
    grupo.classList.toggle("campo--erro", Boolean(mensagem));
    campo.setAttribute("aria-invalid", mensagem ? "true" : "false");
    if (alvo) alvo.textContent = mensagem;
  }

  function validarCampo(campo, regra) {
    const mensagem = regra(campo.value);
    mostrarErro(campo, mensagem);
    return !mensagem;
  }

  /**
   * Liga as regras a um formulário: valida ao sair do campo (blur) e, depois do
   * primeiro erro, a cada tecla. Devolve uma função que valida tudo e foca o primeiro erro.
   * @param {HTMLFormElement} form
   * @param {Object<string, Function>} regras  nome do campo -> regra
   */
  function ligar(form, regras) {
    Object.entries(regras).forEach(([nome, regra]) => {
      const campo = form.elements[nome];
      if (!campo) return;
      campo.addEventListener("blur", () => validarCampo(campo, regra));
      campo.addEventListener("input", () => {
        if (campo.closest(".campo").classList.contains("campo--erro")) validarCampo(campo, regra);
      });
    });
    return function validarTudo() {
      let primeiro = null;
      Object.entries(regras).forEach(([nome, regra]) => {
        const campo = form.elements[nome];
        if (campo && !validarCampo(campo, regra) && !primeiro) primeiro = campo;
      });
      if (primeiro) primeiro.focus();
      return !primeiro;
    };
  }

  function limpar(form) {
    form.querySelectorAll(".campo").forEach((g) => g.classList.remove("campo--erro"));
    form.querySelectorAll(".campo__erro").forEach((e) => { e.textContent = ""; });
    form.querySelectorAll("[aria-invalid]").forEach((c) => c.removeAttribute("aria-invalid"));
  }

  return { obrigatorio, tamanho, nomeProprio, matricula, contato, inteiro, ano, dataValida, dataNaoAnterior, compor, ligar, limpar, mostrarErro };
})();
