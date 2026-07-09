// ============================================================
// entities.js - Entidades do jogo (jogador, inimigos, projéteis...)
// ============================================================

// --- Constantes de física (por "tick" de 1/60s) ---
const GRAVIDADE  = 0.7;
const FORCA_PULO = -14;
const VEL_BASE   = 3.6;   // velocidade horizontal base do jogador

// Resolve a colisão de uma entidade (x,y,w,h,vx,vy) contra as plataformas.
// Retorna true se a entidade está apoiada no chão.
function resolverColisao(ent, plataformas) {
  let noChao = false;

  // Movimento horizontal
  ent.x += ent.vx;
  for (const p of plataformas) {
    if (Utils.aabb(ent, p)) {
      if (ent.vx > 0) ent.x = p.x - ent.w;
      else if (ent.vx < 0) ent.x = p.x + p.w;
      ent.vx = 0;
    }
  }

  // Movimento vertical
  ent.y += ent.vy;
  for (const p of plataformas) {
    if (Utils.aabb(ent, p)) {
      if (ent.vy > 0) { ent.y = p.y - ent.h; noChao = true; }
      else if (ent.vy < 0) { ent.y = p.y + p.h; }
      ent.vy = 0;
    }
  }
  return noChao;
}

// ============================================================
// JOGADOR
// ============================================================
class Jogador {
  constructor(jogo, classeId) {
    this.jogo = jogo;
    this.classe = CLASSES[classeId];
    this.stats = new Stats(this.classe.stats);
    this.elemento = this.classe.elemento;
    this.arma = this.classe.arma;

    this.w = 28; this.h = 40;
    this.x = jogo.mundoLargura / 2 - this.w / 2;
    this.y = jogo.mundoAltura - 200;
    this.vx = 0; this.vy = 0;
    this.noChao = false;
    this.olharDir = 1; // 1 = direita, -1 = esquerda
    this.jaPulou = false;

    this.vida = this.stats.vidaMax;
    this.nivel = 1;
    this.xp = 0;
    this.xpProx = 4;

    this.cdAtaque = 0;      // tempo restante até o próximo ataque
    this.invuln = 0;        // i-frames após tomar dano
    this.tempoRegen = 0;    // acumulador para regeneração por segundo
    this.animPasso = 0;
    this.animT = 0;         // tempo total (animações ociosas)
    this.atacandoT = 0;     // duração da pose de ataque
    this.suspensoT = 0;         // preso no ar pelo redemoinho do Saci
    this.imuneRedemoinhoT = 0;  // graça após ser solto (evita prender sem parar)
    this.flutuarY = 0;          // deslocamento visual ao flutuar
    this.lendarios = 0;         // upgrades lendários pegos (brilho dourado)
  }

  // Bônus de dano da passiva "fúria" do Berserker (mais dano com pouca vida)
  bonusFuria() {
    if (this.classe.passiva !== 'furia') return 1;
    const faltando = 1 - this.vida / this.stats.vidaMax;
    return 1 + faltando * 0.8; // até +80% com 0 de vida
  }

  update(dt) {
    // --- Timers (valem nos dois estados) ---
    this.animT += dt;
    if (this.atacandoT > 0) this.atacandoT -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.cdAtaque > 0) this.cdAtaque -= dt;
    if (this.imuneRedemoinhoT > 0) this.imuneRedemoinhoT -= dt;

