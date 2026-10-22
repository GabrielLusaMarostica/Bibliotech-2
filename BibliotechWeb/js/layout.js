/*
 * layout.js – monta o menu lateral em todas as páginas internas e protege o acesso.
 * Cada página declara <body data-pagina="alunos"> para marcar o item atual do menu.
 * A "sessão" é só do protótipo (sessionStorage); na fase web ela virá do servidor.
 */
(() => {
  const ITENS = [
    { id: "painel", rotulo: "Painel", href: "painel.html", icone: "▦" },
    { id: "emprestimo", rotulo: "Novo empréstimo", href: "emprestimo.html", icone: "➜" },
    { id: "devolucao", rotulo: "Devoluções", href: "devolucao.html", icone: "↩" },
    { id: "livros", rotulo: "Livros", href: "livros.html", icone: "▤" },
    { id: "alunos", rotulo: "Alunos", href: "alunos.html", icone: "☺" },
    { id: "funcionarios", rotulo: "Funcionários", href: "funcionarios.html", icone: "✎" }
  ];

  let usuario = null;
  try { usuario = sessionStorage.getItem("bibliotech.usuario"); } catch (e) { /* sem sessão */ }
  if (!usuario) {
    location.replace("index.html");
    return;
  }

  const atual = document.body.dataset.pagina;
  const links = ITENS.map((i) => `
    <li><a class="menu__link" href="${i.href}" ${i.id === atual ? 'aria-current="page"' : ""}>
      <span class="menu__icone" aria-hidden="true">${i.icone}</span>${i.rotulo}</a></li>`).join("");

  const menu = document.createElement("header");
  menu.className = "menu";
  menu.innerHTML = `
    <a class="menu__marca" href="painel.html"><span aria-hidden="true">❖</span> Biblio<span>tech</span></a>
    <button class="menu__toggle" type="button" aria-expanded="false" aria-controls="navegacao" aria-label="Abrir menu">☰</button>
    <div class="menu__navegacao" id="navegacao">
      <nav aria-label="Principal"><ul class="menu__lista">${links}</ul></nav>
      <div class="menu__rodape">
        <div class="menu__usuario">Logado como <strong></strong></div>
        <button type="button" class="btn btn--secundario btn--pequeno btn--bloco" id="sair">Sair</button>
      </div>
    </div>`;
  menu.querySelector("strong").textContent = usuario;

  const app = document.querySelector(".app");
  app.prepend(menu);

  // menu retrátil em telas pequenas
  const botao = menu.querySelector(".menu__toggle");
  const area = menu.querySelector(".menu__navegacao");
  botao.addEventListener("click", () => {
    const aberto = area.classList.toggle("aberto");
    botao.setAttribute("aria-expanded", String(aberto));
  });

  menu.querySelector("#sair").addEventListener("click", () => {
    try { sessionStorage.removeItem("bibliotech.usuario"); } catch (e) { /* ignora */ }
    location.href = "index.html";
  });
})();
