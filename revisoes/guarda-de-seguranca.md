# Relatório do Guarda de Segurança — Meu Bolso

Examinei todos os arquivos do projeto, menos a pasta `.git`. Não achei chave secreta, senha escrita, token fixo nem dado pessoal real. Há dois pontos de gravidade MÉDIA e três de gravidade BAIXA, todos explicados na tabela.

| Arquivo | O que encontrou | Gravidade | O que fazer |
|---|---|---|---|
| `netlify/functions/assistente.mjs` (linha 8) | Chave pública do Supabase (`sb_publishable_...`) escrita no código. O lugar permitido é nas primeiras linhas das funções, e ela está na linha 8, logo no começo. | BAIXA | Nada a fazer. Está no lugar permitido. É uma chave pública, feita para ficar visível no app. |
| `app/configuracao.js` (linha 6) | Chave pública do Supabase e endereço do projeto. | BAIXA | Nada a fazer. É o arquivo onde ela deve ficar. |
| `netlify/functions/assistente.mjs` (linhas 59, 207) e `app/app.js` (linha 393) | A palavra `Bearer` aparece, mas o valor vem do login da pessoa (variável `token`), não de um texto fixo. | BAIXA | Nada a fazer. Não há token escrito no arquivo. |
| `app/index.html`, `app/app.js` | Palavras `senha` e `password` em campo de formulário e em mensagens de erro, sem nenhum valor escrito. | BAIXA | Nada a fazer. É só texto de ajuda e o campo de digitar. |
| `CLAUDE.md`, `BRIEFING.md` | Menção a "senha" nas regras do projeto, sem valor. | BAIXA | Nada a fazer. |
| `.gitignore` | Contém `.env`, `.netlify` e `node_modules`. | Nenhum problema | Nada a fazer. |
| `.claude/agents/guarda-de-seguranca.md` | Cita `sb_secret`, `service_role`, `AIza`, `eyJ` etc. apenas como termos de busca, sem nenhuma chave real. | BAIXA | Nada a fazer. |
| `netlify/functions/assistente.mjs` (linha 4) | A chave do Gemini é lida do servidor (`CHAVE_GEMINI`), não está escrita no arquivo. Isso é o correto. | Nenhum problema | Nada a fazer. |

Observações:
- Os arquivos `supabase/*.sql` e `netlify.toml` não têm segredos.
- O endereço do projeto Supabase (`https://rpttkdhqtcefkizpdnla.supabase.co`) aparece em `app/configuracao.js` e em `assistente.mjs`. Ele é público por natureza e não é segredo.
- Procurei e-mail, CPF, telefone e números longos. Não encontrei nenhum escrito nos arquivos.

**PODE ENVIAR**
