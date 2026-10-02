# Atravessem a Trilha: como colocar no ar e conduzir a aula

Jogo em grupo para 2 a 15 alunos. Cada aluno joga no próprio computador, sem login e sem digitar nome.
O professor projeta a tela de controle.

## Arquivos
- `server.js`: o servidor do jogo (precisa de Node.js 18 ou mais novo, sem instalar mais nada)
- `index.html`: a página usada por alunos e professor
- `package.json`: usado pelo serviço de hospedagem

## Opção A: teste rápido no seu computador (10 minutos)
1. Instale o Node.js (nodejs.org), se ainda não tiver.
2. Abra um terminal na pasta e rode: `PIN=minhasenha node server.js` (no Windows, use `set PIN=minhasenha` e depois `node server.js`).
3. Abra `http://localhost:3000/#professor` no seu navegador. Funciona só no seu computador.
4. Para os alunos na mesma rede da escola, eles abrem `http://IP-DO-SEU-COMPUTADOR:3000`. A rede da escola pode bloquear isso, então teste antes.

## Opção B: link público no Render (recomendada para a aula)
O Render tem plano gratuito, mas pede uma conta e um repositório no GitHub. Se preferir, peça ao TI da escola.
1. Crie uma conta gratuita no GitHub e um repositório novo. Envie os 3 arquivos desta pasta.
2. Crie uma conta no Render (render.com) e conecte ao GitHub.
3. Em "New", escolha "Web Service" e selecione o repositório.
4. Configure: Build Command `npm install`, Start Command `node server.js`, instância gratuita (Free).
5. Em "Environment", adicione a variável `PIN` com a senha que você quiser. **Não deixe a senha padrão (`prof`).**
6. Clique em "Create Web Service" e espere ficar pronto. O Render mostra o endereço, algo como `https://seu-jogo.onrender.com`.
7. As telas e botões do Render mudam com o tempo. Se algum passo estiver diferente, siga a documentação do Render.

Importante:
- O plano gratuito costuma "dormir" sem uso, e o primeiro acesso pode levar cerca de 1 minuto. **Abra o link 10 minutos antes da aula.**
- O Glitch, que eu citei antes, encerrou a hospedagem em 2025. Não use.
- Teste o link num computador dos alunos antes do dia, porque a rede da escola pode bloquear o endereço.

## Na aula
- Você abre `SEU-LINK/#professor`, digita a senha e projeta essa tela.
- Alunos abrem `SEU-LINK` (sem nada depois) e escolhem um personagem.
- Quem entrar atrasado ainda pode escolher um personagem. Com o jogo já rodando, ele começa do início.
- Seus botões mudam a cada fase: **Começar o jogo**, **Pular a vez** (se um aluno travar), **Abrir a votação**, **Encerrar a votação**, **Próxima rodada**.
- O botão **Reiniciar tudo** apaga a partida. Use entre turmas.

## Como o jogo funciona
- A trilha tem 18 casas e 6 armadilhas de 4 tipos. Quem cai volta para o início. A turma só vence quando **todos** chegam ao final.
- Cada aluno rola o próprio dado na sua vez. Enquanto uma armadilha está ativa, o Jogo "vicia" o dado para puxar o jogador até ela.
- Depois de cada rodada, há conversa e votação. Aparecem 5 regras: 3 que protegem e 2 que não ajudam. A mais votada vale para todos.
- Regra que protege desarma um tipo de armadilha, em todas as casas dele. Regra que não ajuda não muda nada, e a tela explica por quê.
- Se passar de 12 rodadas sem todos chegarem, o Jogo vence e você pode tentar de novo mantendo as regras criadas.

## Tempo
Cada jogada leva cerca de 5 segundos. Com 15 alunos, uma rodada leva cerca de 1 minuto e meio, mais a conversa e a votação.
Para encurtar, mude no `server.js` o tamanho da trilha (`FIN` e as casas em `TP`) ou o limite de rodadas (`MAXR`). A pausa entre jogadas fica em `WAIT_MS`.

## Cuidados
- Não há nome, conta ou dado pessoal dos alunos. O servidor guarda só o personagem e a posição, e apaga tudo ao reiniciar.
- Os trechos sobre o ECA Digital (Lei 15.211/2025) aparecem na tela final. Confira se o texto combina com o que você quer apresentar.
