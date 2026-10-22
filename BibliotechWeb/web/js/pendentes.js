if (App.iniciar()) {
  const corpo = document.getElementById("corpo-tabela");
  const busca = document.getElementById("busca");
  const soAtrasados = document.getElementById("so-atrasados");
  const dialogo = document.getElementById("dialogo-devolucao");
  let alvo = null;

  function desenhar() {
    const termo = busca.value.trim().toLowerCase();
    const lista = Dados.listar("emprestimos").filter((e) => !e.devolvido).filter((e) => {
      const aluno = Dados.buscar("alunos", e.alunoId);
      return (!termo || (aluno && aluno.nome.toLowerCase().includes(termo))) &&
             (!soAtrasados.checked || App.diasAtraso(e.prevista) > 0);
    });
    document.getElementById("contador").textContent = `${lista.length} pendente(s)`;
    corpo.innerHTML = lista.length === 0
      ? '<tr><td class="vazio" colspan="5">Nenhum empréstimo pendente.</td></tr>'
      : lista.map((e) => {
          const aluno = Dados.buscar("alunos", e.alunoId);
          const livros = e.itens.map((i) => `${App.esc(Dados.buscar("livros", i.livroId).titulo)} (×${i.quantidade})`).join(", ");
          const dias = App.diasAtraso(e.prevista);
          const selo = dias > 0 ? `<span class="selo atraso">${dias} dia(s) de atraso</span>` : '<span class="selo ok">No prazo</span>';
          return `<tr><td>${App.esc(aluno ? aluno.nome : "—")}</td><td>${livros}</td><td>${App.dataBR(e.prevista)}</td><td>${selo}</td>
            <td><button class="botao pequeno" data-devolver="${e.id}">Devolver</button></td></tr>`;
        }).join("");
  }

  corpo.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-devolver]"); if (!b) return;
    alvo = Dados.buscar("emprestimos", Number(b.dataset.devolver));
    const dias = App.diasAtraso(alvo.prevista);
    const multa = dias * App.MULTA_POR_DIA;
    const aluno = Dados.buscar("alunos", alvo.alunoId);
    document.getElementById("detalhe-devolucao").innerHTML =
      `<p>Aluno: <strong>${App.esc(aluno.nome)}</strong></p>
       <p>Dias de atraso: <strong>${dias}</strong></p>
       <p>Multa: <span class="resumo-valor">${App.moeda(multa)}</span></p>`;
    dialogo.showModal();
  });
  document.getElementById("cancelar-devolucao").addEventListener("click", () => dialogo.close());
  document.getElementById("confirmar-devolucao").addEventListener("click", () => {
    const d = Dados.ler();
    const emp = d.emprestimos.find((e) => e.id === alvo.id);
    if (emp.devolvido) { App.aviso("Este empréstimo já foi devolvido.", "erro"); dialogo.close(); return; }
    emp.devolvido = true; emp.dataDevolucao = Dados.iso(new Date());
    emp.itens.forEach((i) => { d.livros.find((l) => l.id === i.livroId).quantidade += i.quantidade; });
    Dados.gravar(d);
    dialogo.close(); desenhar();
    App.aviso("Devolução registrada. Estoque atualizado.");
  });
  busca.addEventListener("input", desenhar);
  soAtrasados.addEventListener("change", desenhar);
  desenhar();
}
