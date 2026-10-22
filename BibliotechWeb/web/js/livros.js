if (App.iniciar()) {
  const R = Validacao.regras;
  Crud.iniciar({
    tipo: "livros", seq: "livro", singular: "Livro", rotulo: "titulo", numericos: ["quantidade"],
    colunas: [
      { campo: "titulo" }, { campo: "autor" }, { campo: "isbn" },
      { campo: "quantidade", formato: (l) => {
        const classe = l.quantidade === 0 ? "atraso" : l.quantidade <= 1 ? "baixo" : "ok";
        const texto = l.quantidade === 0 ? "Indisponível" : l.quantidade + " un.";
        return `<span class="selo ${classe}">${texto}</span>`;
      } }
    ],
    esquema: {
      titulo: [R.obrigatorio],
      autor: [R.obrigatorio],
      isbn: [R.obrigatorio, R.isbn],
      quantidade: [R.obrigatorio, R.inteiroNaoNegativo]
    },
    checarDuplicado: (d, id) => Dados.listar("livros").some((l) => l.isbn.replace(/\D/g, "") === d.isbn.replace(/\D/g, "") && l.id !== id)
      ? "Já existe um livro com esse ISBN." : null,
    checarExclusao: (l) => Dados.listar("emprestimos").some((e) => !e.devolvido && e.itens.some((i) => i.livroId === l.id))
      ? "Há empréstimos pendentes com este livro." : null
  });
}
