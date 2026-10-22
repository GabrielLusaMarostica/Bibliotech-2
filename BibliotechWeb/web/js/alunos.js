if (App.iniciar()) {
  const R = Validacao.regras;
  Crud.iniciar({
    tipo: "alunos", seq: "aluno", singular: "Aluno", rotulo: "nome",
    colunas: [{ campo: "nome" }, { campo: "matricula" }, { campo: "email" }, { campo: "turma" }],
    esquema: {
      nome: [R.obrigatorio, R.minimo(3)],
      matricula: [R.obrigatorio, R.matricula],
      email: [R.obrigatorio, R.email],
      turma: [R.obrigatorio]
    },
    checarDuplicado: (d, id) => Dados.listar("alunos").some((a) => a.matricula === d.matricula && a.id !== id)
      ? "Já existe um aluno com essa matrícula." : null,
    checarExclusao: (a) => Dados.listar("emprestimos").some((e) => e.alunoId === a.id && !e.devolvido)
      ? "Este aluno tem empréstimo pendente e não pode ser excluído." : null
  });
}
