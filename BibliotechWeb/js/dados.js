/*
 * dados.js – "banco de dados" provisório do front-end.
 *
 * Nesta etapa não existe back-end. Os dados ficam no localStorage do navegador
 * e as regras de negócio (estoque, multa de R$ 2,00 por dia) reproduzem as do
 * núcleo Java (módulo BibliotechRefatorado). Na próxima fase, este arquivo é
 * substituído por chamadas (fetch) aos servlets, sem mudar as páginas.
 */
const Dados = (() => {
  const CHAVE = "bibliotech.web.v1";
  const MULTA_POR_DIA = 2.0;
  const PRAZO_PADRAO_DIAS = 7;

  // ---------- datas (sempre texto AAAA-MM-DD, no fuso local) ----------
  const pad = (n) => String(n).padStart(2, "0");
  const paraTexto = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hoje = () => paraTexto(new Date());
  const somarDias = (texto, dias) => {
    const [a, m, d] = texto.split("-").map(Number);
    return paraTexto(new Date(a, m - 1, d + dias));
  };
  const diferencaDias = (inicio, fim) => {
    const [a1, m1, d1] = inicio.split("-").map(Number);
    const [a2, m2, d2] = fim.split("-").map(Number);
    return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
  };
  const formatarData = (texto) => (texto ? texto.split("-").reverse().join("/") : "");
  const formatarMoeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // ---------- regras ----------
  const diasAtraso = (dataPrevista, dataReferencia) => Math.max(0, diferencaDias(dataPrevista, dataReferencia));
  const calcularMulta = (dias) => Math.round(dias * MULTA_POR_DIA * 100) / 100;

  // ---------- persistência ----------
  function dadosIniciais() {
    const h = hoje();
    return {
      sequencia: { aluno: 6, livro: 7, funcionario: 3, emprestimo: 4, devolucao: 2 },
      usuario: { login: "admin", senha: "admin123" }, // só para demonstração do protótipo
      aluno: [
        { id: 1, nome: "Ana Beatriz Souza", matricula: "2024001", serie: "2º ano A", contato: "ana.souza@escola.com" },
        { id: 2, nome: "Bruno Henrique Lima", matricula: "2024002", serie: "2º ano B", contato: "(41) 99811-2233" },
        { id: 3, nome: "Carla Mendes", matricula: "2024003", serie: "3º ano A", contato: "carla.mendes@escola.com" },
        { id: 4, nome: "Diego Ferreira", matricula: "2024004", serie: "1º ano C", contato: "(41) 99777-4501" },
        { id: 5, nome: "Eduarda Ribeiro", matricula: "2024005", serie: "3º ano B", contato: "edu.ribeiro@escola.com" }
      ],
      funcionario: [
        { id: 1, nome: "Marta Oliveira", matricula: "F001", funcao: "Bibliotecária" },
        { id: 2, nome: "Paulo Nogueira", matricula: "F002", funcao: "Auxiliar de biblioteca" }
      ],
      // quantidade = exemplares disponíveis agora (já descontados os empréstimos em aberto)
      livro: [
        { id: 1, titulo: "Dom Casmurro", autor: "Machado de Assis", genero: "Romance", ano: 1899, quantidade: 3 },
        { id: 2, titulo: "Memórias Póstumas de Brás Cubas", autor: "Machado de Assis", genero: "Romance", ano: 1881, quantidade: 3 },
        { id: 3, titulo: "O Cortiço", autor: "Aluísio Azevedo", genero: "Romance", ano: 1890, quantidade: 2 },
        { id: 4, titulo: "Capitães da Areia", autor: "Jorge Amado", genero: "Romance", ano: 1937, quantidade: 4 },
        { id: 5, titulo: "Sapiens", autor: "Yuval Noah Harari", genero: "História", ano: 2011, quantidade: 1 },
        { id: 6, titulo: "O Pequeno Príncipe", autor: "Antoine de Saint-Exupéry", genero: "Infantil", ano: 1943, quantidade: 6 }
      ],
      emprestimo: [
        { id: 1, idAluno: 1, idFuncionario: 1, dataEmprestimo: somarDias(h, -12), dataPrevista: somarDias(h, -5), itens: [{ idLivro: 1, quantidade: 1 }] },
        { id: 2, idAluno: 3, idFuncionario: 2, dataEmprestimo: somarDias(h, -3), dataPrevista: somarDias(h, 4), itens: [{ idLivro: 4, quantidade: 1 }, { idLivro: 5, quantidade: 1 }] },
        { id: 3, idAluno: 2, idFuncionario: 1, dataEmprestimo: somarDias(h, -20), dataPrevista: somarDias(h, -13), itens: [{ idLivro: 6, quantidade: 1 }] }
      ],
      devolucao: [
        { id: 1, idEmprestimo: 3, dataDevolucao: somarDias(h, -11), diasAtraso: 2, multa: 4 }
      ]
    };
  }

  let estado;
  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) return JSON.parse(bruto);
    } catch (e) { /* armazenamento indisponível: usa dados em memória */ }
    return dadosIniciais();
  }
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* ignora */ }
  }
  estado = carregar();

  const copia = (x) => JSON.parse(JSON.stringify(x));
  const proximoId = (tipo) => estado.sequencia[tipo]++;

  // ---------- operações genéricas (aluno, livro, funcionario) ----------
  const listar = (tipo) => copia(estado[tipo]);
  const buscar = (tipo, id) => copia(estado[tipo].find((x) => x.id === Number(id)) || null);

  function salvarRegistro(tipo, registro) {
    const lista = estado[tipo];
    if (tipo !== "livro") {
      const repetida = lista.some((x) => x.matricula.toLowerCase() === registro.matricula.toLowerCase() && x.id !== registro.id);
      if (repetida) return { ok: false, erro: "Já existe um cadastro com essa matrícula.", campo: "matricula" };
    }
    if (registro.id) {
      const i = lista.findIndex((x) => x.id === registro.id);
      lista[i] = { ...registro };
    } else {
      lista.push({ ...registro, id: proximoId(tipo) });
    }
    salvar();
    return { ok: true };
  }

  function emUso(tipo, id) {
    const campo = { aluno: "idAluno", funcionario: "idFuncionario" }[tipo];
    if (campo) return estado.emprestimo.some((e) => e[campo] === id);
    return estado.emprestimo.some((e) => e.itens.some((i) => i.idLivro === id));
  }

  function excluirRegistro(tipo, id) {
    if (emUso(tipo, id)) return { ok: false, erro: "Este cadastro possui empréstimos e não pode ser excluído." };
    estado[tipo] = estado[tipo].filter((x) => x.id !== id);
    salvar();
    return { ok: true };
  }

  // ---------- empréstimos e devoluções ----------
  const devolvido = (idEmprestimo) => estado.devolucao.some((d) => d.idEmprestimo === idEmprestimo);

  function registrarEmprestimo({ idAluno, idFuncionario, dataPrevista, itens }) {
    const dataEmprestimo = hoje();
    if (!itens.length) return { ok: false, erro: "Adicione ao menos um livro ao empréstimo." };
    if (dataPrevista < dataEmprestimo) return { ok: false, erro: "A data prevista não pode ser anterior a hoje." };
    // valida tudo antes de gravar: o pedido é aceito por inteiro ou recusado por inteiro
    for (const item of itens) {
      const livro = estado.livro.find((l) => l.id === item.idLivro);
      if (!livro) return { ok: false, erro: "Livro não encontrado." };
      if (item.quantidade > livro.quantidade) {
        return { ok: false, erro: `Estoque insuficiente para "${livro.titulo}" (disponível: ${livro.quantidade}).` };
      }
    }
    itens.forEach((item) => { estado.livro.find((l) => l.id === item.idLivro).quantidade -= item.quantidade; });
    const emprestimo = { id: proximoId("emprestimo"), idAluno, idFuncionario, dataEmprestimo, dataPrevista, itens: copia(itens) };
    estado.emprestimo.push(emprestimo);
    salvar();
    return { ok: true, emprestimo: copia(emprestimo) };
  }

  function registrarDevolucao(idEmprestimo, dataDevolucao) {
    const emprestimo = estado.emprestimo.find((e) => e.id === idEmprestimo);
    if (!emprestimo) return { ok: false, erro: "Empréstimo não encontrado." };
    if (devolvido(idEmprestimo)) return { ok: false, erro: "Este empréstimo já foi devolvido." };
    if (dataDevolucao < emprestimo.dataEmprestimo) return { ok: false, erro: "A devolução não pode ser anterior ao empréstimo." };
    const dias = diasAtraso(emprestimo.dataPrevista, dataDevolucao);
    const devolucao = { id: proximoId("devolucao"), idEmprestimo, dataDevolucao, diasAtraso: dias, multa: calcularMulta(dias) };
    emprestimo.itens.forEach((item) => { estado.livro.find((l) => l.id === item.idLivro).quantidade += item.quantidade; });
    estado.devolucao.push(devolucao);
    salvar();
    return { ok: true, devolucao: copia(devolucao) };
  }

  const listarEmprestimos = () => copia(estado.emprestimo);
  const listarDevolucoes = () => copia(estado.devolucao);
  const pendentes = () => copia(estado.emprestimo.filter((e) => !devolvido(e.id)));

  // ---------- autenticação (demonstração) ----------
  const autenticar = (login, senha) => login === estado.usuario.login && senha === estado.usuario.senha;

  function restaurar() {
    estado = dadosIniciais();
    salvar();
  }

  return {
    MULTA_POR_DIA, PRAZO_PADRAO_DIAS,
    hoje, somarDias, diferencaDias, formatarData, formatarMoeda, diasAtraso, calcularMulta,
    listar, buscar, salvarRegistro, excluirRegistro,
    registrarEmprestimo, registrarDevolucao, listarEmprestimos, listarDevolucoes, pendentes,
    autenticar, restaurar
  };
})();
