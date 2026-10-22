if (App.iniciar()) {
  const R = Validacao.regras;
  Crud.iniciar({
    tipo: "funcionarios", seq: "funcionario", singular: "Funcionário", rotulo: "nome",
    colunas: [{ campo: "nome" }, { campo: "cargo" }, { campo: "email" }],
    esquema: { nome: [R.obrigatorio, R.minimo(3)], cargo: [R.obrigatorio], email: [R.obrigatorio, R.email] },
    checarExclusao: (f) => Dados.listar("emprestimos").some((e) => e.funcionarioId === f.id)
      ? "Funcionário com empréstimos registrados não pode ser excluído." : null
  });
}
