if (App.iniciar()) {
  const livros = Dados.listar("livros");
  const pend = Dados.listar("emprestimos").filter((e) => !e.devolvido);
  const atrasados = pend.filter((e) => App.diasAtraso(e.prevista) > 0);

  document.getElementById("ind-livros").textContent = livros.reduce((s, l) => s + l.quantidade, 0);
  document.getElementById("ind-alunos").textContent = Dados.listar("alunos").length;
  document.getElementById("ind-pendentes").textContent = pend.length;
  document.getElementById("ind-atrasados").textContent = atrasados.length;

  const urgentes = [...pend].sort((a, b) => a.prevista.localeCompare(b.prevista)).slice(0, 5);
  document.getElementById("urgentes").innerHTML = urgentes.length === 0
    ? '<tr><td class="vazio" colspan="3">Nenhum empréstimo pendente.</td></tr>'
    : urgentes.map((e) => {
        const dias = App.diasAtraso(e.prevista);
        const aluno = Dados.buscar("alunos", e.alunoId);
        const selo = dias > 0 ? `<span class="selo atraso">${dias} dia(s) de atraso</span>` : '<span class="selo ok">No prazo</span>';
        return `<tr><td>${App.esc(aluno ? aluno.nome : "—")}</td><td>${App.dataBR(e.prevista)}</td><td>${selo}</td></tr>`;
      }).join("");

  const baixos = livros.filter((l) => l.quantidade <= 1);
  document.getElementById("estoque-baixo").innerHTML = baixos.length === 0
    ? "<li>Todos os livros com estoque confortável.</li>"
    : baixos.map((l) => `<li><strong>${App.esc(l.titulo)}</strong> – ${l.quantidade === 0 ? "indisponível" : l.quantidade + " exemplar"}</li>`).join("");
}
