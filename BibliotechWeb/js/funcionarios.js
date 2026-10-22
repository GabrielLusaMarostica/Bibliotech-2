/* funcionarios.js – configuração da tela de cadastro de funcionários */
Crud.iniciar({
  tipo: "funcionario", singular: "funcionário", Singular: "Funcionário", plural: "funcionários",
  ordenarPor: "nome",
  buscaEm: ["nome", "matricula", "funcao"],
  colunas: [{ campo: "nome" }, { campo: "matricula" }, { campo: "funcao" }],
  regras: {
    nome: Validacao.compor(Validacao.obrigatorio("o nome"), Validacao.tamanho("O nome", 3, 120), Validacao.nomeProprio),
    matricula: Validacao.compor(Validacao.obrigatorio("a matrícula"), Validacao.matricula),
    funcao: Validacao.tamanho("A função", 2, 60)
  }
});
