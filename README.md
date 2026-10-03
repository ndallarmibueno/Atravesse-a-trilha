# Atravessem a Trilha (ECA Digital): versão corredor

Jogo cooperativo para 7 a 15 alunos (11 a 14 anos), um computador por aluno, cerca de 30 a 40 minutos. Todos correm ao mesmo tempo, cada um com um truque do "Jogo" que torna a corrida injusta. A turma conversa, vota uma regra e o truque correspondente desaparece. No fim, todos precisam chegar juntos na corrida final.

## Como usar em aula

1. Abra o link do jogo uns 10 minutos antes (o plano gratuito do Render "dorme" e demora a acordar).
2. No seu computador, entre em `SEU-LINK/#professor` e digite a senha (variável `PIN` no Render; padrão `prof`, **troque**).
3. Os alunos abrem o link e escolhem um personagem. Já podem treinar na sala de espera.
4. Clique em **Começar a primeira rodada**. Controles do aluno: **espaço ou ↑** para pular, **↓** para abaixar (ou clicar para pular).
5. Cada rodada: corrida com truques (60 s) → relatório pessoal com o botão **Já li** → conversa em voz alta → **Abrir a votação** → **Encerrar a votação** → resultado → próxima rodada.
6. Quando os cinco truques forem removidos, vem a corrida final (cerca de 2 minutos, só pular e abaixar). A turma vence se todos chegarem.

Botões úteis: **Seguir para a conversa mesmo sem todos** (se alguém travar no "Já li"), **Pular para a corrida final** (se o tempo apertar) e **Reiniciar tudo**.

## Os cinco truques e as regras que os removem

| Truque | O que o aluno vive | Regra que remove |
|---|---|---|
| 🎁 Presente | O "prêmio" é armadilha; se desvia, vêm mais, até não dar para evitar | O jogo não pode enganar você |
| 📢 Anúncio | Um pop-up cobre a tela no meio do jogo, com um X minúsculo que foge | O jogo não pode atrapalhar quem está jogando |
| 🐻 Bicho gigante | Obstáculo grande demais para pular | O jogo tem que ser justo com todo mundo |
| 😎 "Amigo" | Fala coisas tentadoras e abre portas impossíveis de desviar | O jogo tem que proteger você de quem você não conhece |
| 🏁 Linha que foge | A chegada foge; depois o jogo acelera e enche a pista | O jogo não pode prender você |

Em cada votação aparecem 5 regras (até 3 corretas e o resto enganosas, como "pintar a pista"). Escolher uma regra enganosa não remove nada, e a explicação aparece no resultado. Os truques que sobram passam para outros alunos na rodada seguinte, e todo aluno sempre tem um truque.

## Atenção ao conteúdo

Os textos que ligam cada regra à lei estão em `content.js` (dentro do `index.html`, campo `k`). Confira com o texto da Lei 15.211/2025 antes da aula, principalmente os pontos sobre publicidade e sobre uso que "prende" o jogador, que são uma leitura de princípios e não citação literal.

## Atualizar no GitHub / Render

Envie para o repositório exatamente estes arquivos, com estes nomes (substituindo os antigos): `server.js`, `index.html`, `README.md`. O `package.json` não muda. O Render publica sozinho. Depois, nos computadores, aperte Ctrl+F5 e, no painel do professor, **Reiniciar tudo**.

## Variáveis opcionais no Render

- `PIN`: senha do professor.
- `RUN_MS`: duração da corrida com truques (padrão 60000).
- `CAP_MS`: limite da corrida final (padrão 240000).
- `COUNT_MS`: contagem regressiva (padrão 3500).

Rodar localmente: `node server.js` (Node 18+) e abra `http://localhost:3000`.
