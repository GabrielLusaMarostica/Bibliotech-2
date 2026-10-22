/* Cadastro generico (lista + busca + formulario em janela modal) usado por
   alunos, livros e funcionarios. Cada pagina so informa a configuracao. */
const Crud = (() => {
  function iniciar(cfg) {
    const corpo = document.getElementById("corpo-tabela");
    const busca = document.getElementById("busca");
    const dialogo = document.getElementById("dialogo-form");
    const form = document.getElementById("form-cadastro");
    const titulo = document.getElementById("titulo-dialogo");
    const contador = document.getElementById("contador");
    let editandoId = null;

    function desenhar() {
      const termo = busca.value.trim().toLowerCase();
      const lista = Dados.listar(cfg.tipo).filter((r) =>
        cfg.colunas.some((c) => String(r[c.campo]).toLowerCase().includes(termo)));
      contador.textContent = `${lista.length} registro(s)`;
      if (lista.length === 0) {
        corpo.innerHTML = `<tr><td class="vazio" colspan="${cfg.colunas.length + 1}">Nenhum registro encontrado.</td></tr>`;
        return;
      }
      corpo.innerHTML = lista.map((r) =>
        `<tr>` + cfg.colunas.map((c) => `<td>${c.formato ? c.formato(r) : App.esc(r[c.campo])}</td>`).join("") +
        `<td class="acoes"><button class="botao secundario pequeno" data-acao="editar" data-id="${r.id}" aria-label="Editar ${App.esc(r[cfg.rotulo])}">Editar</button>
         <button class="botao perigo pequeno" data-acao="excluir" data-id="${r.id}" aria-label="Excluir ${App.esc(r[cfg.rotulo])}">Excluir</button></td></tr>`).join("");
    }

    function abrir(registro) {
      Validacao.limpar(form);
      editandoId = registro ? registro.id : null;
      titulo.textContent = (registro ? "Editar " : "Novo(a) ") + cfg.singular;
      Object.keys(cfg.esquema).forEach((id) => { form.querySelector("#" + id).value = registro ? registro[id] : ""; });
      dialogo.showModal();
      form.querySelector("input").focus();
    }

    Validacao.ligar(form, cfg.esquema, () => {
      const dados = {};
      Object.keys(cfg.esquema).forEach((id) => {
        const v = form.querySelector("#" + id).value.trim();
        dados[id] = cfg.numericos && cfg.numericos.includes(id) ? Number(v) : v;
      });
      const erro = cfg.checarDuplicado ? cfg.checarDuplicado(dados, editandoId) : null;
      if (erro) { App.aviso(erro, "erro"); return; }
      if (editandoId) dados.id = editandoId;
      Dados.salvar(cfg.tipo, dados, cfg.seq);
      dialogo.close();
      desenhar();
      App.aviso(cfg.singular + (editandoId ? " atualizado(a)." : " cadastrado(a)."));
    });

    document.getElementById("btn-novo").addEventListener("click", () => abrir(null));
    document.getElementById("btn-cancelar").addEventListener("click", () => dialogo.close());
    busca.addEventListener("input", desenhar);
    corpo.addEventListener("click", async (e) => {
      const b = e.target.closest("button[data-acao]"); if (!b) return;
      const id = Number(b.dataset.id);
      const reg = Dados.buscar(cfg.tipo, id);
      if (b.dataset.acao === "editar") abrir(reg);
      else if (await App.confirmar(`Excluir ${cfg.singular.toLowerCase()} "${reg[cfg.rotulo]}"?`)) {
        const bloqueio = cfg.checarExclusao ? cfg.checarExclusao(reg) : null;
        if (bloqueio) { App.aviso(bloqueio, "erro"); return; }
        Dados.excluir(cfg.tipo, id); desenhar(); App.aviso(cfg.singular + " excluído(a).");
      }
    });
    desenhar();
  }
  return { iniciar };
})();
