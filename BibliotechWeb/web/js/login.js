(() => {
  if (App.usuarioLogado()) { location.replace("dashboard.html"); return; }
  const form = document.getElementById("form-login");
  const R = Validacao.regras;
  const erroGeral = document.getElementById("erro-login");
  // Simulacao apenas para o front-end; no back-end a conferencia usa hash PBKDF2.
  const USUARIO_DEMO = { login: "admin", senha: "admin123" };

  Validacao.ligar(form, { login: [R.obrigatorio], senha: [R.obrigatorio, R.minimo(6)] }, () => {
    const login = form.login.value.trim();
    if (login === USUARIO_DEMO.login && form.senha.value === USUARIO_DEMO.senha) {
      App.entrar(login);
      location.href = "dashboard.html";
    } else {
      // mesma mensagem para usuario inexistente e senha errada (como no AutenticacaoServico)
      erroGeral.textContent = "Usuário ou senha inválidos.";
      form.senha.value = "";
      form.senha.focus();
    }
  });
  form.addEventListener("input", () => { erroGeral.textContent = ""; });

  const botao = document.getElementById("mostrar-senha");
  botao.addEventListener("click", () => {
    const visivel = form.senha.type === "text";
    form.senha.type = visivel ? "password" : "text";
    botao.textContent = visivel ? "Mostrar" : "Ocultar";
    botao.setAttribute("aria-pressed", String(!visivel));
  });
})();
