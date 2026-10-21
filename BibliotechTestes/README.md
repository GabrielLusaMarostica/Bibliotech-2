# BibliotechTestes – projeto de testes JUnit

Testes automatizados das regras de negócio do Bibliotech refatorado.

## Como executar

- **NetBeans:** *File → Open Project* → selecione esta pasta (`BibliotechTestes`) → botão direito → **Test** (Alt+F6).
- **Terminal:** `ant test` dentro desta pasta (requer o Ant com suporte a JUnit, que acompanha o NetBeans).

Os resultados ficam em `build/test/results`. Para executar o programa de verificação do `main()` (os 42 testes de funcionamento do projeto principal), use **Run** (F6) neste projeto.

## Como o projeto está montado

- `src.dir=../src`: o código do sistema (pasta `src` da raiz do repositório) é compilado junto, como *Source Packages*.
- `test/`: classes de teste, no mesmo pacote da classe testada (`bibliotech.model`, `bibliotech.servico`).
- `lib/`: JUnit 4.13.2 (EPL 1.0) e Hamcrest 2.2 (BSD 3-Clause).

## O que é testado

| Classe de teste | Foco |
|---|---|
| `MultaPorDiaFixoTest` | cálculo da multa e troca de estratégia (Strategy) |
| `CalculoDiasAtrasoTest` | cálculo de dias de atraso (mês, ano, ano bissexto) |
| `LivroTest` | regras de estoque (emprestar, devolver, estoque insuficiente) |
| `EmprestimoTest` | datas, itens duplicados, encapsulamento da lista |
| `EntidadesValidacaoTest` | validações de dados das entidades e de `Validacao` |
| `CodificadorSenhaPbkdf2Test` | hash de senha com sal |
| `EmprestimoServicoTest` | caso de uso de empréstimo (estoque, atomicidade, erros) |
| `DevolucaoServicoTest` | devolução, atraso, multa e retorno ao estoque |
| `AutenticacaoServicoTest` | login e cadastro de usuários |
| `AlunoServicoTest` | cadastro, atualização, exclusão e busca de alunos |

Funcionalidades que acessam o banco (classes `*Jdbc`) ficam de fora dos testes unitários e são verificadas pelo `main()` do projeto principal quando o banco está configurado.
