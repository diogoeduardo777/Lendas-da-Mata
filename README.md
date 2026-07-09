# 🌳 Lendas da Mata — Survivor Arena do Folclore Brasileiro

Um jogo **survivor arena 2D** (estilo *Vampire Survivors* com plataforma/pulo) ambientado
no folclore brasileiro. Sobreviva a hordas de criaturas encantadas, colete XP, suba de
nível e monte sua build de atributos e poderes elementais.

---

## ▶️ Como jogar

**Opção 1 — sem instalar nada:** dê duplo clique em `index.html` (abre no navegador).

**Opção 2 — com servidor local (Node):**
```bash
node server.js
# abra http://localhost:5178
```

**Controles (PC):** mover `← →` / `A D` · pular `↑` / `W` / `Espaço` · o **ataque é automático**
(mira no inimigo mais próximo). Ao subir de nível, escolha uma bênção com o mouse ou teclas `1 2 3`.

**No celular:** botões na tela aparecem automaticamente (setas + pular). Vire o aparelho na
**horizontal** para uma tela maior. Ataque continua automático.

---

## 🧠 Por que JavaScript + HTML5 Canvas?

| Critério | Motivo da escolha |
|---|---|
| **Zero instalação** | Roda em qualquer navegador; dá pra abrir o `index.html` direto (usei `<script>` clássico, sem build/bundler). |
| **Sem Python na máquina** | Descartei Pygame/Godot-Python — esta máquina não tem Python instalado. |
| **Familiaridade** | O stack do seu dia a dia já é JS/Node, então manutenção é natural. |
| **Ideal para 2D em tempo real** | O Canvas 2D desenha centenas de entidades (hordas) com folga. |
| **Portável e compartilhável** | Um dia dá pra hospedar como página estática, sem servidor. |

Arquitetura: JS puro (vanilla), sem dependências, dividido por responsabilidade
(um arquivo por sistema).

---

## 📂 Estrutura

```
index.html          # tela + ordem de carga dos scripts
server.js           # servidor estático opcional (Node puro, sem deps)
css/style.css       # menus, HUD e cartas
js/
  utils.js          # helpers (RNG, colisão AABB, formatação)
  input.js          # teclado
  elements.js       # 5 elementos + vantagens (fogo/água/terra/vento/trovão)
  stats.js          # modelo de atributos + matemática de combate
  classes.js        # 5 personagens jogáveis
  upgrades.js       # baralho de melhorias (bênçãos) por raridade
  sprites.js        # desenho procedural (heróis, gnomos, urubus)
  config.js         # configuração do ranking online (Supabase) — opcional
  ranking.js        # placar de abates (local + online)
  entities.js       # Jogador, Inimigo, Projétil, XP, partículas, física, câmera
  waves.js          # inimigos do folclore + diretor de ondas/chefes
  game.js           # estados, loop, colisões, câmera, HUD
  main.js           # inicialização
```

---

## ⚔️ O que já está no jogo (MVP jogável)

- **Foco em atributos:** dano, armadura (com retornos decrescentes), crítico (chance × multiplicador),
  roubo de vida, velocidade de ataque/movimento, área, alcance, projéteis, regeneração, sorte, magnetismo.
- **5 poderes elementais** com vantagens: 🔥 Fogo, 💧 Água, 🪨 Terra, 🌪️ Vento, ⚡ Trovão.
- **5 classes** com identidade própria:
  - 🛡️ **Guerreiro (Bandeirante)** — tanque, golpe em área, Terra.
  - 🔮 **Mago (Pajé)** — dano à distância, Fogo.
  - 🥷 **Ninja (Caçador)** — rápido e crítico, Vento.
  - 🧜‍♀️ **Encantadeira (Iara)** — roubo de vida/regeneração, Água.
  - 🐺 **Berserker (Lobisomem)** — mais dano quanto menos vida, Trovão.
- **Inimigos:** gnomos verdes de chapéu (comuns) e **Urubus do Mengão** que bombardeiam sacolas de dinheiro.
- **Chefes:** Boitatá (1:30), Mula-sem-cabeça (3:30), Mapinguari (6:00).
- **Ciclo survivor completo:** ondas crescentes → XP → subir de nível → escolher bênção → build.
- **Mapa grande com câmera** que segue o herói · **jogável no celular** · **ranking de abates**.

---

## 🌐 Publicar online (GitHub Pages) — grátis

O jogo é 100% estático, então roda direto no GitHub Pages:

1. Suba o código para o repositório (veja abaixo).
2. No GitHub: **Settings → Pages**.
3. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
4. Selecione a branch **`main`** e a pasta **`/ (root)`** e clique **Save**.
5. Aguarde ~1 min. O link será algo como `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Comandos para subir (rode dentro da pasta do jogo):
```bash
git add -A
git commit -m "Lendas da Mata: jogo completo"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git
git push -u origin main
```

---

## 🏆 Ranking online (opcional) — Supabase grátis

Sem configurar nada, o ranking já funciona **localmente** (por aparelho). Para o ranking
**global** (todos que jogam pelo link competindo juntos), use o Supabase (plano grátis):

1. Crie uma conta em [supabase.com](https://supabase.com) e um projeto novo.
2. No painel, abra **SQL Editor** e rode:
   ```sql
   create table ranking (
     id bigint generated always as identity primary key,
     nome text not null,
     classe text,
     abates int not null default 0,
     tempo int not null default 0,
     nivel int not null default 1,
     criado_em timestamptz not null default now()
   );
   alter table ranking enable row level security;
   -- Qualquer visitante pode ver e enviar pontuação
   create policy "ler ranking"    on ranking for select using (true);
   create policy "gravar ranking" on ranking for insert with check (true);
   ```
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.
4. Cole as duas em `js/config.js` (a chave `anon` é pública por design; pode ir pro repositório).
5. Faça commit/push. Pronto — o placar passa a ser compartilhado por todos.

---

## 🗺️ Ideias complementares (roadmap sugerido)

1. **Relíquias/amuletos passivos** (Figa, Patuá, Guaraná) equipáveis entre runs.
2. **Combos elementais visíveis** (água + trovão = corrente em área; fogo + vento = incêndio que espalha).
3. **Evolução de armas** — maximizar 2 upgrades funde numa arma "definitiva".
4. **Meta-progressão** — "Totem da Mata": moedas permanentes para desbloqueios.
5. **Biomas rotativos** — mata, sertão, pântano, praia, cada um com inimigos temáticos.
6. **Ciclo dia/noite** — criaturas mais fortes à noite.
7. **Sistema de maldição/bênção** — risco × recompensa a cada onda.
8. **Sprites/arte** e trilha regional (viola, berimbau) no lugar dos emojis atuais.
