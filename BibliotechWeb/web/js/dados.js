/* Dados simulados guardados no navegador (localStorage).
   Na etapa de back-end este arquivo sera substituido por chamadas ao servidor. */
const Dados = (() => {
  const CHAVE = "bibliotech.dados.v1";
  const hoje = () => new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const somarDias = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  function inicial() {
    const h = hoje();
    return {
      seq: { aluno: 4, livro: 5, funcionario: 3, emprestimo: 3 },
      alunos: [
        { id: 1, nome: "Ana Beatriz Souza", matricula: "2024001", email: "ana.souza@escola.edu.br", turma: "3A" },
        { id: 2, nome: "Bruno Lima", matricula: "2024002", email: "bruno.lima@escola.edu.br", turma: "2B" },
        { id: 3, nome: "Carla Mendes", matricula: "2024003", email: "carla.mendes@escola.edu.br", turma: "1C" }
      ],
      livros: [
        { id: 1, titulo: "Dom Casmurro", autor: "Machado de Assis", isbn: "9788535911664", quantidade: 4 },
        { id: 2, titulo: "O Cortiço", autor: "Aluísio Azevedo", isbn: "9788508040704", quantidade: 1 },
        { id: 3, titulo: "Capitães da Areia", autor: "Jorge Amado", isbn: "9788535914061", quantidade: 3 },
        { id: 4, titulo: "Vidas Secas", autor: "Graciliano Ramos", isbn: "9788501015730", quantidade: 0 }
      ],
      funcionarios: [
        { id: 1, nome: "Marta Oliveira", cargo: "Bibliotecária", email: "marta@escola.edu.br" },
        { id: 2, nome: "Paulo Henrique", cargo: "Auxiliar", email: "paulo@escola.edu.br" }
      ],
      emprestimos: [
        { id: 1, alunoId: 1, funcionarioId: 1, data: iso(somarDias(h, -12)), prevista: iso(somarDias(h, -5)), itens: [{ livroId: 2, quantidade: 1 }], devolvido: false },
        { id: 2, alunoId: 2, funcionarioId: 1, data: iso(somarDias(h, -3)), prevista: iso(somarDias(h, 4)), itens: [{ livroId: 1, quantidade: 1 }, { livroId: 3, quantidade: 1 }], devolvido: false }
      ]
    };
  }

  function ler() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) return JSON.parse(bruto);
    } catch (e) { /* armazenamento indisponivel: segue com dados em memoria */ }
    return memoria || (memoria = inicial());
  }
  let memoria = null;
  function gravar(d) {
    memoria = d;
    try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) { /* ignora */ }
  }
  function proximoId(d, tipo) { return d.seq[tipo]++; }

  return {
    ler, gravar, proximoId, iso, somarDias,
    reiniciar() { gravar(inicial()); },
    listar(tipo) { return ler()[tipo]; },
    buscar(tipo, id) { return ler()[tipo].find((x) => x.id === id); },
    salvar(tipo, registro, tipoSeq) {
      const d = ler();
      if (registro.id) {
        const i = d[tipo].findIndex((x) => x.id === registro.id);
        d[tipo][i] = registro;
      } else {
        registro.id = proximoId(d, tipoSeq);
        d[tipo].push(registro);
      }
      gravar(d);
      return registro;
    },
    excluir(tipo, id) { const d = ler(); d[tipo] = d[tipo].filter((x) => x.id !== id); gravar(d); }
  };
})();
