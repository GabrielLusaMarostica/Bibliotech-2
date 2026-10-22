/* alunos.js – configuração da tela de cadastro de alunos */
Crud.iniciar({
  tipo: "aluno", singular: "aluno", Singular: "Aluno", plural: "alunos",
  ordenarPor: "nome",
  buscaEm: ["nome", "matricula", "serie"],
  colunas: [{ campo: "nome" }, { campo: "matricula" }, { campo: "serie" }, { campo: "contato" }],
  regras: {
    nome: Validacao.compor(Validacao.obrigatorio("o nome"), Validacao.tamanho("O nome", 3, 120), Validacao.nomeProprio),
    matricula: Validacao.compor(Validacao.obrigatorio("a matrícula"), Validacao.matricula),
    serie: Validacao.tamanho("A série", 1, 30),
    contato: Validacao.contato
  }
});
