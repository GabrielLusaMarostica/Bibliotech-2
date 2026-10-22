/* livros.js – configuração da tela de cadastro de livros */
Crud.iniciar({
  tipo: "livro", singular: "livro", Singular: "Livro", plural: "livros",
  ordenarPor: "titulo",
  buscaEm: ["titulo", "autor", "genero"],
  numericos: ["ano", "quantidade"],
  colunas: [
    { campo: "titulo" }, { campo: "autor" }, { campo: "genero" },
    { campo: "ano", classe: "num" },
    {
      campo: "quantidade", classe: "num",
      formato: (l) => l.quantidade === 0
        ? '<span class="selo selo--atraso">Indisponível</span>'
        : String(l.quantidade)
    }
  ],
  regras: {
    titulo: Validacao.compor(Validacao.obrigatorio("o título"), Validacao.tamanho("O título", 1, 200)),
    autor: Validacao.compor(Validacao.obrigatorio("o autor"), Validacao.tamanho("O autor", 2, 120)),
    genero: Validacao.tamanho("O gênero", 2, 60),
    ano: Validacao.compor(Validacao.obrigatorio("o ano"), Validacao.ano),
    quantidade: Validacao.compor(Validacao.obrigatorio("a quantidade"), Validacao.inteiro("A quantidade", 0, 9999))
  }
});
