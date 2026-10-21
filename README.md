# Bibliotech – núcleo refatorado (preparação para a versão web)

Projeto Integrador (PI) – fase de refatoração do sistema **Bibliotech** (gerenciamento de biblioteca escolar).

O sistema desktop (Java Swing + MySQL) misturava telas, regras de negócio e acesso a banco. Este projeto reorganiza
esse código em camadas **sem nenhuma dependência de Swing**, para que a próxima fase (sistema web) reaproveite
`model`, `servico` e `repositorio` e troque apenas a interface.

Código original: <https://github.com/GabrielLusaMarostica/Bibliotech>

## Estrutura

```
src/bibliotech/
├── Main.java                 testes de funcionamento (ponto de entrada)
├── model/                    entidades de domínio e suas regras (Aluno, Livro, Emprestimo, Devolucao...)
├── excecao/                  RegraNegocioException, EstoqueInsuficienteException, PersistenciaException...
├── util/                     Validacao (validações reutilizáveis)
├── repositorio/              interfaces pequenas e segregadas (Leitura, Escrita, Exclusao + uma por entidade)
│   ├── memoria/              implementações em memória (testes e demonstrações)
│   └── jdbc/                 implementações MySQL/JDBC + ExecutorSql, FabricaConexao, ConfiguracaoBanco
├── servico/                  casos de uso (AlunoServico, EmprestimoServico, DevolucaoServico, AutenticacaoServico...)
│                             + PoliticaMulta (Strategy) e CodificadorSenha
└── config/                   ContextoAplicacao: monta repositórios e serviços (injeção de dependência)
banco/schema.sql              script de criação das tabelas (MySQL 8)
BibliotechTestes/             projeto NetBeans de testes JUnit (etapa 7)
docs/                         plano de testes
```

Fluxo de dependências: `Main/telas/servlets → servico → repositorio (interface) ← jdbc | memoria`, e todos usam `model`.

## Como executar

Requisitos: JDK 21 e NetBeans (ou Ant).

1. Abra a pasta no NetBeans (*File → Open Project*) e execute (**F6**), ou pelo terminal: `ant jar` e `java -jar dist/BibliotechRefatorado.jar`.
2. Sem configurar nada, o `main()` roda todos os testes com **repositórios em memória** (não precisa de banco).
3. Para rodar os mesmos testes contra o **MySQL**:
   1. Execute `banco/schema.sql` no MySQL.
   2. Adicione o driver *MySQL Connector/J* à biblioteca do projeto (*Libraries → Add JAR/Folder*).
   3. Informe a conexão por variáveis de ambiente (ou `-D` no `run.jvmargs` de `nbproject/private/private.properties`, que não vai para o Git):

   | Variável | Propriedade Java | Padrão |
   |---|---|---|
   | `BIBLIOTECH_DB_URL` | `bibliotech.db.url` | `jdbc:mysql://localhost:3306/bibliotech` |
   | `BIBLIOTECH_DB_USER` | `bibliotech.db.user` | `bibliotech` |
   | `BIBLIOTECH_DB_PASSWORD` | `bibliotech.db.password` | *(obrigatória)* |

> Os testes JDBC criam registros de teste com nomes únicos no banco configurado. Use um banco de desenvolvimento.

O programa termina com código de saída `0` se todas as verificações passarem e `1` caso contrário.

## O que mudou em relação ao desktop

| Antes (desktop) | Agora |
|---|---|
| Regras dentro dos botões das telas Swing | `servico/` (casos de uso) e `model/` (regras das entidades) |
| `DAO` com `catch (Exception) { System.out.println }` e `Connection` repetida | `repositorio/jdbc` com `ExecutorSql` e `PersistenciaException` |
| Senha do banco escrita em `Conexao.java` | `ConfiguracaoBanco` lê de variável de ambiente |
| Multa `diasAtraso * 2.0` fixa no construtor, atraso calculado a partir de 1970 | `PoliticaMulta` (Strategy) e `DevolucaoServico.calcularDiasAtraso` |
| Estoque baixado só em memória, nunca gravado | baixa/devolução de estoque na mesma transação do empréstimo/devolução |
| Login comparando senha em texto puro | `AutenticacaoServico` + `CodificadorSenhaPbkdf2` (hash com sal) |
| `double` para dinheiro, `java.util.Date` | `BigDecimal` e `java.time.LocalDate` |

Detalhes, justificativas e lista completa de code smells estão no relatório entregue junto com este projeto.

## Testes (etapa 7)

O repositório tem dois projetos NetBeans:

| Pasta | Projeto | Para que serve |
|---|---|---|
| `/` (raiz) | `BibliotechRefatorado` | código do sistema (model, repositório, serviço) e `Main` com testes de funcionamento |
| `BibliotechTestes/` | `BibliotechTestes` | testes unitários **JUnit 4** das regras de negócio |

O projeto de testes usa o código da raiz como *Source Packages* (`src.dir=../src`) e guarda os testes em `BibliotechTestes/test`. As bibliotecas JUnit 4.13.2 e Hamcrest 2.2 estão em `BibliotechTestes/lib`, então não é preciso instalar nada.

**Para executar no NetBeans:** abra a pasta `BibliotechTestes` (*File → Open Project*), clique com o botão direito no projeto e escolha **Test** (Alt+F6). Pelo terminal, dentro de `BibliotechTestes`: `ant test`.

Os testes não usam banco de dados: os serviços recebem repositórios em memória (injeção de dependência) e um relógio controlável, o que permite simular atrasos de devolução sem esperar dias. O plano de testes completo está em `docs/`.
