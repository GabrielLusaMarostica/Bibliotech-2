if (App.iniciar()) {
  const form = document.getElementById("form-emprestimo");
  const selAluno = document.getElementById("aluno");
  const selFunc = document.getElementById("funcionario");
  const selLivro = document.getElementById("livro");
  const qtd = document.getElementById("qtd");
  const prevista = document.getElementById("prevista");
  const lista = document.getElementById("lista-itens");
  const erroItem = document.getElementById("erro-item");
  const erroLista = document.getElementById("erro-lista");
  const R = Validacao.regras;
  let itens = []; // { livroId, quantidade }

  const opcoes = (arr, texto) => '<option value="">Selecione...</option>' +
    arr.map((x) => `<option value="${x.id}">${App.esc(texto(x))}</option>`).join("");
  selAluno.innerHTML = opcoes(Dados.listar("alunos"), (a) => `${a.nome} (${a.matricula})`);
  selFunc.innerHTML = opcoes(Dados.listar("funcionarios"), (f) => f.nome);

  function atualizarLivros() {
    selLivro.innerHTML = opcoes(Dados.listar("livros"),
      (l) => `${l.titulo} – ${l.quantidade === 0 ? "indisponível" : l.quantidade + " disp."}`);
  }
  function padraoPrevista() { prevista.value = Dados.iso(Dados.somarDias(new Date(), 7)); }
  atualizarLivros(); padraoPrevista();

  function desenharItens() {
    lista.innerHTML = itens.length === 0
      ? '<p class="vazio">Nenhum livro adicionado.</p>'
      : itens.map((it, i) => {
          const l = Dados.buscar("livros", it.livroId);
          return `<div class="item-lista"><span>${App.esc(l.titulo)} <strong>× ${it.quantidade}</strong></span>
            <button type="button" class="botao perigo pequeno" data-remover="${i}" aria-label="Remover ${App.esc(l.titulo)}">Remover</button></div>`;
        }).join("");
    document.getElementById("total-exemplares").textContent = itens.reduce((s, i) => s + i.quantidade, 0);
  }

  document.getElementById("btn-adicionar").addEventListener("click", () => {
    erroItem.textContent = ""; erroLista.textContent = "";
    const livro = Dados.buscar("livros", Number(selLivro.value));
    const q = Number(qtd.value);
    if (!livro) { erroItem.textContent = "Selecione um livro."; return; }
    if (!Number.isInteger(q) || q <= 0) { erroItem.textContent = "A quantidade deve ser um inteiro maior que zero."; return; }
    if (itens.some((i) => i.livroId === livro.id)) { erroItem.textContent = "Este livro já está na lista."; return; }
    if (q > livro.quantidade) {
      erroItem.textContent = `Estoque insuficiente: "${livro.titulo}" tem ${livro.quantidade} disponível(is).`; return;
    }
    itens.push({ livroId: livro.id, quantidade: q });
    selLivro.value = ""; qtd.value = 1;
    desenharItens();
  });
  lista.addEventListener("click", (e) => {
    const b = e.target.closest("[data-remover]"); if (!b) return;
    itens.splice(Number(b.dataset.remover), 1); desenharItens();
  });

  Validacao.ligar(form, {
    aluno: [R.obrigatorio],
    funcionario: [R.obrigatorio],
    prevista: [R.dataFutura]
  }, () => {
    if (itens.length === 0) { erroLista.textContent = "Adicione pelo menos um livro."; return; }
    // Regra do servico Java: o pedido e gravado por inteiro ou recusado por inteiro.
    const d = Dados.ler();
    for (const it of itens) {
      const l = d.livros.find((x) => x.id === it.livroId);
      if (l.quantidade < it.quantidade) { erroLista.textContent = `Estoque insuficiente para "${l.titulo}". Nada foi registrado.`; return; }
    }
    itens.forEach((it) => { d.livros.find((x) => x.id === it.livroId).quantidade -= it.quantidade; });
    d.emprestimos.push({
      id: d.seq.emprestimo++, alunoId: Number(selAluno.value), funcionarioId: Number(selFunc.value),
      data: Dados.iso(new Date()), prevista: prevista.value, itens: itens.map((i) => ({ ...i })), devolvido: false
    });
    Dados.gravar(d);
    App.aviso("Empréstimo registrado com sucesso.");
    itens = []; Validacao.limpar(form); atualizarLivros(); padraoPrevista(); desenharItens();
  });
  form.addEventListener("reset", () => { setTimeout(() => { itens = []; Validacao.limpar(form); padraoPrevista(); desenharItens(); erroItem.textContent = ""; erroLista.textContent = ""; }); });
  desenharItens();
}