    if (this.suspensoT > 0) {
      // Preso no redemoinho do Saci: flutua parado, sem andar nem cair
      this.suspensoT -= dt;
      this.vx = 0; this.vy = 0;
      this.noChao = false;
      this.flutuarY = Math.sin(this.animT * 6) * 3;
      if (this.suspensoT <= 0) this.imuneRedemoinhoT = 1.6; // não gruda de novo na hora
    } else {
      this.flutuarY = 0;
      // --- Entrada horizontal ---
      const vel = VEL_BASE * this.stats.velMov;
      if (Input.esquerda()) { this.vx = -vel; this.olharDir = -1; }
      else if (Input.direita()) { this.vx = vel; this.olharDir = 1; }
      else this.vx = 0;

      // --- Pulo (com detecção de borda para não pular segurando a tecla) ---
      if (Input.pular()) {
        if (this.noChao && !this.jaPulou) { this.vy = FORCA_PULO; this.jaPulou = true; }
      } else {
        this.jaPulou = false;
      }

      // --- Gravidade ---
      this.vy += GRAVIDADE;
      if (this.vy > 18) this.vy = 18;

      this.noChao = resolverColisao(this, this.jogo.plataformas);

      // Limites do mundo
      this.x = Utils.clamp(this.x, 0, this.jogo.mundoLargura - this.w);
      if (this.y > this.jogo.mundoAltura + 200) { this.vida = 0; } // caiu no vazio

      if (Math.abs(this.vx) > 0.1 && this.noChao) this.animPasso += dt * 12;
    }

    // --- Regeneração ---
    if (this.stats.regen > 0 && this.vida > 0) {
      this.tempoRegen += dt;
      if (this.tempoRegen >= 1) {
        this.vida = Math.min(this.stats.vidaMax, this.vida + this.stats.regen);
        this.tempoRegen -= 1;
      }
    }

    // --- Ataque automático (continua mesmo preso no ar) ---
    if (this.cdAtaque <= 0) {
      const atacou = this.atacar();
      if (atacou) this.cdAtaque = 1 / this.stats.velAtaque;
    }
  }

  // Chamado pelo redemoinho do Saci: levanta o jogador e o segura no ar
  serSuspenso(dur) {
    if (this.suspensoT > 0 || this.imuneRedemoinhoT > 0 || this.vida <= 0) return;
    this.suspensoT = dur;
    this.y -= 42;            // "levanta" o jogador
    this.vx = 0; this.vy = 0;
    this.noChao = false;
  }

  atacar() {
    const alvo = this.jogo.inimigoMaisProximo(this.centroX(), this.centroY());
    if (!alvo) return false;

    const n = this.stats.projeteis;
    if (this.arma.tipo === 'projetil') {
      const ang0 = Math.atan2(alvo.centroY() - this.centroY(), alvo.centroX() - this.centroX());
      const spread = 0.18;
      for (let i = 0; i < n; i++) {
        const ang = ang0 + (i - (n - 1) / 2) * spread;
        this.jogo.projeteis.push(new Projetil(this.jogo, this, this.centroX(), this.centroY(), ang));
      }
    } else { // golpe(s) em área ao redor do jogador
      const raioBase = this.arma.alcanceBase * this.stats.alcance * this.stats.area;
      for (let i = 0; i < this.stats.golpes; i++) {
        // golpes extras batem num raio um pouco maior (mais alcance e mais dano)
        this.jogo.golpeArea(this, this.centroX(), this.centroY(), raioBase * (1 + i * 0.14));
      }
    }
    this.atacandoT = 0.18; // pose de ataque (braço estendido)
    return true;
  }

  receberDano(bruto, empurraoX) {
    if (this.invuln > 0 || this.vida <= 0) return;
    const dano = danoAposArmadura(bruto, this.stats.armadura);
    this.vida -= dano;
    this.invuln = 0.6;
    this.vx += empurraoX; this.vy = -4;
    this.jogo.adicionarTextoDano(this.centroX(), this.y, dano, false, '#ff6b6b');
    this.jogo.tremer(6); // tremor ao levar dano
    if (this.vida <= 0) { this.vida = 0; this.jogo.gameOver(); }
  }

  ganharXP(v) {
    this.xp += v;
    while (this.xp >= this.xpProx) {
      this.xp -= this.xpProx;
      this.nivel++;
      this.xpProx = Math.floor(4 + this.nivel * this.nivel * 0.8);
      this.jogo.subirNivel();
    }
  }

  centroX() { return this.x + this.w / 2; }
  centroY() { return this.y + this.h / 2; }

  render(ctx) {
    const cx = this.centroX(), cy = this.centroY();
    const el = ELEMENTOS[this.elemento];
    const raioAura = 26 + Math.min(22, (this.nivel - 1) * 1.0); // aura cresce com o nível
    ctx.save();
    if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) ctx.globalAlpha = 0.4;
    if (this.suspensoT > 0) ctx.translate(0, this.flutuarY); // flutua ao ser suspenso

    // Aura elemental
    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, raioAura);
    grad.addColorStop(0, el.cor + '88');
    grad.addColorStop(1, el.cor + '00');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, raioAura, 0, Math.PI * 2); ctx.fill();

    // Chamas quando o combo está alto
    const nc = this.jogo.nivelCombo ? this.jogo.nivelCombo() : 0;
    if (nc >= 3) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55;
      for (let i = 0; i < 5; i++) {
        const fx = cx + Math.cos(this.animT * 6 + i) * raioAura * 0.5;
        const fy = cy - 6 + Math.sin(this.animT * 10 + i) * 5;
        ctx.fillStyle = i % 2 ? '#ff6b3c' : '#ffd93c';
        ctx.beginPath(); ctx.arc(fx, fy, nc >= 5 ? 4 : 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // Redemoinho segurando o jogador (estado suspenso)
    if (this.suspensoT > 0) Sprites.redemoinhoPreso(ctx, cx, cy, this.animT, this.h);

    // Personagem desenhado (estilo cartum do folclore)
    Sprites.heroi(ctx, this);

    // Estrelinhas douradas por upgrade lendário
    if (this.lendarios > 0) {
      const n = Math.min(4, this.lendarios);
      ctx.fillStyle = '#ffd93c'; ctx.font = '12px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.9;
      for (let i = 0; i < n; i++) {
        const a = this.animT * 2 + i * (Math.PI * 2 / n);
        ctx.fillText('✦', cx + Math.cos(a) * (raioAura + 6), cy + Math.sin(a) * (raioAura + 6));
      }
    }
    ctx.restore();
  }
}

