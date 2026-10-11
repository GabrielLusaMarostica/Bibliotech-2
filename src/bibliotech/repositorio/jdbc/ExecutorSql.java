package bibliotech.repositorio.jdbc;

import bibliotech.excecao.PersistenciaException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Concentra o "esqueleto" JDBC que estava copiado e colado em todos os DAOs:
 * abrir conexão, preparar o comando, executar, fechar recursos e tratar erro.
 * Os repositórios informam apenas o SQL, os parâmetros e como mapear a linha
 * (Template Method com funções).
 *
 * <p>Os métodos que recebem {@link Connection} participam de uma transação
 * aberta por {@link #emTransacao(OperacaoTransacional)}.</p>
 */
public class ExecutorSql {

    private final FabricaConexao fabrica;

    public ExecutorSql(FabricaConexao fabrica) {
        this.fabrica = fabrica;
    }

    // ---- operações com conexão própria ----------------------------------

    public int atualizar(String sql, ConfiguradorStatement cfg) {
        return executar(sql, c -> atualizar(c, sql, cfg));
    }

    /** Executa um INSERT e devolve o id gerado. */
    public int inserir(String sql, ConfiguradorStatement cfg) {
        return executar(sql, c -> inserir(c, sql, cfg));
    }

    public <T> List<T> consultar(String sql, ConfiguradorStatement cfg, MapeadorLinha<T> mapeador) {
        return executar(sql, c -> consultar(c, sql, cfg, mapeador));
    }

    public <T> Optional<T> consultarUm(String sql, ConfiguradorStatement cfg, MapeadorLinha<T> mapeador) {
        return consultar(sql, cfg, mapeador).stream().findFirst();
    }

    // ---- operações dentro de uma conexão/transação existente -------------

    public int atualizar(Connection c, String sql, ConfiguradorStatement cfg) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            cfg.configurar(ps);
            return ps.executeUpdate();
        }
    }

    public int inserir(Connection c, String sql, ConfiguradorStatement cfg) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            cfg.configurar(ps);
            ps.executeUpdate();
            try (ResultSet chaves = ps.getGeneratedKeys()) {
                if (chaves.next()) {
                    return chaves.getInt(1);
                }
            }
            throw new SQLException("O banco não devolveu a chave gerada.");
        }
    }

    public <T> List<T> consultar(Connection c, String sql, ConfiguradorStatement cfg,
                                 MapeadorLinha<T> mapeador) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            cfg.configurar(ps);
            try (ResultSet rs = ps.executeQuery()) {
                List<T> resultado = new ArrayList<>();
                while (rs.next()) {
                    resultado.add(mapeador.mapear(rs));
                }
                return resultado;
            }
        }
    }

    // ---- transação --------------------------------------------------------

    /** Executa a operação em uma transação: confirma se terminar bem, desfaz se falhar. */
    public <R> R emTransacao(OperacaoTransacional<R> operacao) {
        try (Connection c = fabrica.abrir()) {
            c.setAutoCommit(false);
            try {
                R resultado = operacao.executar(c);
                c.commit();
                return resultado;
            } catch (SQLException | RuntimeException e) {
                c.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new PersistenciaException("Erro de banco de dados: " + e.getMessage(), e);
        }
    }

    private <R> R executar(String sql, OperacaoTransacional<R> operacao) {
        try (Connection c = fabrica.abrir()) {
            return operacao.executar(c);
        } catch (SQLException e) {
            throw new PersistenciaException("Erro ao executar [" + sql + "]: " + e.getMessage(), e);
        }
    }
}
