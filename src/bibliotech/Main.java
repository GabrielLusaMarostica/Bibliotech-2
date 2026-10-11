package bibliotech;

import bibliotech.config.ContextoAplicacao;
import bibliotech.excecao.EstoqueInsuficienteException;
import bibliotech.excecao.RecursoNaoEncontradoException;
import bibliotech.excecao.RegraNegocioException;
import bibliotech.model.Aluno;
import bibliotech.model.Devolucao;
import bibliotech.model.Emprestimo;
import bibliotech.model.Funcionario;
import bibliotech.model.Livro;
import bibliotech.model.Usuario;
import bibliotech.repositorio.jdbc.ConfiguracaoBanco;
import bibliotech.servico.CodificadorSenhaPbkdf2;
import bibliotech.servico.DevolucaoServico;
import bibliotech.servico.MultaPorDiaFixo;
import bibliotech.servico.PoliticaMulta;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Ponto de entrada do projeto refatorado: executa os testes de funcionamento
 * dos casos de uso (aluno, livro, empréstimo, devolução com multa, login).
 *
 * <p>Os mesmos cenários rodam primeiro com repositórios em memória (não precisa
 * de banco) e, se a senha do banco estiver configurada
 * ({@code BIBLIOTECH_DB_PASSWORD}), também contra o MySQL via JDBC. Isso só é
 * possível porque os serviços dependem das interfaces de repositório, e não das
 * classes concretas.</p>
 *
 * <p>O programa termina com código 0 se todos os testes passarem e 1 se algum falhar.</p>
 */
public class Main {

    private static int total = 0;
    private static int falhas = 0;

    public static void main(String[] args) {
        System.out.println("=== BIBLIOTECH - testes dos casos de uso ===\n");

        System.out.println("--- Repositórios em memória ---");
        RelogioAjustavel relogioMemoria = new RelogioAjustavel(LocalDate.of(2026, 10, 1));
        ContextoAplicacao memoria = ContextoAplicacao.emMemoria(
                relogioMemoria, new CodificadorSenhaPbkdf2(1_000), new MultaPorDiaFixo());
        executarCenarios(memoria, relogioMemoria, "mem");

        System.out.println("\n--- Política de multa (Strategy) ---");
        testarPoliticasDeMulta();

        System.out.println("\n--- Banco de dados (JDBC) ---");
        if (ConfiguracaoBanco.estaConfigurado()) {
            RelogioAjustavel relogioJdbc = new RelogioAjustavel(LocalDate.of(2026, 10, 1));
            ContextoAplicacao jdbc = ContextoAplicacao.comJdbc(ConfiguracaoBanco.doAmbiente(),
                    relogioJdbc, new CodificadorSenhaPbkdf2(1_000), new MultaPorDiaFixo());
            executarCenarios(jdbc, relogioJdbc, "db" + System.nanoTime());
        } else {
            System.out.println("(ignorado: defina BIBLIOTECH_DB_PASSWORD para testar também contra o MySQL)");
        }

        System.out.println("\n=== Resultado: " + (total - falhas) + "/" + total + " verificações OK ===");
        System.exit(falhas == 0 ? 0 : 1);
    }

    // ------------------------------------------------------------------
    // Cenários (os mesmos para qualquer implementação de repositório)
    // ------------------------------------------------------------------