// ============================================================
// INIMIGO
// ============================================================
class Inimigo {
  constructor(jogo, cfg, x, y, escala) {
    this.jogo = jogo;
    this.cfg = cfg;
    this.boss = !!cfg.boss;
    this.elemento = cfg.elemento;
    this.icone = cfg.icone;
    this.cor = cfg.cor;
    this.nome = cfg.nome;

    const tam = cfg.tamanho * (this.boss ? 1 : 1);
    this.w = tam; this.h = tam;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.voa = !!cfg.voa;

    this.vidaMax = Math.round(cfg.vidaBase * escala);
    this.vida = this.vidaMax;
    this.danoContato = cfg.danoContato * (1 + (escala - 1) * 0.5);
    this.vel = cfg.vel;
    this.xpValor = cfg.xpValor;
    this.hitFlash = 0;
    this.morto = false;
    this.animT = Utils.rand(0, 10);   // fase da animação (dessincroniza a horda)
    this.atacandoT = 0;               // pose de ataque
    this.dir = 1;                     // lado para onde olha
    this.noChao = false;
    this.morrendo = false;            // animação de morte em curso
    this.tMorte = 0;
    this.temBolsa = cfg.sprite === 'urubu'; // urubu carrega sacola de dinheiro
    this.cdBolsa = Utils.rand(3, 5);

    // Comportamento (andarilho / voador / atirador / redemoinho)
    this.comportamento = cfg.comportamento || (this.voa ? 'voador' : 'andarilho');
    this.alcanceIdeal = cfg.alcanceIdeal || 240; // distância que o atirador tenta manter
    this.intervaloTiro = cfg.intervaloTiro || 3;
    this.cdTiro = Utils.rand(0.8, this.intervaloTiro);
  }

