/*
 * crud.js – comportamento comum das telas de cadastro (alunos, livros, funcionários):
 * listar, buscar, validar, incluir, editar e excluir.
 * Cada página só informa a configuração (tipo, colunas e regras de validação).
 */
const Crud = (() => {
  function iniciar(cfg) {
    const form = document.getElementById("form-cadastro");
    const corpo = document.querySelector("#tabela tbody");
    const busca = document.getElementById("busca");
    const titulo = document.getElementById("titulo-form");
    const botaoSalvar = document.getElementById("btn-salvar");
    const botaoCancelar = document.getElementById("btn-cancelar");
    const contador = document.getElementById("contador");
    const alerta = document.getElementById("alerta-form");
    const validarTudo = Validacao.ligar(form, cfg.regras);

    function desenhar() {
      const termo = busca.value.trim().toLowerCase();
      const registros = Dados.listar(cfg.tipo).filter((r) =>
        !termo || cfg.buscaEm.some((c) => String(r[c]).toLowerCase().includes(termo)));
      registros.sort((a, b) => String(a[cfg.ordenarPor]).localeCompare(String(b[cfg.ordenarPor]), "pt-BR"));

      contador.textContent = `${registros.length} ${registros.length === 1 ? cfg.singular : cfg.plural}`;
      if (!registros.length) {
        corpo.innerHTML = `<tr><td class="vazio" colspan="${cfg.colunas.length + 1}">Nenhum registro encontrado.</td></tr>`;
        return;
      }
      corpo.innerHTML = registros.map((r) => `
        <tr>
          ${cfg.colunas.map((c) => `<td class="${c.classe || ""}">${c.formato ? c.formato(r) : UI.escapar(r[c.campo] ?? "")}</td>`).join("")}
          <td class="acoes">
            <button type="button" class="btn btn--secundario btn--pequeno" data-editar="${r.id}" aria-label="Editar ${UI.escapar(r[cfg.ordenarPor])}">Editar</button>
            <button type="button" class="btn btn--perigo btn--pequeno" data-excluir="${r.id}" aria-label="Excluir ${UI.escapar(r[cfg.ordenarPor])}">Excluir</button>
          </td>
        </tr>`).join("");
    }

    function limparFormulario() {
      form.reset();
      form.elements.id.value = "";
      Validacao.limpar(form);
      alerta.hidden = true;
      titulo.textContent = `Novo ${cfg.singular}`;
      botaoSalvar.textContent = "Cadastrar";
      botaoCancelar.hidden = true;
    }

    function preencher(registro) {
      limparFormulario();
      Object.keys(cfg.regras).concat("id").forEach((nome) => { form.elements[nome].value = registro[nome] ?? ""; });
      titulo.textContent = `Editar ${cfg.singular}`;
      botaoSalvar.textContent = "Salvar alterações";
      botaoCancelar.hidden = false;
      form.elements[Object.keys(cfg.regras)[0]].focus();
      form.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    form.addEventListener("submit", (evento) => {
      evento.preventDefault();
      alerta.hidden = true;
      if (!validarTudo()) return;

      const registro = { id: Number(form.elements.id.value) || 0 };
      Object.keys(cfg.regras).forEach((nome) => {
        const bruto = form.elements[nome].value.trim();
        registro[nome] = cfg.numericos && cfg.numericos.includes(nome) ? Number(bruto) : bruto;
      });

      const resultado = Dados.salvarRegistro(cfg.tipo, registro);
      if (!resultado.ok) {
        if (resultado.campo) Validacao.mostrarErro(form.elements[resultado.campo], resultado.erro);
        else { alerta.textContent = resultado.erro; alerta.hidden = false; }
        return;
      }
      UI.aviso(registro.id ? `${cfg.Singular} atualizado com sucesso.` : `${cfg.Singular} cadastrado com sucesso.`);
      limparFormulario();
      desenhar();
    });

    corpo.addEventListener("click", async (evento) => {
      const botao = evento.target.closest("button");
      if (!botao) return;
      if (botao.dataset.editar) {
        preencher(Dados.buscar(cfg.tipo, botao.dataset.editar));
      } else if (botao.dataset.excluir) {
        const registro = Dados.buscar(cfg.tipo, botao.dataset.excluir);
        const ok = await UI.confirmar({
          titulo: `Excluir ${cfg.singular}?`,
          mensagem: `"${registro[cfg.ordenarPor]}" será removido. Essa ação não pode ser desfeita.`,
          rotuloOk: "Excluir", perigo: true
        });
        if (!ok) return;
        const resultado = Dados.excluirRegistro(cfg.tipo, registro.id);
        if (resultado.ok) { UI.aviso(`${cfg.Singular} excluído.`); desenhar(); }
        else UI.aviso(resultado.erro, "erro");
      }
    });

    busca.addEventListener("input", desenhar);
    botaoCancelar.addEventListener("click", limparFormulario);
    limparFormulario();
    desenhar();
  }

  return { iniciar };
})();
