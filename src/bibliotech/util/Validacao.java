package bibliotech.util;

import bibliotech.excecao.RegraNegocioException;

/** Validações reutilizáveis pelas classes de modelo e de serviço. */
public final class Validacao {

    private Validacao() {
    }

    /** Exige texto não vazio e devolve o valor sem espaços nas pontas. */
    public static String obrigatorio(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            throw new RegraNegocioException("O campo '" + campo + "' é obrigatório.");
        }
        return valor.trim();
    }

    /** Texto opcional: nulo vira vazio e as pontas são aparadas. */
    public static String opcional(String valor) {
        return valor == null ? "" : valor.trim();
    }

    public static int positivo(int valor, String campo) {
        if (valor <= 0) {
            throw new RegraNegocioException("O campo '" + campo + "' deve ser maior que zero.");
        }
        return valor;
    }

    public static int naoNegativo(int valor, String campo) {
        if (valor < 0) {
            throw new RegraNegocioException("O campo '" + campo + "' não pode ser negativo.");
        }
        return valor;
    }

    public static <T> T naoNulo(T valor, String campo) {
        if (valor == null) {
            throw new RegraNegocioException("O campo '" + campo + "' é obrigatório.");
        }
        return valor;
    }
}
