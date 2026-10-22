# BibliotechWeb – front-end (etapa 8)

Front-end do sistema web Bibliotech: HTML, CSS e JavaScript puros, sem back-end.
Os dados são **simulados** no navegador (`localStorage`) em `web/js/dados.js`; na próxima etapa esse arquivo
será trocado por chamadas ao servidor, e o restante das páginas continua igual.

## Como abrir
- **Direto no navegador:** abra `web/index.html` (login de demonstração: `admin` / `admin123`).
- **NetBeans:** *File → New Project → HTML5/JS → HTML5/JS Application with Existing Sources*, escolhendo a pasta `web/` como *Site Root*.
- Para reiniciar os dados de exemplo, limpe os dados do site no navegador (ou `Dados.reiniciar()` no console).

## Estrutura
```
web/
├── index.html            login
├── dashboard.html        painel com indicadores
├── alunos.html           cadastro de alunos
├── livros.html           cadastro de livros / estoque
├── funcionarios.html     cadastro de funcionários
├── emprestimo.html       novo empréstimo (vários livros)
├── pendentes.html        pendentes, devolução e cálculo da multa
├── css/estilo.css        estilo único (variáveis CSS, responsivo)
└── js/
    ├── dados.js          armazenamento simulado (substituível pelo back-end)
    ├── validacao.js      regras de validação reutilizáveis
    ├── app.js            menu, sessão simulada, avisos, utilitários
    ├── crud.js           lista + busca + formulário modal (alunos/livros/funcionários)
    └── login.js, alunos.js, livros.js, funcionarios.js, dashboard.js, emprestimo.js, pendentes.js
wireframes/               wireframes (SVG/PNG) e Wireframes_Bibliotech.pdf
prints/                   capturas das páginas implementadas
```

## Validações (JavaScript)
Espelham as regras do `model`/`servico` Java: campos obrigatórios, e-mail, matrícula (6–10 dígitos, única),
ISBN (10 ou 13 dígitos, único), quantidade inteira ≥ 0, data prevista ≥ hoje, quantidade ≤ estoque,
livro repetido no mesmo empréstimo, pedido recusado por inteiro, devolução duplicada, exclusão bloqueada
quando há empréstimo pendente. Multa de R$ 2,00 por dia de atraso, igual ao `MultaPorDiaFixo`.

## Acessibilidade e responsividade
Rótulos associados aos campos, mensagens com `role="alert"`, foco visível, navegação por teclado,
`<dialog>` nativo, estados com texto além de cor e layout adaptado a telas pequenas (menu recolhível).

> A autenticação do modo demonstração **não é segura** e existe só para navegar no protótipo.
> Login real, hash de senha e banco de dados virão no back-end.