  update(dt) {
    this.animT += dt;
    if (this.atacandoT > 0) this.atacandoT -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Animação de morte: congela e desaparece tombando
    if (this.morrendo) {
      this.tMorte -= dt;
      if (this.tMorte <= 0) this.finalizarMorte();
      return;
    }

    const jog = this.jogo.jogador;
    const dx = jog.centroX() - this.centroX();
    const dy = jog.centroY() - this.centroY();
    this.dir = Math.sign(dx) || this.dir;

    if (this.voa) {
      if (this.cfg.sprite === 'urubu') {
        // Com a sacola: paira acima do jogador para bombardear; sem ela: mergulha nele
        this.cdBolsa -= dt;
        if (!this.temBolsa && this.cdBolsa <= 1) this.temBolsa = true; // "pegou" outra sacola
        const alvoY = this.temBolsa ? jog.centroY() - 140 : jog.centroY();
        const ax = jog.centroX() - this.centroX();
        const ay = alvoY - this.centroY();
        const d = Math.hypot(ax, ay) || 1;
        this.x += (ax / d) * this.vel;
        this.y += (ay / d) * this.vel + Math.sin(this.animT * 3) * 0.4; // balanço do voo
        if (this.temBolsa && this.cdBolsa <= 0 && Math.abs(dx) < 55 && dy > 60) {
          this.jogo.sacos.push(new SacoDinheiro(this.jogo, this.centroX(), this.y + this.h, this.danoContato));
          this.temBolsa = false;
          this.cdBolsa = Utils.rand(5, 7);
          this.atacandoT = 0.4;
        }
      } else {
        // Demais voadores perseguem diretamente
        const d = Math.hypot(dx, dy) || 1;
        this.x += (dx / d) * this.vel;
        this.y += (dy / d) * this.vel;
      }
    } else if (this.comportamento === 'atirador' || this.comportamento === 'redemoinho') {
      // Atiradores/lançadores: mantêm distância e disparam de longe
      const distX = Math.abs(dx);
      if (distX > this.alcanceIdeal) this.vx = Math.sign(dx) * this.vel;         // aproxima
      else if (distX < this.alcanceIdeal - 70) this.vx = -Math.sign(dx) * this.vel * 0.7; // recua
      else this.vx = 0;                                                          // posição de tiro
      this.vy += GRAVIDADE;
      if (this.vy > 18) this.vy = 18;
      this.noChao = resolverColisao(this, this.jogo.plataformas);
      this.cdTiro -= dt;
      if (this.cdTiro <= 0 && distX < this.alcanceIdeal + 160 && Math.abs(dy) < 260) {
        this.cdTiro = this.intervaloTiro;
        this.atacandoT = 0.45;
        if (this.comportamento === 'redemoinho') this.jogo.lancarRedemoinho(this);
        else this.jogo.lancarBala(this);
      }
    } else {
      // Andarilhos: perseguem no eixo X e sofrem gravidade
      this.vx = Math.sign(dx) * this.vel;
      this.vy += GRAVIDADE;
      if (this.vy > 18) this.vy = 18;
      this.noChao = resolverColisao(this, this.jogo.plataformas);
      // Pulo esporádico para subir plataformas quando o jogador está acima
      if (dy < -30 && this.vy === 0 && Utils.chance(0.02)) this.vy = FORCA_PULO * 0.8;
      // Pose de ataque quando chega perto do jogador
      if (Math.abs(dx) < 55 && Math.abs(dy) < 46 && this.atacandoT <= 0) this.atacandoT = 0.35;
    }
  }

  receberDano(res, elementoAtaque) {
    if (this.morrendo) return 0;
    const dano = danoAposArmadura(res.dano, 0);
    this.vida -= dano;
    this.hitFlash = 0.08;
    const el = ELEMENTOS[elementoAtaque];
    const cor = res.critico ? '#ffd93c' : (el ? (el.cor2 || el.cor) : '#ffffff');
    this.jogo.adicionarTextoDano(this.centroX(), this.y, dano, res.critico, cor);
    if (this.vida <= 0) this.morrer();
    return dano;
  }

