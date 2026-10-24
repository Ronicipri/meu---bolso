# Relatório do revisor de celular, Meu Bolso (tela de 390 px)

Li `app/index.html`, `app/estilo.css` e `app/app.js` e imaginei a tela num celular de 390 px. Não alterei nenhum arquivo. Os contrastes foram calculados a partir das cores do CSS.

Nenhum problema impede o uso do app (nenhum de gravidade ALTA). A base está boa: campos e botões grandes, fonte de 16 px nos campos, teclado numérico no valor e frase na lista vazia.

| Item | O que está errado | Onde | Gravidade | Correção em uma frase |
|---|---|---|---|---|
| Contraste (botão principal) | O texto branco sobre o verde-água dos botões "Entrar", "Salvar gasto", "Enviar" e "Salvar" dá cerca de 2,6 para 1. O mínimo é 4,5 para 1, então o texto cansa a vista no sol. | `app/estilo.css`, linhas 95-96 (`.botao`) | MÉDIA | Usar um verde mais escuro como fundo do botão, mantendo o texto branco. |
| Contraste (texto cinza) | O cinza `#8a9a98` dá cerca de 2,9 para 1 sobre branco e 2,6 para 1 sobre o cartão verde claro. Isso afeta as frases de apoio, a data e a categoria de cada gasto, o botão "Apagar" e o valor quando o limite estoura. | `app/estilo.css`, linha 11 (`--cinza`), usada nas linhas 38, 153, 194 e 203 | MÉDIA | Trocar `--cinza` por um cinza mais escuro, perto de `#5f706e`. |
| Contraste (botão claro e links) | O verde escuro sobre verde claro ("Criar conta", "Foto do cupom") dá cerca de 3,6 para 1. O link "Sair" ou "Definir limite" dá cerca de 4,1 para 1 sobre branco. | `app/estilo.css`, linhas 102-105 e 111-119 | BAIXA | Escurecer um pouco `--agua-escura` (por exemplo `#1f6f66`). |
| Alvo de toque (Apagar) | O botão "Apagar" tem cerca de 32 px de altura, abaixo dos 44 px. Fica colado ao valor, então é fácil apagar a linha errada. | `app/estilo.css`, linhas 196-205; criado em `app/app.js`, linhas 273-278 | MÉDIA | Dar ao botão `min-height: 44px` e `min-width: 44px`, com mais espaço lateral. |
| Alvo de toque (links) | "Sair" e "Definir limite" / "Mudar limite" têm cerca de 38 px de altura. | `app/estilo.css`, linhas 111-119; `app/index.html`, linhas 38 e 48 | MÉDIA | Colocar `min-height: 44px` e `min-width: 44px` no `.botao-link`. |
| Tamanho do texto | A linha de detalhe de cada gasto e o texto do botão "Apagar" têm 0,85rem, ou 13,6 px, abaixo dos 14 px. | `app/estilo.css`, linhas 194 e 202 | MÉDIA | Subir os dois para `0.9rem` ou mais. |
| Rolagem para o lado (número grande) | O número grande tem 41,6 px e não quebra linha. Um valor alto, como R$ 12.345,67, pode passar da largura do cartão (cerca de 326 px úteis). | `app/estilo.css`, linhas 147-152 | BAIXA | Usar `font-size: clamp(1.8rem, 9vw, 2.6rem)` e `overflow-wrap: anywhere`. |
| Rolagem para o lado (data) | O campo de data fica ao lado da categoria e, em alguns celulares, ganha largura mínima própria e aperta ou estoura a linha. | `app/index.html`, linhas 76-85; `app/estilo.css`, linhas 63-71 e 78-83 | BAIXA | Acrescentar `min-width: 0` e `max-width: 100%` ao `input` e ao `select`, ou empilhar os campos abaixo de 400 px. |
| Erro ao carregar a lista | Se os gastos não carregarem, o aviso aparece lá embaixo, no cartão "Lançar à mão". Em cima continua R$ 0,00 e a lista mostra "Nenhum gasto lançado neste mês ainda", o que passa a ideia errada. | `app/app.js`, linhas 177-180; `app/index.html`, linhas 88 e 101 | MÉDIA | Mostrar o erro dentro do cartão "Gastos do mês" e esconder a frase de lista vazia quando houver erro. |
| Erro técnico na tela de entrada | Duas frases mandam desligar "Confirm email" no painel do Supabase, linguagem técnica e fora do alcance no celular. | `app/app.js`, linhas 31-32 e 154-157 | BAIXA | Trocar por uma frase simples como "Não foi possível confirmar o e-mail agora. Tente de novo mais tarde." |
| Erro do assistente | A mensagem do servidor (`corpo.erro`) é exibida sem checagem e pode vir técnica ou em inglês. | `app/app.js`, linhas 398-402 | BAIXA | Mostrar `corpo.erro` só se for frase em português; senão usar a frase padrão que já existe ali. |
| Erro de carregamento do app | Se o Supabase não carregar, o corpo da página vira uma frase solta, sem estilo e sem botão. | `app/app.js`, linhas 8-12 | BAIXA | Mostrar a frase num cartão com um botão "Recarregar". |
| Foco visível | Campos e selects têm contorno verde. Os botões usam o contorno padrão do navegador, que aparece, mas some sobre o botão verde. | `app/estilo.css`, linhas 73-76 | BAIXA | Acrescentar `:focus-visible` com contorno de 3px escuro para `.botao`, `.botao-link` e `.botao-apagar`. |
| Borda dos campos | A borda `#e4e9e8` é quase invisível sobre o cartão branco. | `app/estilo.css`, linhas 63-71 | BAIXA | Escurecer a borda dos campos para um cinza médio, como `#9fb0ad`. |

## O que já está certo

- Botões com cerca de 50 px e campos com cerca de 48 px de altura.
- `inputmode="decimal"` no valor do gasto e no limite do mês.
- A frase "Nenhum gasto lançado neste mês ainda." aparece quando não há gastos.
- Texto dos campos com 16 px, então não há zoom automático.
- Descrição longa é cortada com reticências e não alarga a tela.
- Erros comuns (login, rede, senha, limite) viram frases em português que dizem o que fazer.

## Os três itens que mais atrapalham

1. **Contraste baixo no texto cinza e no texto branco do botão verde** (cerca de 2,6 a 2,9 para 1). Dificulta a leitura ao ar livre. Basta trocar duas cores em `app/estilo.css` (`--cinza` e o fundo de `.botao`).
2. **Botão "Apagar" pequeno e colado ao valor (cerca de 32 px).** Dá para apagar o gasto errado sem querer. Aumentar o botão para 44 px em `app/estilo.css`.
3. **Textos com menos de 14 px e links com menos de 44 px de altura** (detalhe de cada gasto, "Sair", "Definir limite"). Aumentar fonte e área de toque em `app/estilo.css`.
