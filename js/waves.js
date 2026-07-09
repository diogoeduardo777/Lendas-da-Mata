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

class DiretorDeOndas {
  constructor(jogo) {
    this.jogo = jogo;
    this.tempo = 0;
    this.cdSpawn = 0;
    this.chefesUsados = new Set();
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
