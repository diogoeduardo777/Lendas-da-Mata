// ============================================================
// sprites.js - Desenho procedural dos personagens (sem imagens)
// Estilo cartum colorido inspirado no Sítio do Picapau Amarelo.
// ============================================================
const Sprites = {

  // ---------- utilidades ----------
  elipse(ctx, x, y, rx, ry, cor) {
    ctx.fillStyle = cor;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  },

  // Flash branco ao levar dano
  flashDano(ctx, e) {
    if (e.hitFlash > 0) {
      ctx.fillStyle = '#ffffff99';
      ctx.beginPath(); ctx.arc(e.centroX(), e.centroY(), e.w * 0.7, 0, Math.PI * 2); ctx.fill();
    }
  },

  // ---------- HERÓIS ----------
  heroi(ctx, j) {
    const cx = j.centroX(), base = j.y + j.h;
    const noAr = !j.noChao;
    const andando = Math.abs(j.vx) > 0.1 && !noAr;
    const passo = andando ? Math.sin(j.animPasso) : 0;   // balanço das pernas
    const respira = Math.sin(j.animT * 2.2) * 1.2;       // respiração parado
    const pele = '#f2c79a';

    ctx.save();
    ctx.translate(cx, 0); ctx.scale(j.olharDir, 1); ctx.translate(-cx, 0);

    // Pernas (balançam ao andar; encolhidas no ar)
    ctx.fillStyle = '#3a2c20';
    if (noAr) {
      ctx.fillRect(cx - 9, base - 10, 7, 9);
      ctx.fillRect(cx + 2, base - 12, 7, 9);
    } else {
      ctx.fillRect(cx - 9 + passo * 4, base - 12, 7, 12);
      ctx.fillRect(cx + 2 - passo * 4, base - 12, 7, 12);
    }

    // Corpo (túnica na cor da classe)
    const topo = j.y + 10 + (noAr ? 2 : respira * 0.4);
    ctx.fillStyle = j.classe.cor;
    ctx.strokeStyle = '#00000044'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(j.x + 2, topo, j.w - 4, base - 12 - topo, 7);
    ctx.fill(); ctx.stroke();

    // Braço (estende na pose de ataque)
    ctx.strokeStyle = pele; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    if (j.atacandoT > 0) { ctx.moveTo(cx + 4, topo + 8); ctx.lineTo(cx + 17, topo + 4); }
    else { ctx.moveTo(cx + 5, topo + 7); ctx.lineTo(cx + 8 + passo * 3, topo + 16); }
    ctx.stroke();

    // Cabeça
    const hy = j.y + 6 + (noAr ? 1 : respira * 0.3);
    this.elipse(ctx, cx, hy, 10, 9, pele);
    ctx.fillStyle = '#20140c';
    ctx.beginPath(); ctx.arc(cx + 4, hy - 1, 1.6, 0, Math.PI * 2); ctx.fill();

    // Detalhes de cada classe
    this['detalhe_' + j.classe.id]?.(ctx, j, cx, hy, topo);
    ctx.restore();
  },

  // Bandeirante: chapéu de couro de abas largas + barba
  detalhe_guerreiro(ctx, j, cx, hy) {
    this.elipse(ctx, cx, hy - 5, 13, 4, '#6d4c2f');                          // aba
    ctx.fillStyle = '#7d5936';
    ctx.beginPath(); ctx.roundRect(cx - 7, hy - 16, 14, 11, 3); ctx.fill();  // copa
    ctx.fillStyle = '#4e3620'; ctx.fillRect(cx - 7, hy - 8, 14, 3);          // fita
    this.elipse(ctx, cx, hy + 6, 6, 4, '#4b3621');                           // barba
  },

  // Pajé: cocar de penas coloridas + pintura no rosto + cajado com brasa
  detalhe_mago(ctx, j, cx, hy, topo) {
    const penas = ['#e53935', '#ffb300', '#43a047', '#1e88e5', '#e53935'];
    penas.forEach((c, i) => {
      const a = -Math.PI / 2 + (i - 2) * 0.38;
      this.elipse(ctx, cx + Math.cos(a) * 12, hy - 4 + Math.sin(a) * 11, 3, 6.5, c);
    });
    ctx.fillStyle = '#8d5524'; ctx.fillRect(cx - 9, hy - 8, 18, 4);          // faixa
    ctx.strokeStyle = '#c62828'; ctx.lineWidth = 1.5;                        // pintura
    ctx.beginPath(); ctx.moveTo(cx - 5, hy + 3); ctx.lineTo(cx + 6, hy + 3); ctx.stroke();
    ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = 3;                          // cajado
    ctx.beginPath(); ctx.moveTo(cx + 13, topo + 20); ctx.lineTo(cx + 15, topo - 8); ctx.stroke();
    const pulso = 3 + Math.sin(j.animT * 6);
    this.elipse(ctx, cx + 15, topo - 10, pulso, pulso, '#ffb03c');           // brasa
  },

  // Caçador: capuz verde + máscara
  detalhe_ninja(ctx, j, cx, hy) {
    ctx.fillStyle = '#2f5e3f';
    ctx.beginPath(); ctx.arc(cx, hy - 2, 10.5, Math.PI, 0); ctx.fill();      // capuz
    ctx.fillRect(cx - 10.5, hy - 2, 21, 3);
    ctx.fillStyle = '#1c3a27'; ctx.fillRect(cx - 8, hy + 2, 16, 5);          // máscara
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx + 4, hy - 0.5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#20140c';
    ctx.beginPath(); ctx.arc(cx + 4.5, hy - 0.5, 1.2, 0, Math.PI * 2); ctx.fill();
  },

  // Iara: cabelos longos escuros + flor
  detalhe_encantadeira(ctx, j, cx, hy, topo) {
    ctx.fillStyle = '#123326';
    ctx.beginPath(); ctx.arc(cx, hy - 3, 10.5, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    ctx.beginPath();                                                         // mecha caindo
    ctx.moveTo(cx - 10, hy - 2);
    ctx.quadraticCurveTo(cx - 14, topo + 16, cx - 9, topo + 24);
    ctx.lineTo(cx - 5, topo + 10); ctx.closePath(); ctx.fill();
    this.elipse(ctx, cx - 7, hy - 8, 3, 3, '#ff7bac');                       // flor
    this.elipse(ctx, cx - 7, hy - 8, 1.2, 1.2, '#ffe082');
  },

  // Lobisomem: orelhas, focinho e cauda balançando
  detalhe_berserker(ctx, j, cx, hy, topo) {
    ctx.fillStyle = '#6d5340';
    ctx.beginPath(); ctx.moveTo(cx - 8, hy - 7); ctx.lineTo(cx - 4, hy - 15); ctx.lineTo(cx - 1, hy - 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 1, hy - 7); ctx.lineTo(cx + 5, hy - 15); ctx.lineTo(cx + 8, hy - 7); ctx.fill();
    this.elipse(ctx, cx + 7, hy + 2, 5, 3.5, '#6d5340');                     // focinho
    ctx.fillStyle = '#20140c';
    ctx.beginPath(); ctx.arc(cx + 11, hy + 1, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6d5340'; ctx.lineWidth = 5; ctx.lineCap = 'round';   // cauda
    ctx.beginPath();
    ctx.moveTo(cx - 12, topo + 22);
    ctx.quadraticCurveTo(cx - 20, topo + 18 + Math.sin(j.animT * 5) * 4, cx - 22, topo + 10);
    ctx.stroke();
  },

  // ---------- GNOMOS (inimigos comuns) ----------
  gnomo(ctx, e) {
    const s = e.w / 32;                       // escala relativa ao tamanho
    const cx = e.centroX(), base = e.y + e.h;
    const pulando = !e.voa && !e.noChao;
    const atk = e.atacandoT > 0;
    const passo = Math.sin(e.animT * 9);

    ctx.save();
    ctx.translate(cx, 0); ctx.scale(e.dir, 1); ctx.translate(-cx, 0);
    if (atk) { ctx.translate(cx, base); ctx.rotate(0.18); ctx.translate(-cx, -base); } // inclina p/ frente

    // Pernas
    ctx.fillStyle = '#1b5e20';
    if (pulando) {
      ctx.fillRect(cx - 7 * s, base - 6 * s, 5 * s, 6 * s);
      ctx.fillRect(cx + 2 * s, base - 6 * s, 5 * s, 6 * s);
    } else {
      ctx.fillRect(cx - 7 * s + passo * 3 * s, base - 8 * s, 5 * s, 8 * s);
      ctx.fillRect(cx + 2 * s - passo * 3 * s, base - 8 * s, 5 * s, 8 * s);
    }

    // Corpo verde rechonchudo
    const grad = ctx.createLinearGradient(0, e.y, 0, base);
    grad.addColorStop(0, e.cor); grad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#00000044'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, e.y + e.h * 0.62, e.w * 0.42, e.h * 0.34, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Cinto com fivela
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(cx - e.w * 0.4, e.y + e.h * 0.66, e.w * 0.8, 3 * s);
    ctx.fillStyle = '#ffd93c'; ctx.fillRect(cx - 2.5 * s, e.y + e.h * 0.645, 5 * s, 5 * s);

    // Braço com porrete (gira ao atacar)
    const ang = atk ? Math.sin(e.atacandoT * 25) * 0.9 : 0.3;
    const bx = cx + e.w * 0.3, by = e.y + e.h * 0.55;
    ctx.strokeStyle = e.cor; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(ang) * 10 * s, by - Math.sin(ang) * 10 * s); ctx.stroke();
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.moveTo(bx + Math.cos(ang) * 10 * s, by - Math.sin(ang) * 10 * s);
    ctx.lineTo(bx + Math.cos(ang) * 18 * s, by - Math.sin(ang) * 18 * s); ctx.stroke();

    // Cabeça com nariz grande
    const hy = e.y + e.h * 0.32;
    this.elipse(ctx, cx, hy, e.w * 0.3, e.w * 0.27, '#f2c79a');
    this.elipse(ctx, cx + e.w * 0.22, hy + 2 * s, 3.4 * s, 2.6 * s, '#e0a880');
    ctx.fillStyle = '#20140c';
    ctx.beginPath(); ctx.arc(cx + e.w * 0.12, hy - 2 * s, 1.6 * s, 0, Math.PI * 2); ctx.fill();
    // Barba branca (anciões)
    if (e.cfg.barba) this.elipse(ctx, cx, hy + e.w * 0.2, e.w * 0.24, e.w * 0.16, '#eceff1');

    // Chapéu pontudo (tomba para frente no ataque e estica no pulo)
    ctx.fillStyle = e.cfg.corChapeu || '#e53935';
    ctx.beginPath();
    ctx.moveTo(cx - e.w * 0.32, hy - e.w * 0.12);
    ctx.lineTo(cx + e.w * 0.32, hy - e.w * 0.12);
    ctx.lineTo(cx + (atk ? e.w * 0.14 : e.w * 0.04), hy - e.w * 0.72 - (pulando ? 3 : 0));
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#00000033'; ctx.stroke();

    this.flashDano(ctx, e);
    ctx.restore();
  },

  // ---------- URUBU DO MENGÃO (voador bombardeiro) ----------
  urubu(ctx, e) {
    const s = e.w / 30;
    const cx = e.centroX(), cy = e.centroY();
    const bat = Math.sin(e.animT * 10);        // batida de asas

    ctx.save();
    ctx.translate(cx, 0); ctx.scale(e.dir, 1); ctx.translate(-cx, 0);

    // Asa de trás
    ctx.fillStyle = '#16161c';
    ctx.beginPath();
    ctx.moveTo(cx - 2 * s, cy);
    ctx.quadraticCurveTo(cx - 16 * s, cy - 8 * s - bat * 8 * s, cx - 24 * s, cy - 2 * s - bat * 10 * s);
    ctx.quadraticCurveTo(cx - 14 * s, cy + 4 * s, cx - 2 * s, cy + 4 * s);
    ctx.fill();

    // Corpo
    this.elipse(ctx, cx, cy, 12 * s, 9 * s, '#22222a');

    // Camisa do Flamengo (listras rubro-negras)
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, cy + 2 * s, 10 * s, 7 * s, 0, 0, Math.PI * 2); ctx.clip();
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? '#111111' : '#d32f2f';
      ctx.fillRect(cx - 11 * s, cy - 5 * s + i * 3.2 * s, 22 * s, 3.2 * s);
    }
    ctx.restore();

    // Cabeça pelada + bico adunco
    this.elipse(ctx, cx + 9 * s, cy - 7 * s, 4.5 * s, 4.5 * s, '#9e9e9e');
    ctx.fillStyle = '#ffca28';
    ctx.beginPath();
    ctx.moveTo(cx + 12 * s, cy - 8 * s);
    ctx.quadraticCurveTo(cx + 19 * s, cy - 7 * s, cx + 13 * s, cy - 4 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#20140c';
    ctx.beginPath(); ctx.arc(cx + 9.5 * s, cy - 8 * s, 1.3 * s, 0, Math.PI * 2); ctx.fill();
    this.elipse(ctx, cx + 7 * s, cy - 3 * s, 3 * s, 2 * s, '#eceff1');  // colarinho

    // Sacola de dinheiro pendurada nas garras
    if (e.temBolsa) {
      ctx.strokeStyle = '#ffca28'; ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.moveTo(cx - 2 * s, cy + 8 * s); ctx.lineTo(cx, cy + 12 * s);
      ctx.moveTo(cx + 4 * s, cy + 8 * s); ctx.lineTo(cx + 2 * s, cy + 12 * s);
      ctx.stroke();
      this.bolsa(ctx, cx + 1 * s, cy + 17 * s, 7 * s);
    }

    // Asa da frente
    ctx.fillStyle = '#101014';
    ctx.beginPath();
    ctx.moveTo(cx + 2 * s, cy);
    ctx.quadraticCurveTo(cx + 12 * s, cy - 6 * s - bat * 7 * s, cx + 20 * s, cy - bat * 9 * s);
    ctx.quadraticCurveTo(cx + 12 * s, cy + 5 * s, cx + 2 * s, cy + 4 * s);
    ctx.fill();

    this.flashDano(ctx, e);
    ctx.restore();
  },

  // Sacola de dinheiro ($)
  bolsa(ctx, x, y, r) {
    ctx.fillStyle = '#c8994f';
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#00000033'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#a87a38';
    ctx.fillRect(x - r * 0.4, y - r * 1.3, r * 0.8, r * 0.45);
    ctx.fillStyle = '#1b5e20';
    ctx.font = `bold ${Math.max(8, r)}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('$', x, y + 1);
  },

  // Sacola em queda (projétil dos urubus)
  sacoDinheiro(ctx, sc) {
    ctx.save();
    const cx = sc.x + sc.w / 2, cy = sc.y + sc.h / 2;
    ctx.translate(cx, cy); ctx.rotate(Math.sin(sc.rot) * 0.25); ctx.translate(-cx, -cy);
    this.bolsa(ctx, cx, cy, sc.w * 0.55);
    ctx.restore();
  },

  // ---------- CHEFES (aura pulsante + emoji grande) ----------
  boss(ctx, e) {
    const cx = e.centroX(), cy = e.centroY();
    const el = ELEMENTOS[e.elemento];
    const pulso = 1 + Math.sin(e.animT * 4) * 0.08;
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, e.w * 0.2, cx, cy, e.w * 0.95 * pulso);
    g.addColorStop(0, el.cor + '55'); g.addColorStop(1, el.cor + '00');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, e.w * 0.95 * pulso, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.cor;
    ctx.strokeStyle = el.cor; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(e.x, e.y, e.w, e.h, 14); ctx.fill(); ctx.stroke();
    ctx.font = `${Math.round(e.w * 0.62)}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(e.icone, cx, cy + Math.sin(e.animT * 4) * 2);
    ctx.restore();
  }
};