  // Inicia a animação de morte (o corpo tomba e some)
  morrer() {
    this.morrendo = true;
    this.tMorte = this.boss ? 0.8 : 0.45;
  }

  finalizarMorte() {
    this.morto = true;
    if (this.boss) { this.jogo.tremer(12); this.jogo.hitStop = 0.12; } // impacto na morte do chefe
    // Partículas de morte
    for (let i = 0; i < (this.boss ? 24 : 8); i++) {
      this.jogo.particulas.push(new Particula(
        this.centroX(), this.centroY(),
        Utils.rand(-3, 3), Utils.rand(-4, 1),
        this.cor, Utils.rand(2, 5), Utils.rand(0.4, 0.9)));
    }
    // Solta XP
    const orbes = this.boss ? 8 : 1;
    for (let i = 0; i < orbes; i++) {
      this.jogo.xpOrbes.push(new XPOrb(this.jogo,
        this.centroX() + Utils.rand(-15, 15),
        this.centroY() + Utils.rand(-15, 15),
        Math.ceil(this.xpValor / orbes)));
    }
  }

  centroX() { return this.x + this.w / 2; }
  centroY() { return this.y + this.h / 2; }

  render(ctx) {
    const cx = this.centroX();
    ctx.save();
    // Fade + tombo durante a animação de morte
    if (this.morrendo) {
      const dur = this.boss ? 0.8 : 0.45;
      const p = 1 - this.tMorte / dur; // 0..1
      ctx.globalAlpha = Utils.clamp(1 - p, 0, 1);
      ctx.translate(cx, this.y + this.h);
      ctx.rotate(this.dir * p * Math.PI / 2);
      ctx.translate(-cx, -(this.y + this.h));
    }

    // Sprite conforme o tipo
    if (this.boss) Sprites.boss(ctx, this);
    else if (this.cfg.sprite === 'urubu') Sprites.urubu(ctx, this);
    else if (this.cfg.sprite === 'saci') Sprites.saci(ctx, this);
    else if (this.cfg.sprite === 'cangaceiro') Sprites.cangaceiro(ctx, this);
    else Sprites.gnomo(ctx, this);

    // Barra de vida (bosses e feridos)
    if (!this.morrendo && (this.boss || this.vida < this.vidaMax)) {
      const bw = this.w, bh = 4;
      ctx.fillStyle = '#000000aa';
      ctx.fillRect(this.x, this.y - 9, bw, bh);
      ctx.fillStyle = this.boss ? '#ff5a3c' : '#7CFC7C';
      ctx.fillRect(this.x, this.y - 9, bw * (this.vida / this.vidaMax), bh);
    }
    if (this.boss) {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui';
      ctx.fillText(this.nome, cx, this.y - 16);
    }
    ctx.restore();
  }
}

// ============================================================
// PROJÉTIL
// ============================================================
class Projetil {
  constructor(jogo, dono, x, y, ang) {
    this.jogo = jogo;
    this.dono = dono;
    this.elemento = dono.elemento;
    const vel = (dono.arma.velProj || 7);
    this.x = x; this.y = y;
    this.vx = Math.cos(ang) * vel;
    this.vy = Math.sin(ang) * vel;
    this.raio = 7 * dono.stats.area;
    this.pierce = dono.arma.pierce || 0;
    this.vida = 1.8; // segundos de tempo de vida
    this.atingidos = new Set();
    this.morto = false;
  }

  update(dt) {
    this.x += this.vx; this.y += this.vy;
    this.vida -= dt;
    if (this.vida <= 0 || this.x < -50 || this.x > this.jogo.mundoLargura + 50 ||
        this.y < -50 || this.y > this.jogo.mundoAltura + 50) this.morto = true;
  }

