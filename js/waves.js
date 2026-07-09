// ============================================================
// waves.js - Tipos de inimigos (folclore) e diretor de ondas
// ============================================================
const INIMIGOS = {
  // Inimigos comuns: gnomos verdes baixinhos de chapéu pontudo
  gnomo: {
    nome: 'Gnomo da Mata', sprite: 'gnomo', cor: '#4caf50', corChapeu: '#e53935', elemento: 'terra',
    vidaBase: 18, danoContato: 8, vel: 2.4, tamanho: 26, xpValor: 1, voa: false
  },
  gnomoBravo: {
    nome: 'Gnomo Bravo', sprite: 'gnomo', cor: '#43a047', corChapeu: '#1e88e5', elemento: 'vento',
    vidaBase: 30, danoContato: 12, vel: 1.7, tamanho: 34, xpValor: 2, voa: false
  },
  // Voador: urubu com camisa do Flamengo que bombardeia sacolas de dinheiro
  urubu: {
    nome: 'Urubu do Mengão', sprite: 'urubu', cor: '#22222a', elemento: 'vento',
    vidaBase: 24, danoContato: 10, vel: 1.9, tamanho: 30, xpValor: 2, voa: true
  },
  gnomoAnciao: {
    nome: 'Gnomo Ancião', sprite: 'gnomo', cor: '#388e3c', corChapeu: '#8e24aa', barba: true, elemento: 'agua',
    vidaBase: 45, danoContato: 14, vel: 1.3, tamanho: 38, xpValor: 3, voa: false
  },
  gnomoGigante: {
    nome: 'Gnomo Gigante', sprite: 'gnomo', cor: '#2e7d32', corChapeu: '#37474f', barba: true, elemento: 'trovao',
    vidaBase: 60, danoContato: 18, vel: 1.5, tamanho: 44, xpValor: 4, voa: false
  },
  // Saci-Colorado: raro, lança redemoinho que suspende o jogador no ar (não dá dano direto)
  saci: {
    nome: 'Saci-Colorado', sprite: 'saci', comportamento: 'redemoinho', cor: '#e4002b', elemento: 'vento',
    vidaBase: 22, danoContato: 6, vel: 2.7, tamanho: 26, xpValor: 2, voa: false,
    alcanceIdeal: 210, intervaloTiro: 4.5
  },
  // Cangaceiro (Lampião): atira de longe com espingarda (dano à distância)
  cangaceiro: {
    nome: 'Cangaceiro', sprite: 'cangaceiro', comportamento: 'atirador', cor: '#b8925a', elemento: 'terra',
    vidaBase: 34, danoContato: 12, vel: 1.6, tamanho: 34, xpValor: 3, voa: false,
    alcanceIdeal: 320, intervaloTiro: 2.6, pelotas: 2
  },
  // --- Chefes ---
  boitata: {
    nome: 'Boitatá', icone: '🐍', cor: '#ff5a3c', elemento: 'fogo',
    vidaBase: 900, danoContato: 26, vel: 1.6, tamanho: 70, xpValor: 60, voa: true, boss: true
  },
  mula: {
    nome: 'Mula-sem-cabeça', icone: '🐴', cor: '#ff7b00', elemento: 'fogo',
    vidaBase: 1400, danoContato: 32, vel: 2.2, tamanho: 72, xpValor: 90, voa: false, boss: true
  },
  mapinguari: {
    nome: 'Mapinguari', icone: '🦥', cor: '#8b4513', elemento: 'terra',
    vidaBase: 2200, danoContato: 40, vel: 1.2, tamanho: 84, xpValor: 140, voa: false, boss: true
  }
};

// Progressão de "ondas comuns" por faixa de tempo (segundos)
const PROGRESSAO = [
  { ate: 60,  tipos: ['gnomo'],                                   intervalo: 1.3 },
  { ate: 120, tipos: ['gnomo', 'urubu'],                          intervalo: 1.05 },
  { ate: 180, tipos: ['gnomo', 'urubu', 'gnomoBravo'],            intervalo: 0.9 },
  { ate: 300, tipos: ['urubu', 'gnomoBravo', 'gnomoAnciao'],      intervalo: 0.72 },
  { ate: 999, tipos: ['gnomoBravo', 'gnomoAnciao', 'gnomoGigante'], intervalo: 0.58 }
];

// Chefes que entram em cena em momentos-chave
const CHEFES_AGENDA = [
  { tempo: 90,  tipo: 'boitata' },
  { tempo: 210, tipo: 'mula' },
  { tempo: 360, tipo: 'mapinguari' }
];

