/* painel.js – indicadores, lista de atrasos e gráfico de barras do painel */
(() => {
  const livros = Dados.listar("livro");
  const alunos = Dados.listar("aluno");
  const pendentes = Dados.pendentes();
  const hoje = Dados.hoje();
  const atrasados = pendentes.filter((e) => Dados.diasAtraso(e.dataPrevista, hoje) > 0);

  const texto = (id, valor) => { document.getElementById(id).textContent = valor; };
  texto("data-hoje", new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  texto("ind-titulos", livros.length);
  texto("ind-exemplares", livros.reduce((soma, l) => soma + l.quantidade, 0));
  texto("ind-alunos", alunos.length);
  texto("ind-pendentes", pendentes.length);
  texto("ind-atrasados", atrasados.length);

  const corpo = document.querySelector("#tabela-atrasos tbody");
  corpo.innerHTML = atrasados.length
    ? atrasados.map((e) => {
        const dias = Dados.diasAtraso(e.dataPrevista, hoje);
        const aluno = Dados.buscar("aluno", e.idAluno);
        return `<tr><td>${UI.escapar(aluno.nome)}</td><td>${Dados.formatarData(e.dataPrevista)}</td>
          <td class="num">${dias}</td><td class="num">${Dados.formatarMoeda(Dados.calcularMulta(dias))}</td></tr>`;
      }).join("")
    : '<tr><td class="vazio" colspan="4">Nenhum empréstimo em atraso. 🎉</td></tr>';

  const porGenero = {};
  livros.forEach((l) => { const g = l.genero || "Sem gênero"; porGenero[g] = (porGenero[g] || 0) + l.quantidade; });
  const maior = Math.max(1, ...Object.values(porGenero));
  document.getElementById("barras-generos").innerHTML = Object.entries(porGenero)
    .sort((a, b) => b[1] - a[1])
    .map(([genero, qtd]) => `
      <div class="barras__linha">
        <span>${UI.escapar(genero)}</span>
        <div class="barras__trilho"><div class="barras__preenchimento" style="width:${(qtd / maior) * 100}%"></div></div>
        <strong>${qtd}</strong>
      </div>`).join("");
})();
