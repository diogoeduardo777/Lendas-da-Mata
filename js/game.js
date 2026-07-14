// ============================================================
// game.js - Orquestra o jogo: estados, loop, colisões, HUD
// ============================================================
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.largura = canvas.width;   // 960
    this.altura = canvas.height;   // 540

    // Mundo maior que a tela (a câmera segue o jogador)
    this.mundoLargura = 2800;
    this.mundoAltura = 900;
    const A = this.mundoAltura, L = this.mundoLargura;

    // Chão + plataformas flutuantes espalhadas pelo mapa
    this.plataformas = [
      { x: 0, y: A - 40, w: L, h: 40 },   // chão contínuo
      { x: 180,  y: A - 170, w: 190, h: 18 },
      { x: 520,  y: A - 280, w: 200, h: 18 },
      { x: 900,  y: A - 160, w: 220, h: 18 },
      { x: 1250, y: A - 300, w: 200, h: 18 },
      { x: 1600, y: A - 190, w: 220, h: 18 },
      { x: 1980, y: A - 300, w: 200, h: 18 },
      { x: 2300, y: A - 170, w: 220, h: 18 },
      { x: 700,  y: A - 450, w: 170, h: 18 },
      { x: 1150, y: A - 460, w: 180, h: 18 }
    ];

    // Cenário pré-gerado (estrelas na tela + árvores no mundo todo)
    this.estrelas = Array.from({ length: 46 }, () => ({
      x: Utils.rand(0, this.largura), y: Utils.rand(0, this.altura * 0.7),
      r: Utils.rand(0.6, 1.8), f: Utils.rand(0, Math.PI * 2)
    }));
    this.arvores = [];
    for (let x = -40; x < L + 40; x += Utils.rand(80, 150)) {
      this.arvores.push({ x, w: Utils.rand(70, 140), h: Utils.rand(120, 260), tom: Utils.chance(0.5) });
    }
    this.camera = { x: 0, y: 0 };

    this.estado = 'menu'; // menu | selecao | jogando | levelup | gameover
    this.resetarPartida();
    this.bindUI();
    this.lastTime = 0;
    this.acumulador = 0;
    this.PASSO = 1 / 60;
  }

  resetarPartida() {
    this.jogador = null;
    this.inimigos = [];
    this.projeteis = [];
    this.sacos = [];      // sacolas de dinheiro largadas pelos urubus
    this.projInimigos = []; // projéteis dos inimigos (redemoinho, bala)
    this.xpOrbes = [];
    this.particulas = [];
    this.aneis = [];
    this.textosDano = [];
    this.diretor = null;
    this.abates = 0;
    this.camera = { x: 0, y: 0 };
    this.combo = 0; this.comboTimer = 0; this.comboPulse = 0; // sequência de abates
    this.shake = 0;                    // intensidade do tremor de tela
    this.hitStop = 0; this.hitStopCd = 0; // micro-congelamento no impacto
    this.levelUpsPendentes = 0;
    this.tempoAnuncio = 0;
    this.textoAnuncio = '';
  }

  // ---------------- UI / DOM ----------------
  bindUI() {
    this.el = {
      menu: document.getElementById('tela-menu'),
      selecao: document.getElementById('tela-selecao'),
      levelup: document.getElementById('tela-levelup'),
      gameover: document.getElementById('tela-gameover'),
      cartas: document.getElementById('cartas-upgrade'),
      cartasClasse: document.getElementById('cartas-classe'),
      hud: document.getElementById('hud'),
      barraVida: document.getElementById('barra-vida'),
      textoVida: document.getElementById('texto-vida'),
      barraXP: document.getElementById('barra-xp'),
      nivel: document.getElementById('hud-nivel'),
      tempo: document.getElementById('hud-tempo'),
      abates: document.getElementById('hud-abates'),
      stats: document.getElementById('hud-stats'),
      anuncio: document.getElementById('anuncio'),
      goResumo: document.getElementById('go-resumo'),
      ranking: document.getElementById('tela-ranking'),
      controles: document.getElementById('controles-toque'),
      rankingLista: document.getElementById('ranking-lista'),
      rankingListaMenu: document.getElementById('ranking-lista-menu'),
      rankingFonte: document.getElementById('ranking-fonte'),
      goNome: document.getElementById('go-nome'),
      btnSalvar: document.getElementById('btn-salvar-score'),
      btnHab: document.getElementById('btn-habilidade')
    };

    document.getElementById('btn-jogar').onclick = () => this.abrirSelecao();
    document.getElementById('btn-reiniciar').onclick = () => this.abrirSelecao();
    document.getElementById('btn-ranking').onclick = () => this.abrirRanking();
    document.getElementById('btn-voltar-menu').onclick = () => this.abrirMenu();
    this.el.btnSalvar.onclick = () => this.salvarPontuacao();

    // Monta as cartas de seleção de classe
    this.el.cartasClasse.innerHTML = '';
    for (const id of CLASSES_ORDEM) {
      const c = CLASSES[id];
      const el = ELEMENTOS[c.elemento];
      const card = document.createElement('button');
      card.className = 'carta carta-classe';
      card.style.borderColor = c.cor;
      card.innerHTML = `
        <div class="carta-icone" style="background:${c.cor}22;color:${c.cor}">${c.icone}</div>
        <div class="carta-nome">${c.nome} <span class="alcunha">(${c.alcunha})</span></div>
        <div class="carta-elemento" style="color:${el.cor}">${el.icone} ${el.nome}</div>
        <div class="carta-desc">${c.descricao}</div>
        <div class="carta-hab">⚡ ${c.habilidade.nome}</div>`;
      card.onclick = () => this.iniciarPartida(id);
      this.el.cartasClasse.appendChild(card);
    }
  }

  mostrar(tela) {
    for (const t of ['menu', 'selecao', 'levelup', 'gameover', 'ranking']) {
      this.el[t].classList.toggle('escondido', t !== tela);
    }
    this.el.hud.classList.toggle('escondido', tela !== null);
    // Controles de toque aparecem só durante o jogo, em aparelhos com toque
    this.el.controles.classList.toggle('escondido', !(tela === null && Input.temToque));
  }

  abrirMenu() { this.estado = 'menu'; this.mostrar('menu'); }
  abrirSelecao() { this.estado = 'selecao'; this.mostrar('selecao'); }

  iniciarPartida(classeId) {
    this.resetarPartida();
    this.jogador = new Jogador(this, classeId);
    if (this.el.btnHab) this.el.btnHab.textContent = this.jogador.classe.habilidade.icone;
    this.diretor = new DiretorDeOndas(this);
    this.atualizarCamera();
    this.estado = 'jogando';
    this.mostrar(null);
  }

  // ---------------- Loop principal ----------------
  loop(t) {
    const dtReal = Math.min(0.05, (t - this.lastTime) / 1000 || 0);
    this.lastTime = t;

    if (this.estado === 'jogando') {
      if (this.hitStop > 0) {
        this.hitStop -= dtReal; // congela o mundo por um instante (hit-stop)
      } else {
        this.acumulador += dtReal;
        while (this.acumulador >= this.PASSO) {
          this.update(this.PASSO);
          this.acumulador -= this.PASSO;
        }
      }
    }
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    this.diretor.update(dt);
    this.jogador.update(dt);
    this.atualizarCamera();

    for (const e of this.inimigos) e.update(dt);
    for (const p of this.projeteis) p.update(dt);
    for (const s of this.sacos) s.update(dt);
    for (const pi of this.projInimigos) pi.update(dt);
    for (const o of this.xpOrbes) o.update(dt);
    for (const pt of this.particulas) pt.update(dt);
    for (const a of this.aneis) a.update(dt);
    for (const td of this.textosDano) td.update(dt);

    this.colisoes();

    // Remove entidades mortas (e recolhe inimigos que ficaram longe demais)
    const jx = this.jogador.centroX(), jy = this.jogador.centroY();
    this.inimigos = this.inimigos.filter(e => {
      if (e.morto) {
        this.abates++; this.combo++; this.comboTimer = 3; this.comboPulse = 1;
        if (this.jogador.axeAtivo <= 0) this.jogador.axe = Math.min(1, this.jogador.axe + 0.02);
        return false;
      }
      if (!e.boss && !e.morrendo && Utils.dist(e.centroX(), e.centroY(), jx, jy) > 1900) return false;
      return true;
    });
    this.projeteis = this.projeteis.filter(p => {
      if (p.morto) { if (p.explode) this.explosao(p.x, p.y, p.explodeRaio, p.elemento, p.explodeMult); return false; }
      return true;
    });
    this.sacos = this.sacos.filter(s => !s.morto);
    this.projInimigos = this.projInimigos.filter(p => !p.morto);
    this.xpOrbes = this.xpOrbes.filter(o => !o.morto);
    this.particulas = this.particulas.filter(p => !p.morto);
    this.aneis = this.aneis.filter(a => !a.morto);
    this.textosDano = this.textosDano.filter(t => !t.morto);

    if (this.tempoAnuncio > 0) this.tempoAnuncio -= dt;

    // Juice / combo — decaimento dos temporizadores
    if (this.shake > 0) { this.shake *= 0.85; if (this.shake < 0.2) this.shake = 0; }
    if (this.hitStopCd > 0) this.hitStopCd -= dt;
    if (this.comboPulse > 0) this.comboPulse = Math.max(0, this.comboPulse - dt * 3);
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }

    // Dispara a ultimate (Axé) automaticamente quando a barra enche
    if (this.jogador.axe >= 1 && this.jogador.axeAtivo <= 0) this.ativarAxe();
  }

  colisoes() {
    const jog = this.jogador;

    // Projéteis x inimigos
    for (const p of this.projeteis) {
      if (p.morto) continue;
      for (const e of this.inimigos) {
        if (e.morto || e.morrendo || p.atingidos.has(e)) continue;
        if (Utils.dist(p.x, p.y, e.centroX(), e.centroY()) < p.raio + e.w / 2) {
          this.acertar(e, p.elemento);
          p.atingidos.add(e);
          if (!p.explode) this.aplicarEfeitoAtaque(p.dono, e); // efeito da arma (splash/ricochete/lentidão)
          if (p.pierce-- <= 0) { p.morto = true; break; }
        }
      }
    }

    // Inimigos x jogador (dano de contato)
    for (const e of this.inimigos) {
      if (e.morto || e.morrendo) continue;
      if (Utils.aabb(jog, e)) {
        e.atacandoT = 0.4; // pose de ataque ao encostar
        const dir = Math.sign(jog.centroX() - e.centroX()) || 1;
        jog.receberDano(e.danoContato, dir * 3);
      }
    }

    // Projéteis dos inimigos x jogador (redemoinho do Saci, bala do cangaceiro)
    for (const pi of this.projInimigos) {
      if (pi.morto) continue;
      if (Utils.dist(pi.x, pi.y, jog.centroX(), jog.centroY()) < pi.raio + 14) {
        pi.acertarJogador(jog);
        pi.morto = true;
      }
    }
  }

  // Aplica um acerto de ataque do jogador em um inimigo (com crítico, afinidade, roubo de vida)
  acertar(inimigo, elemento, mult = 1) {
    const jog = this.jogador;
    const base = jog.stats.dano * jog.bonusFuria() * jog.buffDano * (1 + this.comboBonusDano()) * mult;
    const res = calcularDano(jog.stats, base, elemento, inimigo.elemento);
    const aplicado = inimigo.receberDano(res, elemento);
    if (res.critico) {
      this.tremer(3);
      if (this.hitStopCd <= 0) { this.hitStop = 0.03; this.hitStopCd = 0.16; } // punch no crítico (com throttle)
    }
    jog.curarRoubo(aplicado);                                    // roubo de vida (com teto por segundo)
    if (jog.axeAtivo <= 0) jog.axe = Math.min(1, jog.axe + aplicado * 0.0006); // enche o Axé
  }

  // Golpe em área ao redor do jogador (classes corpo a corpo)
  golpeArea(dono, x, y, raio) {
    this.aneis.push(new Anel(x, y, raio, ELEMENTOS[dono.elemento].cor));
    for (const e of this.inimigos) {
      if (e.morto || e.morrendo) continue;
      if (Utils.dist(x, y, e.centroX(), e.centroY()) < raio + e.w / 2) {
        this.acertar(e, dono.elemento);
        this.aplicarEfeitoAtaque(dono, e); // efeito da arma (empurrão/corrente)
      }
    }
  }

  // Saci lança um redemoinho em direção ao jogador (suspende-o no ar)
  lancarRedemoinho(inimigo) {
    const jog = this.jogador;
    const ang = Math.atan2(jog.centroY() - inimigo.centroY(), jog.centroX() - inimigo.centroX());
    this.projInimigos.push(new Redemoinho(this, inimigo.centroX(), inimigo.centroY(), ang));
  }

  // Cangaceiro dispara a espingarda (leque de pelotas) na direção do jogador
  lancarBala(inimigo) {
    const jog = this.jogador;
    const ang0 = Math.atan2(jog.centroY() - inimigo.centroY(), jog.centroX() - inimigo.centroX());
    const n = inimigo.cfg.pelotas || 2;
    for (let i = 0; i < n; i++) {
      const ang = ang0 + (i - (n - 1) / 2) * 0.13;
      this.projInimigos.push(new BalaCangaceiro(this, inimigo.centroX(), inimigo.centroY(), ang, inimigo.danoContato));
    }
  }

  // =============== Habilidades ativas (Fase 2) ===============
  // Guerreiro: onda de choque em volta que dá dano e atordoa
  habTremor(dono) {
    const raio = 150 * dono.stats.area;
    this.aneis.push(new Anel(dono.centroX(), dono.centroY(), raio, ELEMENTOS[dono.elemento].cor));
    this.tremer(9);
    for (const e of this.inimigos) {
      if (e.morto || e.morrendo) continue;
      if (Utils.dist(dono.centroX(), dono.centroY(), e.centroX(), e.centroY()) < raio + e.w / 2) {
        this.acertar(e, dono.elemento, 2.4);
        e.stunT = Math.max(e.stunT, 1.3);
      }
    }
  }

  // Mago: bola de fogo grande que atravessa e explode em área
  habBolaDeFogo(dono) {
    const alvo = this.inimigoMaisProximo(dono.centroX(), dono.centroY());
    const ang = alvo
      ? Math.atan2(alvo.centroY() - dono.centroY(), alvo.centroX() - dono.centroX())
      : (dono.olharDir > 0 ? 0 : Math.PI);
    const p = new Projetil(this, dono, dono.centroX(), dono.centroY(), ang);
    p.vx = Math.cos(ang) * 5; p.vy = Math.sin(ang) * 5;
    p.raio = 15 * dono.stats.area; p.pierce = 99; p.vida = 1.6;
    p.explode = true; p.explodeRaio = 95 * dono.stats.area; p.explodeMult = 2.2;
    this.projeteis.push(p);
  }

  // Iara: maré que empurra os inimigos e cura o jogador
  habMare(dono) {
    const raio = 155 * dono.stats.area;
    this.aneis.push(new Anel(dono.centroX(), dono.centroY(), raio, ELEMENTOS.agua.cor));
    for (const e of this.inimigos) {
      if (e.morto || e.morrendo) continue;
      if (Utils.dist(dono.centroX(), dono.centroY(), e.centroX(), e.centroY()) < raio + e.w / 2) {
        this.acertar(e, 'agua', 1.4);
        const a = Math.atan2(e.centroY() - dono.centroY(), e.centroX() - dono.centroX());
        e.x += Math.cos(a) * 70; e.y += Math.sin(a) * 35;
      }
    }
    dono.vida = Math.min(dono.stats.vidaMax, dono.vida + dono.stats.vidaMax * 0.2);
    this.tremer(4);
  }

  // Dano ao longo de um segmento (Piscar do Ninja)
  danoEmLinha(dono, x1, y1, x2, y2, raio, mult) {
    const passos = 8, atingidos = new Set();
    for (let i = 0; i <= passos; i++) {
      const px = Utils.lerp(x1, x2, i / passos), py = Utils.lerp(y1, y2, i / passos);
      for (const e of this.inimigos) {
        if (e.morto || e.morrendo || atingidos.has(e)) continue;
        if (Utils.dist(px, py, e.centroX(), e.centroY()) < raio + e.w / 2) {
          this.acertar(e, dono.elemento, mult); atingidos.add(e);
        }
      }
    }
  }

  // Explosão em área (bola de fogo, Axé)
  explosao(x, y, raio, elemento, mult, exceto) {
    this.aneis.push(new Anel(x, y, raio, ELEMENTOS[elemento].cor));
    for (const e of this.inimigos) {
      if (e.morto || e.morrendo || e === exceto) continue;
      if (Utils.dist(x, y, e.centroX(), e.centroY()) < raio + e.w / 2) this.acertar(e, elemento, mult);
    }
    for (let i = 0; i < 12; i++) {
      this.particulas.push(new Particula(x, y, Utils.rand(-4, 4), Utils.rand(-4, 4),
        ELEMENTOS[elemento].cor2 || ELEMENTOS[elemento].cor, Utils.rand(2, 5), Utils.rand(0.3, 0.7)));
    }
    this.tremer(6);
  }

  // Explosão leve (splash do Mago) — sem tremor, sem anel
  explosaoPequena(x, y, raio, elemento, mult, exceto) {
    for (const e of this.inimigos) {
      if (e.morto || e.morrendo || e === exceto) continue;
      if (Utils.dist(x, y, e.centroX(), e.centroY()) < raio + e.w / 2) this.acertar(e, elemento, mult);
    }
    for (let i = 0; i < 5; i++) {
      this.particulas.push(new Particula(x, y, Utils.rand(-2, 2), Utils.rand(-2, 2),
        ELEMENTOS[elemento].cor2 || ELEMENTOS[elemento].cor, Utils.rand(1.5, 3), Utils.rand(0.2, 0.4)));
    }
  }

  // Ativa a ultimate: invoca o padroeiro do elemento
  ativarAxe() {
    const jog = this.jogador;
    jog.axe = 0; jog.axeAtivo = 4; jog.axeTickCd = 0; jog.invencivelT = 4;
    this.tremer(14);
    this.anunciar(`✨ ${ELEMENTOS[jog.elemento].padroeiro} foi invocado!`);
  }

  // Inimigo mais próximo de (x,y), excluindo um alvo ou um conjunto
  inimigoProximoExceto(x, y, excluir, maxDist) {
    const ehSet = excluir instanceof Set;
    let melhor = null, menor = maxDist;
    for (const e of this.inimigos) {
      if (e.morto || e.morrendo) continue;
      if (ehSet ? excluir.has(e) : e === excluir) continue;
      const d = Utils.dist(x, y, e.centroX(), e.centroY());
      if (d < menor) { menor = d; melhor = e; }
    }
    return melhor;
  }

  // Faísca visual entre dois inimigos (corrente/ricochete)
  faisca(a, b, elemento) {
    const cor = ELEMENTOS[elemento].cor2 || ELEMENTOS[elemento].cor;
    for (let i = 0; i <= 4; i++) {
      this.particulas.push(new Particula(
        Utils.lerp(a.centroX(), b.centroX(), i / 4), Utils.lerp(a.centroY(), b.centroY(), i / 4),
        Utils.rand(-1, 1), Utils.rand(-1, 1), cor, 2.5, 0.25));
    }
  }

  // Efeito extra do ataque básico, por classe (empurrão, splash, ricochete, lentidão, corrente)
  aplicarEfeitoAtaque(dono, alvo) {
    const ef = dono.arma.efeito;
    if (!ef) return;
    if (ef === 'empurrao') {
      const a = Math.atan2(alvo.centroY() - dono.centroY(), alvo.centroX() - dono.centroX());
      alvo.x += Math.cos(a) * 26; alvo.y += Math.sin(a) * 12;
    } else if (ef === 'lentidao') {
      alvo.lentoT = Math.max(alvo.lentoT, 1.6);
    } else if (ef === 'splash') {
      this.explosaoPequena(alvo.centroX(), alvo.centroY(), 48 * dono.stats.area, dono.elemento, 0.5, alvo);
    } else if (ef === 'ricochete') {
      const prox = this.inimigoProximoExceto(alvo.centroX(), alvo.centroY(), alvo, 220);
      if (prox) { this.acertar(prox, dono.elemento, 0.6); this.faisca(alvo, prox, dono.elemento); }
    } else if (ef === 'corrente') {
      let origem = alvo; const ja = new Set([alvo]);
      for (let k = 0; k < 3; k++) {
        const prox = this.inimigoProximoExceto(origem.centroX(), origem.centroY(), ja, 180);
        if (!prox) break;
        this.acertar(prox, dono.elemento, 0.5); this.faisca(origem, prox, dono.elemento);
        ja.add(prox); origem = prox;
      }
    }
  }

  inimigoMaisProximo(x, y) {
    let melhor = null, menor = Infinity;
    for (const e of this.inimigos) {
      if (e.morto || e.morrendo) continue;
      const d = Utils.dist(x, y, e.centroX(), e.centroY());
      if (d < menor) { menor = d; melhor = e; }
    }
    return melhor;
  }

  adicionarTextoDano(x, y, valor, critico, cor) {
    this.textosDano.push(new TextoDano(x, y, valor, critico, cor));
  }

  anunciar(txt) {
    this.textoAnuncio = txt;
    this.tempoAnuncio = 3;
    this.el.anuncio.textContent = txt;
    this.el.anuncio.classList.remove('escondido');
    clearTimeout(this._anuncioTO);
    this._anuncioTO = setTimeout(() => this.el.anuncio.classList.add('escondido'), 3000);
  }

  // ---------------- Progressão ----------------
  subirNivel() {
    this.levelUpsPendentes++;
    if (this.estado === 'jogando') this.mostrarLevelUp();
  }

  mostrarLevelUp() {
    this.estado = 'levelup';
    this.mostrar('levelup');
    const opcoes = sortearUpgrades(this.jogador, 3);
    this.el.cartas.innerHTML = '';
    opcoes.forEach((u, i) => {
      const r = RARIDADES[u.raridade];
      const card = document.createElement('button');
      card.className = 'carta carta-upgrade';
      card.style.borderColor = r.cor;
      card.innerHTML = `
        <div class="carta-icone" style="background:${r.cor}22">${u.icone}</div>
        <div class="carta-raridade" style="color:${r.cor}">${r.nome}</div>
        <div class="carta-nome">${u.nome}</div>
        <div class="carta-desc">${u.desc}</div>
        <div class="carta-tecla">${i + 1}</div>`;
      card.onclick = () => this.escolherUpgrade(u);
      this.el.cartas.appendChild(card);
    });
    this._opcoesLevelUp = opcoes;
  }

  escolherUpgrade(u) {
    u.aplicar(this.jogador);
    if (u.raridade === 'lendario') this.jogador.lendarios = (this.jogador.lendarios || 0) + 1;
    this.levelUpsPendentes--;
    if (this.levelUpsPendentes > 0) {
      this.mostrarLevelUp(); // ainda há níveis pendentes
    } else {
      this.estado = 'jogando';
      this.mostrar(null);
    }
  }

  gameOver() {
    this.estado = 'gameover';
    const t = Utils.formatTempo(this.diretor.tempo);
    this.el.goResumo.innerHTML =
      `Sobreviveu <b>${t}</b> · Nível <b>${this.jogador.nivel}</b> · <b>${this.abates}</b> abates`;

    // Guarda a pontuação e prepara o formulário
    this.pontuacaoAtual = {
      classe: this.jogador.classe.nome,
      abates: this.abates,
      tempo: this.diretor.tempo,
      nivel: this.jogador.nivel
    };
    this.el.goNome.value = Ranking.lerNome();
    this.el.btnSalvar.disabled = false;
    this.el.btnSalvar.textContent = '💾 Salvar no ranking';
    this.mostrar('gameover');
    this.renderRankingLista(this.el.rankingLista, Ranking.lerLocal().slice(0, 5));
  }

  // Salva a pontuação da última partida (local + online, se configurado)
  async salvarPontuacao() {
    const nome = (this.el.goNome.value || '').trim() || 'Anônimo';
    Ranking.salvarNome(nome);
    this.el.btnSalvar.disabled = true;
    this.el.btnSalvar.textContent = 'Salvando…';
    const r = await Ranking.enviar({ nome, ...this.pontuacaoAtual });
    this.el.btnSalvar.textContent = r.online ? '✓ Enviado ao ranking global' : '✓ Salvo neste aparelho';
    const { lista } = await Ranking.listar(10);
    this.renderRankingLista(this.el.rankingLista, lista, nome);
  }

  async abrirRanking() {
    this.estado = 'ranking';
    this.mostrar('ranking');
    this.el.rankingListaMenu.innerHTML = '<li class="ranking-vazio">Carregando…</li>';
    const { fonte, lista } = await Ranking.listar(10);
    this.el.rankingFonte.textContent = fonte === 'online'
      ? '🌐 Ranking global — todos que jogam pelo link'
      : '📱 Ranking local — somente neste aparelho';
    this.renderRankingLista(this.el.rankingListaMenu, lista);
  }

  // Escapa texto para evitar injeção de HTML em nomes de jogadores
  escapar(s) {
    return String(s).replace(/[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  renderRankingLista(elemento, lista, destaque) {
    if (!lista || !lista.length) {
      elemento.innerHTML = '<li class="ranking-vazio">Ninguém no ranking ainda — seja o primeiro!</li>';
      return;
    }
    const medalhas = ['🥇', '🥈', '🥉'];
    elemento.innerHTML = lista.map((r, i) => {
      const pos = medalhas[i] || `${i + 1}º`;
      const dest = (destaque && r.nome === destaque) ? ' class="rk-destaque"' : '';
      return `<li${dest}>` +
        `<span class="rk-pos">${pos}</span>` +
        `<span class="rk-nome">${this.escapar(r.nome)}</span>` +
        `<span class="rk-classe">${this.escapar(r.classe)}</span>` +
        `<span class="rk-abates">☠ ${r.abates}</span></li>`;
    }).join('');
  }

  // Câmera segue o jogador, presa aos limites do mundo
  atualizarCamera() {
    if (!this.jogador) return;
    const alvoX = this.jogador.centroX() - this.largura / 2;
    const alvoY = this.jogador.centroY() - this.altura / 2;
    this.camera.x = Utils.clamp(alvoX, 0, Math.max(0, this.mundoLargura - this.largura));
    this.camera.y = Utils.clamp(alvoY, 0, Math.max(0, this.mundoAltura - this.altura));
  }

  // --- Juice / combo ---
  tremer(i) { this.shake = Math.max(this.shake, i); }
  nivelCombo() { return Math.min(5, Math.floor(this.combo / 10)); } // 0..5
  comboMultXP() { return 1 + this.nivelCombo() * 0.4; }             // até x3
  comboBonusDano() { return this.nivelCombo() * 0.05; }            // até +25%

  // ---------------- Render ----------------
  render() {
    const ctx = this.ctx;
    const t = performance.now() / 1000;
    const cam = this.camera;

    // --- Céu noturno (fixo na tela) ---
    const g = ctx.createLinearGradient(0, 0, 0, this.altura);
    g.addColorStop(0, '#0d1f2d');
    g.addColorStop(0.5, '#11291d');
    g.addColorStop(1, '#0a1710');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.largura, this.altura);

    // Estrelas piscando
    ctx.fillStyle = '#e8ffd8';
    for (const e of this.estrelas) {
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + e.f));
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Lua com halo e crateras
    const lg = ctx.createRadialGradient(this.largura - 90, 80, 10, this.largura - 90, 80, 90);
    lg.addColorStop(0, '#e8ffd8cc'); lg.addColorStop(0.4, '#e8ffd822'); lg.addColorStop(1, '#e8ffd800');
    ctx.fillStyle = lg; ctx.fillRect(this.largura - 190, -20, 200, 200);
    ctx.fillStyle = '#eef7dd';
    ctx.beginPath(); ctx.arc(this.largura - 90, 80, 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dcedc8';
    ctx.beginPath(); ctx.arc(this.largura - 100, 74, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.largura - 80, 90, 4, 0, Math.PI * 2); ctx.fill();

    // --- Mundo (deslocado pela câmera + tremor de tela) ---
    const sx = this.shake ? (Math.random() * 2 - 1) * this.shake : 0;
    const sy = this.shake ? (Math.random() * 2 - 1) * this.shake : 0;
    ctx.save();
    ctx.translate(-Math.round(cam.x) + sx, -Math.round(cam.y) + sy);

    // Silhuetas da mata ao fundo
    const ch = this.mundoAltura - 40;
    for (const a of this.arvores) {
      ctx.fillStyle = a.tom ? '#122a1b' : '#16331f';
      ctx.beginPath();
      ctx.moveTo(a.x - a.w / 2, ch);
      ctx.quadraticCurveTo(a.x, ch - a.h * 1.35, a.x + a.w / 2, ch);
      ctx.fill();
    }

    // Plataformas (terra com capim)
    for (const p of this.plataformas) {
      ctx.fillStyle = '#243b2a';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#3f6647';
      ctx.fillRect(p.x, p.y, p.w, 6);
      ctx.strokeStyle = '#5c9a63'; ctx.lineWidth = 2;
      for (let x = p.x + 8; x < p.x + p.w - 4; x += 26) {
        ctx.beginPath();
        ctx.moveTo(x, p.y); ctx.lineTo(x - 3, p.y - 6);
        ctx.moveTo(x + 4, p.y); ctx.lineTo(x + 5, p.y - 7);
        ctx.stroke();
      }
    }

    if (this.jogador) {
      for (const o of this.xpOrbes) o.render(ctx);
      for (const a of this.aneis) a.render(ctx);
      for (const e of this.inimigos) e.render(ctx);
      for (const s of this.sacos) s.render(ctx);
      for (const pi of this.projInimigos) pi.render(ctx);
      for (const p of this.projeteis) p.render(ctx);
      this.jogador.render(ctx);
      for (const pt of this.particulas) pt.render(ctx);
      for (const td of this.textosDano) td.render(ctx);
    }
    ctx.restore();

    // Vaga-lumes (ambiente, na frente do mundo)
    ctx.fillStyle = '#d8ff8a';
    for (let i = 0; i < 12; i++) {
      const fx = (i * 173 % this.largura) + Math.sin(t * 0.7 + i * 2.1) * 26;
      const fy = this.altura - 90 - (i * 67 % 260) + Math.cos(t * 0.9 + i) * 14;
      ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 1.6 + i * 1.7));
      ctx.beginPath(); ctx.arc(fx, fy, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Combo de abates em destaque (killstreak)
    if (this.jogador && this.combo >= 5) {
      const nc = this.nivelCombo();
      const cores = ['#ffffff', '#ffe08a', '#ffc14d', '#ff9a3c', '#ff6b3c', '#ff3c3c'];
      const escala = 1 + this.comboPulse * 0.4 + nc * 0.05;
      ctx.save();
      ctx.translate(this.largura / 2, 56);
      ctx.scale(escala, escala);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 26px system-ui';
      ctx.lineWidth = 4; ctx.strokeStyle = '#000000aa';
      ctx.strokeText('COMBO x' + this.combo, 0, 0);
      ctx.fillStyle = cores[nc];
      ctx.fillText('COMBO x' + this.combo, 0, 0);
      ctx.font = 'bold 11px system-ui'; ctx.fillStyle = '#e6f2e6';
      ctx.fillText(`+${Math.round(this.comboBonusDano() * 100)}% dano · x${this.comboMultXP().toFixed(1)} XP`, 0, 17);
      ctx.restore();
    }

    // Barra de Axé (ultimate) + ícone da habilidade — rodapé
    if (this.jogador) {
      const j = this.jogador;
      const bw = 190, bx = this.largura / 2 - bw / 2, by = this.altura - 24;
      ctx.fillStyle = '#00000066'; ctx.fillRect(bx, by, bw, 9);
      ctx.fillStyle = j.axeAtivo > 0 ? '#fff2a0' : '#ffd93c';
      ctx.fillRect(bx, by, bw * Utils.clamp(j.axe, 0, 1), 9);
      ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, 9);
      ctx.fillStyle = j.axe >= 1 || j.axeAtivo > 0 ? '#fff2a0' : '#cde8cf';
      ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(j.axeAtivo > 0 ? 'AXÉ — INVOCADO!' : 'AXÉ', this.largura / 2, by - 3);
      // Ícone da habilidade + recarga
      const hx = bx - 26, hy = by + 4;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = j.cdHabilidade > 0 ? 0.4 : 1;
      ctx.font = '18px system-ui'; ctx.fillText(j.classe.habilidade.icone, hx, hy);
      ctx.globalAlpha = 1;
      if (j.cdHabilidade > 0) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui';
        ctx.fillText(Math.ceil(j.cdHabilidade), hx, hy);
      }
    }

    if (this.jogador) this.atualizarHUD();
  }

  atualizarHUD() {
    const j = this.jogador, s = j.stats;
    this.el.barraVida.style.width = (100 * j.vida / s.vidaMax) + '%';
    this.el.textoVida.textContent = `${Math.ceil(j.vida)}/${Math.round(s.vidaMax)}`;
    this.el.barraXP.style.width = (100 * j.xp / j.xpProx) + '%';
    this.el.nivel.textContent = 'Nv ' + j.nivel;
    this.el.tempo.textContent = Utils.formatTempo(this.diretor.tempo);
    this.el.abates.textContent = '☠ ' + this.abates;
    if (this.el.btnHab) this.el.btnHab.classList.toggle('recarregando', j.cdHabilidade > 0);

    const af = Object.entries(s.afinidade)
      .filter(([, v]) => v > 1)
      .map(([k, v]) => `${ELEMENTOS[k].icone}${Math.round((v - 1) * 100)}%`).join(' ');
    this.el.stats.innerHTML = `
      <li>⚔️ Dano <b>${Math.round(s.dano)}</b></li>
      <li>🛡️ Armadura <b>${Math.round(s.armadura)}</b> <span class="sub">(-${Math.round(reducaoArmadura(s.armadura) * 100)}%)</span></li>
      <li>🎯 Crítico <b>${Math.round(s.critChance * 100)}%</b> ×${s.critMult.toFixed(1)}</li>
      <li>🩸 Roubo de vida <b>${Math.round(s.rouboVida * 100)}%</b></li>
      <li>⚡ Vel. ataque <b>${s.velAtaque.toFixed(2)}/s</b></li>
      <li>👟 Vel. mov. <b>${Math.round(s.velMov * 100)}%</b></li>
      ${j.arma.tipo === 'golpe'
        ? `<li>🥋 Golpes <b>${s.golpes}</b></li>`
        : `<li>➕ Projéteis <b>${s.projeteis}</b></li>`}
      ${af ? `<li>✨ Afinidade ${af}</li>` : ''}`;
  }
}
