# Meu Bolso — briefing

Resultado da entrevista de oito perguntas, no formato CLARO.

## C — Contexto

- **App:** Meu Bolso, um app de gastos pessoais.
- **Quem usa:** só eu, no celular e no computador.
- **Onde lanço mais:** na mesa de casa, com calma, e não na correria do caixa ou do ônibus.
- **Sensação ao abrir:** calma.
- **Cores:** verde-água e branco, com detalhes em cinza-claro.

## L — Limites

- **No máximo 10 toques** para lançar um gasto, contando do app aberto até o gasto salvo.
- **Sem bronca:** quando eu passar do limite, o app avisa com calma. Nada de vermelho forte, alerta piscando ou frase que me faça sentir culpado. Isso é o que me faria abandonar o app na primeira semana.
- **O app nunca:**
  - pede, guarda ou mostra senha de banco, número de conta ou de cartão;
  - pergunta quanto eu ganho, devo ou tenho;
  - guarda a foto do cupom;
  - envia e-mail ou mensagem;
  - usa dado de outra pessoa.

## A — Ação

Uma tela só, de cima para baixo:

1. **Os primeiros cinco segundos:** em destaque, **quanto ainda posso gastar neste mês**. A conta é o limite que eu mesmo defino no app menos o que já gastei no mês. O limite é escolhido por mim e pode ser trocado quando eu quiser.
2. **Lançamento à mão:** valor, categoria, data (hoje já vem marcada) e uma descrição curta opcional. Botão de salvar.
3. **Lista do mês:** os gastos do mês atual, do mais recente para o mais antigo, com o total de cada categoria.
4. **Espaço do assistente:** um lugar reservado na tela, marcado como "chega na sexta". Na sexta ele vai lançar o gasto por uma frase escrita ou pela foto do cupom.

**Categorias, com os meus nomes:**

- Mercado
- Restaurante
- Divertimento
- Transporte
- Contas da casa
- Saúde
- Outros

## R — Resultado

Ao abrir o Meu Bolso, em até cinco segundos eu sei **quanto ainda posso gastar neste mês**, sem rolar a tela e sem tocar em nada. Se eu já passei do limite, vejo isso de forma tranquila, sem bronca.

## O — Observáveis

Cinco testes que provam que o app está pronto:

1. **Cinco segundos:** abro o app num celular de 390 px e o "quanto ainda posso gastar" aparece no topo, sem rolar a tela.
2. **Dez toques:** lanço um gasto de Mercado, do app aberto até o gasto salvo, e conto 10 toques ou menos.
3. **A conta fecha:** defino um limite, lanço três gastos e o valor do topo cai exatamente a soma dos três; a lista do mês mostra os três e o total de cada categoria bate.
4. **Sem bronca:** lanço gastos até passar do limite e a tela continua em verde-água, branco e cinza, com uma frase calma, sem vermelho e sem frase de culpa.
5. **Categorias certas:** abro a escolha de categoria e vejo exatamente as sete: Mercado, Restaurante, Divertimento, Transporte, Contas da casa, Saúde e Outros.