    private static void executarCenarios(ContextoAplicacao ctx, RelogioAjustavel relogio, String sufixo) {
        // ---- cadastros ----
        System.out.println("[Cadastros]");
        Aluno ana = ctx.alunos().cadastrar("Ana Souza", "A" + sufixo, "2º ano", "ana@escola.com");
        verificar("aluno cadastrado recebe id", ana.getId() > 0);
        verificarExcecao("aluno sem nome é rejeitado", RegraNegocioException.class,
                () -> ctx.alunos().cadastrar("   ", "X" + sufixo, "1º ano", ""));
        verificarExcecao("matrícula duplicada é rejeitada", RegraNegocioException.class,
                () -> ctx.alunos().cadastrar("Outra Pessoa", "A" + sufixo, "1º ano", ""));
        verificar("busca de aluno por trecho do nome", ctx.alunos().buscarPorNome("souza").size() >= 1);
        Aluno bruno = ctx.alunos().cadastrar("Bruno Lima", "B" + sufixo, "3º ano", "");
        ctx.alunos().atualizar(bruno.getId(), "Bruno Lima Jr.", "B" + sufixo, "3º ano", "11 99999-0000");
        verificar("aluno atualizado", ctx.alunos().buscarPorId(bruno.getId()).getNome().equals("Bruno Lima Jr."));
        ctx.alunos().excluir(bruno.getId());
        verificarExcecao("aluno excluído não é mais encontrado", RecursoNaoEncontradoException.class,
                () -> ctx.alunos().buscarPorId(bruno.getId()));

        Funcionario carlos = ctx.funcionarios().cadastrar("Carlos Lima", "F" + sufixo, "Bibliotecário");
        verificar("funcionário cadastrado (a tela antiga só imprimia a mensagem)", carlos.getId() > 0);
        verificar("funcionário aparece na listagem", ctx.funcionarios().listar().stream()
                .anyMatch(f -> f.getId() == carlos.getId()));

        Livro dom = ctx.livros().cadastrar("Dom Casmurro " + sufixo, "Machado de Assis", "Romance", 1899, 3);
        Livro vidas = ctx.livros().cadastrar("Vidas Secas " + sufixo, "Graciliano Ramos", "Romance", 1938, 1);
        verificar("livro cadastrado com estoque", dom.getId() > 0 && dom.getQuantidade() == 3);
        verificarExcecao("livro com quantidade negativa é rejeitado", RegraNegocioException.class,
                () -> ctx.livros().cadastrar("Inválido", "Autor", "X", 2000, -1));
        verificar("busca de livro por título", ctx.livros().buscarPorTitulo("dom casmurro " + sufixo).size() == 1);

        // ---- empréstimo ----
        System.out.println("[Empréstimo]");
        LocalDate hoje = LocalDate.now(relogio);
        Map<Integer, Integer> pedido = new LinkedHashMap<>();
        pedido.put(dom.getId(), 2);
        pedido.put(vidas.getId(), 1);
        Emprestimo emp = ctx.emprestimos().registrar(ana.getId(), carlos.getId(), hoje.plusDays(7), pedido);
        verificar("empréstimo registrado recebe id", emp.getId() > 0);
        verificar("empréstimo guarda os 2 itens", ctx.emprestimos().buscarPorId(emp.getId()).getItens().size() == 2);
        verificar("estoque de Dom Casmurro baixou de 3 para 1", estoque(ctx, dom) == 1);
        verificar("estoque de Vidas Secas baixou de 1 para 0", estoque(ctx, vidas) == 0);
        System.out.println(indentar(emp.resumo()));

        verificarExcecao("pedir mais do que há em estoque é rejeitado", EstoqueInsuficienteException.class,
                () -> ctx.emprestimos().registrar(ana.getId(), carlos.getId(), hoje.plusDays(7), Map.of(dom.getId(), 5)));
        verificar("estoque não muda após pedido recusado", estoque(ctx, dom) == 1);

        Map<Integer, Integer> misto = new LinkedHashMap<>();
        misto.put(dom.getId(), 1);      // há estoque
        misto.put(vidas.getId(), 1);    // não há mais
        verificarExcecao("pedido misto com um item sem estoque é recusado por inteiro", EstoqueInsuficienteException.class,
                () -> ctx.emprestimos().registrar(ana.getId(), carlos.getId(), hoje.plusDays(7), misto));
        verificar("item com estoque não foi baixado (operação atômica)", estoque(ctx, dom) == 1);

        verificarExcecao("data prevista anterior à data do empréstimo", RegraNegocioException.class,
                () -> ctx.emprestimos().registrar(ana.getId(), carlos.getId(), hoje.minusDays(1), Map.of(dom.getId(), 1)));
        verificarExcecao("empréstimo sem livros", RegraNegocioException.class,
                () -> ctx.emprestimos().registrar(ana.getId(), carlos.getId(), hoje.plusDays(7), Map.of()));
        verificarExcecao("aluno inexistente", RecursoNaoEncontradoException.class,
                () -> ctx.emprestimos().registrar(999_999, carlos.getId(), hoje.plusDays(7), Map.of(dom.getId(), 1)));
        verificar("empréstimo aparece como pendente", ctx.emprestimos().listarPendentes().stream()
                .anyMatch(e -> e.getId() == emp.getId()));

        // ---- devolução com atraso ----
        System.out.println("[Devolução]");
        relogio.avancarDias(10); // prazo era 7 dias => 3 dias de atraso
        Devolucao dev = ctx.devolucoes().registrar(emp.getId());
        verificar("atraso calculado em 3 dias (e não milhares, como na tela antiga)", dev.getDiasAtraso() == 3);
        verificar("multa de 3 dias a R$ 2,00 = R$ 6,00", dev.getMulta().compareTo(new BigDecimal("6.00")) == 0);
        verificar("estoque de Dom Casmurro voltou para 3", estoque(ctx, dom) == 3);
        verificar("estoque de Vidas Secas voltou para 1", estoque(ctx, vidas) == 1);
        verificarExcecao("devolver duas vezes o mesmo empréstimo", RegraNegocioException.class,
                () -> ctx.devolucoes().registrar(emp.getId()));
        verificarExcecao("devolver empréstimo inexistente", RecursoNaoEncontradoException.class,
                () -> ctx.devolucoes().registrar(999_999));
        verificar("empréstimo devolvido não é mais pendente", ctx.emprestimos().listarPendentes().stream()
                .noneMatch(e -> e.getId() == emp.getId()));

        // ---- devolução no prazo ----
        LocalDate dia = LocalDate.now(relogio);
        Emprestimo emp2 = ctx.emprestimos().registrar(ana.getId(), carlos.getId(), dia.plusDays(5), Map.of(vidas.getId(), 1));
        relogio.avancarDias(5); // devolve exatamente na data prevista
        Devolucao dev2 = ctx.devolucoes().registrar(emp2.getId());
        verificar("devolução no prazo: 0 dias de atraso", dev2.getDiasAtraso() == 0);
        verificar("devolução no prazo: multa zero", dev2.getMulta().signum() == 0);

        // ---- autenticação ----
        System.out.println("[Login]");
        String login = "gabriel" + sufixo;
        Usuario criado = ctx.autenticacao().cadastrar(login, "senha-segura-1");
        verificar("senha não é guardada em texto puro", !criado.getSenhaHash().contains("senha-segura-1"));
        verificar("login correto autentica", ctx.autenticacao().autenticar(login, "senha-segura-1").getLogin().equals(login));
        verificarExcecao("senha errada é recusada", RegraNegocioException.class,
                () -> ctx.autenticacao().autenticar(login, "senha-errada"));
        verificarExcecao("usuário inexistente é recusado", RegraNegocioException.class,
                () -> ctx.autenticacao().autenticar("ninguem" + sufixo, "qualquer"));
        verificarExcecao("senha curta não é aceita no cadastro", RegraNegocioException.class,
                () -> ctx.autenticacao().cadastrar("novo" + sufixo, "123"));
    }