  render(ctx) {
    const el = ELEMENTOS[this.elemento];
    ctx.save();
    // Rastro do projétil
    ctx.strokeStyle = el.cor + '66'; ctx.lineWidth = this.raio * 1.2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x - this.vx * 2.5, this.y - this.vy * 2.5);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.shadowColor = el.cor; ctx.shadowBlur = 12;
    ctx.fillStyle = el.cor2 || el.cor;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ============================================================
// ORBE DE XP
// ============================================================
class XPOrb {
  constructor(jogo, x, y, valor) {
    this.jogo = jogo;
    this.x = x; this.y = y;
    this.valor = valor;
    this.raio = 5 + Math.min(6, valor);
    this.morto = false;
  }

  update(dt) {
    const jog = this.jogo.jogador;
    const d = Utils.dist(this.x, this.y, jog.centroX(), jog.centroY());
    if (d < jog.stats.magnetismo) {
      const dx = jog.centroX() - this.x, dy = jog.centroY() - this.y;
      const dd = Math.hypot(dx, dy) || 1;
      const puxo = Utils.lerp(6, 2, d / jog.stats.magnetismo);
      this.x += (dx / dd) * puxo; this.y += (dy / dd) * puxo;
    }
    if (d < 18) { jog.ganharXP(Math.max(1, Math.round(this.valor * this.jogo.comboMultXP()))); this.morto = true; }
  }