// Mobs especiais que entram "de vez em quando", por cima da horda comum.
// Cada um tem ritmo próprio (intervalo), momento de estreia (desde), tamanho
// do grupo (lote) e um LIMITE de quantos podem estar vivos ao mesmo tempo (cap).
const ESPECIAIS = [
  { tipo: 'saci',       desde: 40, intervalo: 13, cap: 4, lote: [1, 2], anuncio: '👣 Sacis colorados apareceram!' },
  { tipo: 'cangaceiro', desde: 75, intervalo: 20, cap: 6, lote: [2, 3], anuncio: '🔫 Bando de cangaceiros no pedaço!' }
];

class DiretorDeOndas {
  constructor(jogo) {
    this.jogo = jogo;
    this.tempo = 0;
    this.cdSpawn = 0;
    this.chefesUsados = new Set();
    this.cdEspeciais = ESPECIAIS.map(esp => Utils.rand(3, esp.intervalo));
    this.especiaisVistos = new Set();
  }

  // Escala de dificuldade cresce com o tempo (vida/dano dos inimigos)
  escala() { return 1 + this.tempo / 75; }

  faseAtual() {
    return PROGRESSAO.find(f => this.tempo < f.ate) || PROGRESSAO[PROGRESSAO.length - 1];
  }

  update(dt) {
    this.tempo += dt;

    // Chefes agendados
    for (const ch of CHEFES_AGENDA) {
      if (this.tempo >= ch.tempo && !this.chefesUsados.has(ch.tempo)) {
        this.chefesUsados.add(ch.tempo);
        this.spawnInimigo(ch.tipo);
        this.jogo.anunciar(`⚠️ ${INIMIGOS[ch.tipo].nome} apareceu!`);
      }
    }

    // Ondas comuns
    const fase = this.faseAtual();
    this.cdSpawn -= dt;
    if (this.cdSpawn <= 0) {
      this.cdSpawn = fase.intervalo;
      const qtd = 1 + Math.floor(this.tempo / 62); // mais inimigos por vez ao longo do tempo
      for (let i = 0; i < qtd; i++) {
        this.spawnInimigo(Utils.choice(fase.tipos));
      }
    }

    // Mobs especiais (Saci, Cangaceiro): ritmo próprio + limite na tela,
    // podendo surgir junto com a horda comum, mas sem exagerar na quantidade.
    ESPECIAIS.forEach((esp, i) => {
      if (this.tempo < esp.desde) return;
      this.cdEspeciais[i] -= dt;
      if (this.cdEspeciais[i] > 0) return;
      this.cdEspeciais[i] = esp.intervalo;
      const vivos = this.contarVivos(esp.tipo);
      if (vivos >= esp.cap) return;
      const qtd = Math.min(Utils.randInt(esp.lote[0], esp.lote[1]), esp.cap - vivos);
      for (let k = 0; k < qtd; k++) this.spawnInimigo(esp.tipo);
      if (!this.especiaisVistos.has(esp.tipo)) {
        this.especiaisVistos.add(esp.tipo);
        this.jogo.anunciar(esp.anuncio);
      }
    });
  }

  // Quantos inimigos de um tipo estão vivos (usado para respeitar o limite)
  contarVivos(tipo) {
    const cfg = INIMIGOS[tipo];
    return this.jogo.inimigos.filter(e => e.cfg === cfg && !e.morrendo).length;
  }

  spawnInimigo(tipoId) {
    const cfg = INIMIGOS[tipoId];
    const jogo = this.jogo, cam = jogo.camera;
    const VW = jogo.largura, VH = jogo.altura;      // tela visível
    const L = jogo.mundoLargura, A = jogo.mundoAltura; // mundo
    const margem = 70;
    let x, y;
    if (cfg.voa) {
      // Nasce logo fora de uma das bordas da tela visível
      const borda = Utils.randInt(0, 3);
      if (borda === 0)      { x = Utils.rand(cam.x, cam.x + VW); y = cam.y - margem; }
      else if (borda === 1) { x = Utils.rand(cam.x, cam.x + VW); y = cam.y + VH + margem; }
      else if (borda === 2) { x = cam.x - margem; y = Utils.rand(cam.y, cam.y + VH); }
      else                  { x = cam.x + VW + margem; y = Utils.rand(cam.y, cam.y + VH); }
    } else {
      // Andarilhos entram pelo chão, à esquerda ou à direita da tela
      x = Utils.chance(0.5) ? cam.x - margem : cam.x + VW + margem;
      y = A - 40 - cfg.tamanho; // sobre o chão
    }
    x = Utils.clamp(x, -80, L + 80);
    const escala = cfg.boss ? this.escala() * 1.2 : this.escala();
    jogo.inimigos.push(new Inimigo(jogo, cfg, x, y, escala));
  }
}