    private static void testarPoliticasDeMulta() {
        verificar("R$ 0,50 por dia x 4 dias = R$ 2,00",
                new MultaPorDiaFixo(new BigDecimal("0.50")).calcular(4).compareTo(new BigDecimal("2.00")) == 0);
        verificar("sem atraso não há multa", new MultaPorDiaFixo().calcular(0).signum() == 0);
        PoliticaMulta comTeto = dias -> new BigDecimal("2.00").multiply(BigDecimal.valueOf(dias)).min(new BigDecimal("10.00"));
        verificar("nova política (com teto de R$ 10) plugada sem alterar o serviço",
                comTeto.calcular(30).compareTo(new BigDecimal("10.00")) == 0);
        verificar("cálculo de atraso: 2026-10-08 → 2026-10-11 = 3 dias",
                DevolucaoServico.calcularDiasAtraso(LocalDate.of(2026, 10, 8), LocalDate.of(2026, 10, 11)) == 3);
        verificar("cálculo de atraso nunca é negativo",
                DevolucaoServico.calcularDiasAtraso(LocalDate.of(2026, 10, 20), LocalDate.of(2026, 10, 11)) == 0);
    }

    // ------------------------------------------------------------------
    // Utilitários de teste
    // ------------------------------------------------------------------

    private static int estoque(ContextoAplicacao ctx, Livro livro) {
        return ctx.livros().buscarPorId(livro.getId()).getQuantidade();
    }

    private static String indentar(String texto) {
        return "      " + texto.replace("\n", "\n      ");
    }

    private static void verificar(String descricao, boolean condicao) {
        total++;
        if (condicao) {
            System.out.println("  [OK]    " + descricao);
        } else {
            falhas++;
            System.out.println("  [FALHA] " + descricao);
        }
    }

    private static void verificarExcecao(String descricao, Class<? extends RuntimeException> esperada, Runnable acao) {
        total++;
        try {
            acao.run();
            falhas++;
            System.out.println("  [FALHA] " + descricao + " (nenhuma exceção foi lançada)");
        } catch (RuntimeException e) {
            if (esperada.isInstance(e)) {
                System.out.println("  [OK]    " + descricao + "  → " + e.getMessage());
            } else {
                falhas++;
                System.out.println("  [FALHA] " + descricao + " (lançou " + e.getClass().getSimpleName()
                        + ": " + e.getMessage() + ")");
            }
        }
    }

    /** Relógio controlável pelo teste, para simular a passagem dos dias. */
    private static final class RelogioAjustavel extends Clock {

        private Instant agora;

        RelogioAjustavel(LocalDate inicio) {
            this.agora = inicio.atStartOfDay(ZoneOffset.UTC).toInstant();
        }

        void avancarDias(int dias) {
            agora = agora.plusSeconds(dias * 86_400L);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return agora;
        }
    }
}
