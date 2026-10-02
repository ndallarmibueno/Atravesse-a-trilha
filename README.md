# Atravessem a Trilha: como colocar no ar e conduzir a aula

Jogo em grupo para 2 a 15 alunos. Cada aluno joga no próprio computador, sem login e sem digitar nome.
O professor projeta a tela de controle.

## Arquivos
- `server.js`: o servidor do jogo (precisa de Node.js 18 ou mais novo, sem instalar mais nada)
- `index.html`: a página usada por alunos e professor
- `package.json`: usado pela hospedagem
- `README.md`: este guia

## Para atualizar um jogo que já está no ar (Render + GitHub)
1. No GitHub, abra o repositório e clique em **Adicionar arquivo** e depois em **Fazer upload de arquivos**.
2. Arraste `server.js`, `index.html` e `README.md`. Os arquivos com o mesmo nome substituem os antigos.
3. Clique em **Confirmar alterações**. O Render atualiza sozinho em 1 ou 2 minutos.
4. Quando o Render mostrar "Your service is live", abra o jogo e clique em **Reiniciar tudo** na tela do professor.

## Colocar no ar pela primeira vez
**Opção A: no seu computador (só você abre).** Instale o Node.js e rode `PIN=minhasenha node server.js` na pasta. Abra `http://localhost:3000/#professor`.
Para os alunos na mesma rede, o endereço é `http://IP-DO-SEU-COMPUTADOR:3000`, mas a rede da escola pode bloquear.

**Opção B: link público no Render (recomendada).**
1. Crie uma conta no GitHub e um repositório **público** com os 4 arquivos (soltos, não o zip).
2. No Render, clique em "Deploy a Web Service", conecte o GitHub e escolha o repositório.
3. Configure: Build Command `npm install`, Start Command `node server.js`, instância Free.
4. Em "Environment", crie a variável `PIN` com a senha do professor. **Não deixe a senha padrão (`prof`).**
5. O Render mostra o endereço do jogo, algo como `https://seu-jogo.onrender.com`.

O plano gratuito costuma "dormir" sem uso. **Abra o link uns 10 minutos antes da aula.**
Teste o endereço num computador dos alunos antes do dia, porque a rede da escola pode bloquear.

## Na aula
- Você abre `SEU-LINK/#professor`, digita a senha e projeta essa tela.
- Alunos abrem `SEU-LINK` (sem nada depois) e escolhem um personagem.
- Quem entrar atrasado ainda pode escolher um personagem e começa do início.
- Seus botões mudam a cada fase: **Começar o jogo**, **Pular a vez**, **Abrir a votação**, **Encerrar a votação**, **Próxima rodada**.
- **Reiniciar tudo** apaga a partida. Use entre turmas.

## Como o jogo funciona
- A trilha tem 16 casas, com 5 armadilhas de 3 tipos. Quem cai volta para o início. A turma só vence quando **todos** chegam ao final.
- Cada aluno rola o próprio dado na sua vez. Se ele demorar, o dado rola sozinho após 15 segundos.
- O Jogo trapaceia de 4 formas. Cada uma tem uma regra que a desarma:

| Problema que a turma vive | Regra que resolve | Princípio |
|---|---|---|
| 🎲 **Dado viciado:** o Jogo mexe no dado e todo mundo tira o mesmo número, quase sempre o que leva a uma armadilha | Dado honesto para todo mundo | O jogo tem que ser justo e claro |
| 🎁 **Caixa Misteriosa:** você paga sem saber o que vem e perde | Fim das caixas-surpresa pagas | Sem sorteio pago para menores |
| ♾️ **Casa Sem Fim:** o botão de sair está escondido | Botão de parar sempre à vista | O jogo não pode te prender |
| 👤 **Casa do Estranho:** um desconhecido puxa conversa e pede informações | Perfil fechado desde o começo | A proteção já vem de fábrica |

- O jogo **não avisa** que o dado é viciado. A turma descobre no relatório da rodada: o gráfico mostra quantas vezes saiu cada número, e uma barra enorme num número só chama atenção.
- Depois de cada rodada, aparece o relatório (gráfico dos dados, quantas quedas e por quê, e o diário de cada jogada), e a turma conversa antes de votar.
- Aparecem 5 regras: 3 que resolvem problemas de verdade e 2 que não ajudam. A mais votada vale para todos.
- Quando uma regra boa entra, a tela mostra **o problema, o que muda no jogo e o princípio**. Depois, quem passa pela casa desarmada vê a mensagem "Regra em ação".
- Regra que não ajuda não muda nada, e a tela explica por quê.
- Se passar de 12 rodadas sem todos chegarem, o Jogo vence e você pode tentar de novo, mantendo as regras criadas.

## Tempo (estimativa de partidas simuladas)
- Com 8 alunos votando bem: cerca de 20 minutos de jogo, mais a conversa final.
- Com 15 alunos votando bem: cerca de 25 a 29 minutos de jogo, mais a conversa final.
- Votos em regras que não ajudam somam rodadas e minutos. Com 15 alunos, pode chegar perto de 35 minutos.
- Para encurtar, use `WAIT_SCALE` (por exemplo `0.7` deixa as pausas 30% menores). Dá para mudar também `FIN` (tamanho da trilha) e `MAXR` (limite de rodadas) no `server.js`, e `AUTO_MS` (tempo para o dado rolar sozinho).

## Cuidados
- Não há nome, conta ou dado pessoal dos alunos. O servidor guarda só o personagem e a posição, e apaga tudo ao reiniciar.
- Os trechos sobre o ECA Digital (Lei 15.211/2025) aparecem nas telas de resultado e na final. Confira se o texto combina com o que você quer apresentar.
