/* devolucao.js – lista de pendentes, cálculo de atraso/multa e registro de devolução */
(() => {
  const campoData = document.getElementById("data-ref");
  const corpoPend = document.querySelector("#tabela-pendentes tbody");
  const corpoHist = document.querySelector("#tabela-historico tbody");
  const contador = document.getElementById("contador");

  const nomeAluno = (id) => Dados.buscar("aluno", id)?.nome ?? "—";
  const titulos = (e) => e.itens.map((i) => {
    const livro = Dados.buscar("livro", i.idLivro);
    return `${UI.escapar(livro.titulo)}${i.quantidade > 1 ? ` (x${i.quantidade})` : ""}`;
  }).join("<br>");

  function dataValida() {
    return /^\d{4}-\d{2}-\d{2}$/.test(campoData.value) ? campoData.value : Dados.hoje();
  }

  function desenhar() {
    const referencia = dataValida();
    const pendentes = Dados.pendentes().sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista));
    contador.textContent = `${pendentes.length} em aberto`;

    corpoPend.innerHTML = pendentes.length
      ? pendentes.map((e) => {
          const dias = Dados.diasAtraso(e.dataPrevista, referencia);
          const situacao = dias > 0
            ? `<span class="selo selo--atraso">${dias} ${dias === 1 ? "dia" : "dias"} de atraso</span>`
            : '<span class="selo selo--ok">No prazo</span>';
          return `<tr>
            <td>${e.id}</td><td>${UI.escapar(nomeAluno(e.idAluno))}</td><td>${titulos(e)}</td>
            <td>${Dados.formatarData(e.dataPrevista)}</td><td>${situacao}</td>
            <td class="num">${Dados.formatarMoeda(Dados.calcularMulta(dias))}</td>
            <td class="acoes"><button type="button" class="btn btn--pequeno" data-devolver="${e.id}">Registrar devolução</button></td>
          </tr>`;
        }).join("")
      : '<tr><td class="vazio" colspan="7">Não há empréstimos pendentes.</td></tr>';

    const historico = Dados.listarDevolucoes().reverse();
    const porId = Object.fromEntries(Dados.listarEmprestimos().map((e) => [e.id, e]));
    corpoHist.innerHTML = historico.length
      ? historico.map((d) => `<tr>
          <td>${d.idEmprestimo}</td><td>${UI.escapar(nomeAluno(porId[d.idEmprestimo].idAluno))}</td>
          <td>${Dados.formatarData(d.dataDevolucao)}</td><td class="num">${d.diasAtraso}</td>
          <td class="num">${Dados.formatarMoeda(d.multa)}</td></tr>`).join("")
      : '<tr><td class="vazio" colspan="5">Nenhuma devolução registrada ainda.</td></tr>';
  }

  corpoPend.addEventListener("click", async (evento) => {
    const botao = evento.target.closest("[data-devolver]");
    if (!botao) return;
    const id = Number(botao.dataset.devolver);
    const emprestimo = Dados.listarEmprestimos().find((e) => e.id === id);
    const referencia = dataValida();
    const dias = Dados.diasAtraso(emprestimo.dataPrevista, referencia);
    const ok = await UI.confirmar({
      titulo: "Registrar devolução?",
      mensagem: dias > 0
        ? `Atraso de ${dias} dia(s). Multa de ${Dados.formatarMoeda(Dados.calcularMulta(dias))}.`
        : "Devolução dentro do prazo, sem multa."
    });
    if (!ok) return;
    const resultado = Dados.registrarDevolucao(id, referencia);
    if (resultado.ok) { UI.aviso("Devolução registrada e estoque atualizado."); desenhar(); }
    else UI.aviso(resultado.erro, "erro");
  });

  campoData.value = Dados.hoje();
  campoData.addEventListener("change", desenhar);
  desenhar();
})();
