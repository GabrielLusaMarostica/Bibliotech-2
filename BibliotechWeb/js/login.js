/* login.js – validação do formulário de login e abertura da sessão do protótipo */
(() => {
  const form = document.getElementById("form-login");
  const alerta = document.getElementById("alerta-login");
  const validarTudo = Validacao.ligar(form, {
    login: Validacao.compor(Validacao.obrigatorio("o usuário"), Validacao.tamanho("O usuário", 3, 50)),
    senha: Validacao.obrigatorio("a senha")
  });

  document.getElementById("mostrar-senha").addEventListener("change", (e) => {
    form.elements.senha.type = e.target.checked ? "text" : "password";
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    alerta.hidden = true;
    if (!validarTudo()) return;
    // mesma mensagem para usuário inexistente e senha errada (não revela qual dado falhou)
    if (!Dados.autenticar(form.elements.login.value.trim(), form.elements.senha.value)) {
      alerta.textContent = "Usuário ou senha inválidos.";
      alerta.hidden = false;
      form.elements.senha.value = "";
      form.elements.senha.focus();
      return;
    }
    try { sessionStorage.setItem("bibliotech.usuario", form.elements.login.value.trim()); } catch (e) { /* ignora */ }
    location.href = "painel.html";
  });
})();