  render(ctx) {
    ctx.save();
    ctx.shadowColor = '#7CFC7C'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#9bff9b';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ============================================================
// SACOLA DE DINHEIRO (largada pelos urubus — causa dano ao cair)
// ============================================================
class SacoDinheiro {
  constructor(jogo, x, y, dano) {
    this.jogo = jogo;
    this.w = 18; this.h = 20;
    this.x = x - this.w / 2; this.y = y;
    this.vy = 1.5;
    this.dano = dano;
    this.rot = Utils.rand(0, Math.PI); // balanço da queda
    this.morto = false;
  }

  update(dt) {
    this.vy += GRAVIDADE * 0.55;
    this.y += this.vy;
    this.rot += dt * 3;

    // Atinge o jogador
    const jog = this.jogo.jogador;
    if (Utils.aabb(this, jog)) {
      jog.receberDano(this.dano, Math.sign(jog.centroX() - (this.x + this.w / 2)) * 2);
      return this.estourar();
    }
    // Estoura no chão/plataforma
    for (const p of this.jogo.plataformas) {
      if (Utils.aabb(this, p)) return this.estourar();
    }
    if (this.y > this.jogo.altura + 60) this.morto = true;
  }

  estourar() {
    // Explode em moedas
    for (let i = 0; i < 10; i++) {
      this.jogo.particulas.push(new Particula(
        this.x + this.w / 2, this.y + this.h / 2,
        Utils.rand(-2.5, 2.5), Utils.rand(-4, -1),
        Utils.chance(0.5) ? '#ffd93c' : '#f5b942',
        Utils.rand(2, 3.5), Utils.rand(0.4, 0.8)));
    }
    this.morto = true;
  }

  render(ctx) { Sprites.sacoDinheiro(ctx, this); }
}

// ============================================================
// PROJÉTEIS DOS INIMIGOS
//  - Redemoinho: lançado pelo Saci; suspende o jogador no ar
//  - BalaCangaceiro: tiro de espingarda dos cangaceiros (dano à distância)
// ============================================================
class Redemoinho {
  constructor(jogo, x, y, ang) {
    this.jogo = jogo; this.x = x; this.y = y;
    const v = 3.6;
    this.vx = Math.cos(ang) * v; this.vy = Math.sin(ang) * v;
    this.raio = 15; this.vida = 3.2; this.rot = 0; this.dur = 1.8; this.morto = false;
  }
  update(dt) {
    this.x += this.vx; this.y += this.vy; this.rot += dt * 9; this.vida -= dt;
    if (this.vida <= 0 || this.x < -60 || this.x > this.jogo.mundoLargura + 60 ||
        this.y < -60 || this.y > this.jogo.mundoAltura + 60) this.morto = true;
  }
  acertarJogador(j) { j.serSuspenso(this.dur); }
  render(ctx) { Sprites.redemoinho(ctx, this.x, this.y, this.rot, this.raio); }
}

class BalaCangaceiro {
  constructor(jogo, x, y, ang, dano) {
    this.jogo = jogo; this.x = x; this.y = y;
    const v = 7.5;
    this.vx = Math.cos(ang) * v; this.vy = Math.sin(ang) * v;
    this.raio = 5; this.vida = 2.5; this.dano = dano; this.morto = false;
  }
  update(dt) {
    this.x += this.vx; this.y += this.vy; this.vida -= dt;
    if (this.vida <= 0 || this.x < -60 || this.x > this.jogo.mundoLargura + 60 ||
        this.y < -60 || this.y > this.jogo.mundoAltura + 60) this.morto = true;
  }
  acertarJogador(j) { j.receberDano(this.dano, Math.sign(this.vx) * 3); }
  render(ctx) {
    ctx.save();
    ctx.strokeStyle = '#8a7a60'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x - this.vx * 1.6, this.y - this.vy * 1.6);
    ctx.lineTo(this.x, this.y); ctx.stroke();
    ctx.shadowColor = '#ff8a3c'; ctx.shadowBlur = 6; ctx.fillStyle = '#ffd36b';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ============================================================
// PARTÍCULA (efeitos visuais) e TEXTO DE DANO
// ============================================================
class Particula {
  constructor(x, y, vx, vy, cor, tam, vida) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.cor = cor; this.tam = tam; this.vida = vida; this.vidaMax = vida;
    this.morto = false;
  }
  update(dt) {
    this.x += this.vx; this.y += this.vy;
    this.vy += 0.15;
    this.vida -= dt;
    if (this.vida <= 0) this.morto = true;
  }
  render(ctx) {
    ctx.save();
    ctx.globalAlpha = Utils.clamp(this.vida / this.vidaMax, 0, 1);
    ctx.fillStyle = this.cor;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.tam, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// Anel expansivo (usado no golpe em área)
class Anel {
  constructor(x, y, raioMax, cor) {
    this.x = x; this.y = y; this.raio = raioMax * 0.3; this.raioMax = raioMax;
    this.cor = cor; this.vida = 0.3; this.vidaMax = 0.3; this.morto = false;
  }
  update(dt) {
    this.raio = Utils.lerp(this.raio, this.raioMax, 0.4);
    this.vida -= dt;
    if (this.vida <= 0) this.morto = true;
  }
  render(ctx) {
    ctx.save();
    ctx.globalAlpha = Utils.clamp(this.vida / this.vidaMax, 0, 1);
    ctx.strokeStyle = this.cor; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

class TextoDano {
  constructor(x, y, valor, critico, cor) {
    this.x = x + Utils.rand(-6, 6); this.y = y;
    this.valor = valor; this.critico = critico; this.cor = cor;
    this.vida = 0.8; this.vidaMax = 0.8; this.morto = false;
  }
  update(dt) {
    this.y -= 40 * dt; this.vida -= dt;
    if (this.vida <= 0) this.morto = true;
  }
  render(ctx) {
    const prog = 1 - this.vida / this.vidaMax; // 0..1
    const pop = prog < 0.25 ? Utils.lerp(this.critico ? 1.8 : 1.4, 1.0, prog / 0.25) : 1.0;
    const tam = (this.critico ? 20 : 14) * pop;
    ctx.save();
    ctx.globalAlpha = Utils.clamp(this.vida / this.vidaMax * 1.4, 0, 1);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${tam.toFixed(1)}px system-ui`;
    ctx.lineWidth = 3; ctx.strokeStyle = '#000000cc';
    ctx.strokeText(Math.round(this.valor), this.x, this.y);
    ctx.fillStyle = this.cor;
    ctx.fillText(Math.round(this.valor), this.x, this.y);
    ctx.restore();
  }
}
