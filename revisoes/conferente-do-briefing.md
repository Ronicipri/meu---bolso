# Conferência do briefing — Meu Bolso

Li o `BRIEFING.md` e todos os arquivos de `app/`: `index.html`, `estilo.css`, `app.js`, `configuracao.js` e `manifest.webmanifest`. Não alterei nada. Os valores dos exemplos abaixo são inventados.

| Teste do briefing | Resultado | Motivo em uma linha |
|---|---|---|
| 1. Cinco segundos: o "quanto ainda posso gastar" aparece no topo, sem rolar, no celular de 390 px | SÓ DÁ PARA SABER ABRINDO O APP | O código põe esse cartão logo abaixo do título, antes de qualquer outro bloco, e o número é grande. Só vendo a tela para confirmar que cabe sem rolar. |
| 2. Dez toques: lançar um gasto de Mercado, do app aberto até o salvar | CUMPRE | Mercado já vem escolhido e a data já vem de hoje. Bastam cerca de 2 a 3 toques: campo do valor, digitar, "Salvar gasto". |
| 3. A conta fecha: definir limite, lançar três gastos, o topo cai a soma e os totais por categoria batem | SÓ DÁ PARA SABER ABRINDO O APP | A conta no código está certa (limite menos a soma dos gastos do mês, e a lista e as barras usam os mesmos gastos). Mas depende do banco e da internet. |
| 4. Sem bronca: passar do limite mantém verde-água, branco e cinza, com frase calma | CUMPRE | Ao passar, o número vira cinza e aparece "Tudo bem: no dia 1 o mês recomeça". Não existe vermelho nem animação piscando no estilo. |
| 5. Categorias certas: exatamente as sete na escolha | CUMPRE | A lista de escolha é montada direto de `configuracao.js`, que tem as sete categorias. |

**Categorias:** iguais ao briefing. Há sete, com os mesmos nomes e a mesma ordem: Mercado, Restaurante, Divertimento, Transporte, Contas da casa, Saúde e Outros.

## O que falta para o app ficar como o briefing pediu

1. Abrir o app num celular de 390 px e confirmar que o "quanto ainda posso gastar" aparece sem rolar a tela. É o teste 1, que o código sozinho não prova.
2. Fazer o teste da conta com valores inventados: definir um limite, lançar três gastos e conferir o topo, a lista e o total de cada categoria. É o teste 3, que depende do banco.
3. O limite é guardado só no aparelho (`localStorage`), não no banco. Como você usa celular e computador, cada um terá o seu limite e eles podem mostrar valores diferentes. O briefing não fala em sincronizar, mas vale decidir.
4. O espaço do assistente não está marcado como "chega na sexta". Ele já aparece funcionando, com campo de frase e botão de foto. Isso difere do briefing, que pedia só um lugar reservado. Provavelmente é intencional, porque o projeto já passou dessa etapa.
5. O briefing pede os gastos "do mais recente para o mais antigo" e "com o total de cada categoria" na lista do mês. O app mostra os totais em um cartão separado, "Por categoria", acima da lista. Atende ao teste, mas a lista em si não traz os totais.
6. Um gasto lançado com data de outro mês não entra na conta nem na lista do mês atual. Isso é coerente com o briefing, mas pode surpreender quem trocar a data.
