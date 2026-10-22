/* ui.js – pequenos componentes de interface: avisos, confirmação, escape de HTML */
const UI = (() => {
  const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

  function aviso(mensagem, tipo) {
    let area = document.getElementById("avisos");
    if (!area) {
      area = document.createElement("div");
      area.id = "avisos";
      area.className = "avisos";
      area.setAttribute("role", "status");
      area.setAttribute("aria-live", "polite");
      document.body.appendChild(area);
    }
    const item = document.createElement("div");
    item.className = "aviso" + (tipo === "erro" ? " aviso--erro" : "");
    item.textContent = mensagem;
    area.appendChild(item);
    setTimeout(() => item.remove(), 4500);
  }

  /** Abre o <dialog> de confirmação e devolve uma Promise<boolean>. */
  function confirmar({ titulo, mensagem, rotuloOk = "Confirmar", perigo = false }) {
    return new Promise((resolver) => {
      const dialogo = document.createElement("dialog");
      dialogo.innerHTML = `
        <h2>${escapar(titulo)}</h2>
        <p>${escapar(mensagem)}</p>
        <div class="acoes-form">
          <button type="button" class="btn ${perigo ? "btn--perigo" : ""}" data-ok>${escapar(rotuloOk)}</button>
          <button type="button" class="btn btn--secundario" data-cancelar>Cancelar</button>
        </div>`;
      document.body.appendChild(dialogo);
      const fechar = (resultado) => { dialogo.close(); dialogo.remove(); resolver(resultado); };
      dialogo.querySelector("[data-ok]").addEventListener("click", () => fechar(true));
      dialogo.querySelector("[data-cancelar]").addEventListener("click", () => fechar(false));
      dialogo.addEventListener("cancel", (e) => { e.preventDefault(); fechar(false); });
      dialogo.showModal();
      dialogo.querySelector("[data-cancelar]").focus();
    });
  }

  return { escapar, aviso, confirmar };
})();
