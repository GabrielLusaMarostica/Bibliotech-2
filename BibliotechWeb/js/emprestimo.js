/* emprestimo.js – montagem do pedido (carrinho de livros), validação e confirmação */
(() => {
  const form = document.getElementById("form-emprestimo");
  const selAluno = form.elements.aluno;
  const selFunc = form.elements.funcionario;
  const selLivro = form.elements.livro;
  const campoData = form.elements.dataPrevista;
  const campoQtd = form.elements.quantidade;
  const corpo = document.querySelector("#tabela-itens tbody");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const alerta = document.getElementById("alerta-form");
  let itens = []; // { idLivro, quantidade }

  const opcao = (valor, rotulo, desativada) =>
    `<option value="${valor}" ${desativada ? "disabled" : ""}>${UI.escapar(rotulo)}</option>`;

  function carregarListas() {
    selAluno.innerHTML = opcao("", "Selecione…") + Dados.listar("aluno")
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      .map((a) => opcao(a.id, `${a.nome} (${a.matricula})`)).join("");
    selFunc.innerHTML = opcao("", "Selecione…") + Dados.listar("funcionario")
      .map((f) => opcao(f.id, f.nome)).join("");
    selLivro.innerHTML = opcao("", "Selecione…") + Dados.listar("livro")
      .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"))
      .map((l) => opcao(l.id, `${l.titulo} — ${l.quantidade} disp.`, l.quantidade === 0)).join("");
  }

  const regrasPedido = {
    aluno: Validacao.obrigatorio("o aluno"),
    funcionario: Validacao.obrigatorio("o funcionário"),
    dataPrevista: Validacao.compor(
      Validacao.obrigatorio("a data prevista"),
      Validacao.dataValida,
      Validacao.dataNaoAnterior(() => Dados.hoje(), "A data prevista não pode ser anterior a hoje.")
    )
  };
  const validarPedido = Validacao.ligar(form, regrasPedido);

  function desenharResumo() {
    corpo.innerHTML = itens.length
      ? itens.map((item) => {
          const livro = Dados.buscar("livro", item.idLivro);
          return `<tr><td>${UI.escapar(livro.titulo)}</td><td class="num">${item.quantidade}</td>
            <td class="acoes"><button type="button" class="btn btn--perigo btn--pequeno" data-remover="${item.idLivro}"
              aria-label="Remover ${UI.escapar(livro.titulo)}">Remover</button></td></tr>`;
        }).join("")
      : '<tr><td class="vazio" colspan="3">Nenhum livro adicionado.</td></tr>';
    btnConfirmar.disabled = itens.length === 0;
    document.getElementById("res-aluno").textContent = selAluno.selectedOptions[0]?.value ? selAluno.selectedOptions[0].text : "–";
    document.getElementById("res-funcionario").textContent = selFunc.selectedOptions[0]?.value ? selFunc.selectedOptions[0].text : "–";
    document.getElementById("res-data").textContent = campoData.value ? Dados.formatarData(campoData.value) : "–";
  }

  function adicionarLivro() {
    Validacao.mostrarErro(selLivro, "");
    Validacao.mostrarErro(campoQtd, "");
    if (!selLivro.value) { Validacao.mostrarErro(selLivro, "Escolha um livro."); selLivro.focus(); return; }
    const erroQtd = Validacao.compor(Validacao.obrigatorio("a quantidade"), Validacao.inteiro("A quantidade", 1, 99))(campoQtd.value);
    if (erroQtd) { Validacao.mostrarErro(campoQtd, erroQtd); campoQtd.focus(); return; }

    const idLivro = Number(selLivro.value);
    const quantidade = Number(campoQtd.value);
    const livro = Dados.buscar("livro", idLivro);
    if (itens.some((i) => i.idLivro === idLivro)) {
      Validacao.mostrarErro(selLivro, "Este livro já foi adicionado ao empréstimo."); return;
    }
    if (quantidade > livro.quantidade) {
      Validacao.mostrarErro(campoQtd, `Estoque insuficiente (disponível: ${livro.quantidade}).`); campoQtd.focus(); return;
    }
    itens.push({ idLivro, quantidade });
    selLivro.value = "";
    campoQtd.value = 1;
    desenharResumo();
  }

  function reiniciar() {
    itens = [];
    form.reset();
    Validacao.limpar(form);
    alerta.hidden = true;
    campoData.value = Dados.somarDias(Dados.hoje(), Dados.PRAZO_PADRAO_DIAS);
    campoData.min = Dados.hoje();
    carregarListas();
    desenharResumo();
  }

  document.getElementById("btn-adicionar").addEventListener("click", adicionarLivro);
  document.getElementById("btn-limpar").addEventListener("click", reiniciar);
  [selAluno, selFunc, campoData].forEach((c) => c.addEventListener("change", desenharResumo));
  form.addEventListener("submit", (e) => e.preventDefault());

  corpo.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-remover]");
    if (!botao) return;
    itens = itens.filter((i) => i.idLivro !== Number(botao.dataset.remover));
    desenharResumo();
  });

  btnConfirmar.addEventListener("click", async () => {
    alerta.hidden = true;
    if (!validarPedido()) return;
    const ok = await UI.confirmar({
      titulo: "Confirmar empréstimo?",
      mensagem: `${itens.length} título(s) para ${selAluno.selectedOptions[0].text}, devolução até ${Dados.formatarData(campoData.value)}.`
    });
    if (!ok) return;
    const resultado = Dados.registrarEmprestimo({
      idAluno: Number(selAluno.value), idFuncionario: Number(selFunc.value),
      dataPrevista: campoData.value, itens
    });
    if (!resultado.ok) { alerta.textContent = resultado.erro; alerta.hidden = false; return; }
    UI.aviso(`Empréstimo nº ${resultado.emprestimo.id} registrado.`);
    reiniciar();
  });

  document.getElementById("res-multa").textContent = `${Dados.formatarMoeda(Dados.MULTA_POR_DIA)} por dia de atraso, por empréstimo`;
  reiniciar();
})();
