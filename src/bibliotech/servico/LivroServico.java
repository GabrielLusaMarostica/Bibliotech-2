package bibliotech.servico;

import bibliotech.excecao.RecursoNaoEncontradoException;
import bibliotech.model.Livro;
import bibliotech.repositorio.LivroRepositorio;
import bibliotech.util.Validacao;
import java.util.List;

/** Casos de uso do acervo de livros. */
public class LivroServico {

    private final LivroRepositorio livros;

    public LivroServico(LivroRepositorio livros) {
        this.livros = livros;
    }

    public Livro cadastrar(String titulo, String autor, String genero, int ano, int quantidade) {
        return livros.salvar(new Livro(titulo, autor, genero, ano, quantidade));
    }

    public Livro atualizar(int id, String titulo, String autor, String genero, int ano, int quantidade) {
        buscarPorId(id);
        return livros.salvar(new Livro(id, titulo, autor, genero, ano, quantidade));
    }

    public void excluir(int id) {
        buscarPorId(id);
        livros.excluir(id);
    }

    public Livro buscarPorId(int id) {
        return livros.buscarPorId(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Livro não encontrado: " + id));
    }

    public List<Livro> listar() {
        return livros.listar();
    }

    public List<Livro> buscarPorTitulo(String trecho) {
        return livros.buscarPorTitulo(Validacao.obrigatorio(trecho, "título"));
    }
}
