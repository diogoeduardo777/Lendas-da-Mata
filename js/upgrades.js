// ============================================================
// upgrades.js - Baralho de melhorias (escolhidas ao subir de nível)
// Tema: gírias e piadas brasileiras (futebol, política, dia a dia
// gaúcho e carioca). Efeitos preservados; só os nomes ganharam sotaque.
// ============================================================
const RARIDADES = {
  comum:   { nome: 'Comum',   cor: '#b9c2cf', peso: 100 },
  raro:    { nome: 'Raro',    cor: '#4fb0ff', peso: 45 },
  epico:   { nome: 'Épico',   cor: '#c97bff', peso: 18 },
  lendario:{ nome: 'Lendário',cor: '#ffb03c', peso: 6 }
};

// Cada carta: id, nome, ícone, raridade, desc e aplicar(player).
// Campo opcional "arma": só aparece para a arma daquele tipo ('projetil' ou 'golpe').
const UPGRADES = [
  // --- Ofensivos ---
  { id: 'dano1', nome: 'Ranço do Rival', icone: '😤', raridade: 'comum',
    desc: '+15% de dano — a raiva de ver o rival ganhar', aplicar: p => p.stats.dano *= 1.15 },
  { id: 'crit1', nome: 'Dedo de Deus', icone: '🎯', raridade: 'raro',
    desc: '+8% de chance de crítico', aplicar: p => p.stats.critChance = Utils.clamp(p.stats.critChance + 0.08, 0, 1) },
  { id: 'critmult', nome: 'Canetada', icone: '💥', raridade: 'epico',
    desc: '+40% de dano crítico — resolvido na canetada', aplicar: p => p.stats.critMult += 0.4 },
  { id: 'velat', nome: 'Pilha de Guaraná', icone: '⚡', raridade: 'comum',
    desc: '+18% de velocidade de ataque', aplicar: p => p.stats.velAtaque *= 1.18 },
  { id: 'proj', nome: 'Contratação Bomba', icone: '⚽', raridade: 'epico', arma: 'projetil',
    desc: '+1 projétil por ataque — reforço no ataque', aplicar: p => p.stats.projeteis += 1 },
  { id: 'golpe1', nome: 'Rodada de Bolacha', icone: '👋', raridade: 'comum', arma: 'golpe',
    desc: '+1 golpe corpo a corpo por ataque', aplicar: p => p.stats.golpes += 1 },
  { id: 'area1', nome: 'Puxadinho na Laje', icone: '🧱', raridade: 'raro',
    desc: '+20% de área dos ataques', aplicar: p => p.stats.area *= 1.2 },
  { id: 'alcance1', nome: 'Fofoca de Vizinha', icone: '🔭', raridade: 'comum',
    desc: '+20% de alcance — a notícia voa longe', aplicar: p => p.stats.alcance *= 1.2 },

  // --- Defensivos ---
  { id: 'vida1', nome: 'Prato de Comida da Vó', icone: '❤️', raridade: 'comum',
    desc: '+25 de vida máxima e enche tudo (comida de vó cura)', aplicar: p => { p.stats.vidaMax += 25; p.vida = p.stats.vidaMax; } },
  { id: 'armadura1', nome: 'Casaco (vai que esfria)', icone: '🧥', raridade: 'comum',
    desc: '+15 de armadura', aplicar: p => p.stats.armadura += 15 },
  { id: 'regen1', nome: 'Água de Coco na Praia', icone: '💚', raridade: 'raro',
    desc: '+2 de regeneração por segundo', aplicar: p => p.stats.regen += 2 },
  { id: 'roubo_comum', nome: 'Chimarrão Curador', icone: '🧉', raridade: 'comum',
    desc: '+6% de roubo de vida — a cuia restaura, tchê', aplicar: p => p.stats.rouboVida += 0.06 },
  { id: 'roubo1', nome: 'Caixa Dois', icone: '🩸', raridade: 'epico',
    desc: '+8% de roubo de vida — sempre sobra uma parte', aplicar: p => p.stats.rouboVida += 0.08 },

  // --- Mobilidade / Utilidade ---
  { id: 'velmov', nome: 'Correndo do Busão', icone: '👟', raridade: 'comum',
    desc: '+12% de velocidade de movimento', aplicar: p => p.stats.velMov *= 1.12 },
  { id: 'magneto', nome: 'Vaquinha no Pix', icone: '🧲', raridade: 'comum',
    desc: '+40% de raio de coleta de XP', aplicar: p => p.stats.magnetismo *= 1.4 },
  { id: 'sorte', nome: 'Deu Zebra', icone: '🍀', raridade: 'raro',
    desc: '+1 de sorte — o azarão levou a melhor', aplicar: p => p.stats.sorte += 1 },

  // --- Elementais (afinidade) ---
  { id: 'af_fogo', nome: 'Churrasco de Domingo', icone: '🔥', raridade: 'raro',
    desc: '+20% de dano com Fogo', aplicar: p => p.stats.afinidade.fogo = (p.stats.afinidade.fogo ?? 1) + 0.2 },
  { id: 'af_agua', nome: 'Onda de Ipanema', icone: '💧', raridade: 'raro',
    desc: '+20% de dano com Água', aplicar: p => p.stats.afinidade.agua = (p.stats.afinidade.agua ?? 1) + 0.2 },
  { id: 'af_terra', nome: 'Pelada no Barro', icone: '🪨', raridade: 'raro',
    desc: '+20% de dano com Terra', aplicar: p => p.stats.afinidade.terra = (p.stats.afinidade.terra ?? 1) + 0.2 },
  { id: 'af_vento', nome: 'Vento Minuano', icone: '🌪️', raridade: 'raro',
    desc: '+20% de dano com Vento — o frio que corta', aplicar: p => p.stats.afinidade.vento = (p.stats.afinidade.vento ?? 1) + 0.2 },
  { id: 'af_trovao', nome: 'Trovão do Maracanã', icone: '⚡', raridade: 'epico',
    desc: '+25% de dano com Trovão — a torcida em peso', aplicar: p => p.stats.afinidade.trovao = (p.stats.afinidade.trovao ?? 1) + 0.25 },

  // --- Lendário ---
  { id: 'lend_dano', nome: 'Camisa 10 da Seleção', icone: '🌟', raridade: 'lendario',
    desc: '+30% de dano e +1 ataque (projétil e golpe)', aplicar: p => { p.stats.dano *= 1.3; p.stats.projeteis += 1; p.stats.golpes += 1; } }
];

// Sorteia N upgrades ponderados por raridade (a sorte do jogador aumenta chances de raros).
// Cartas marcadas com "arma" só entram se combinarem com a arma do jogador.
function sortearUpgrades(player, n = 3) {
  const sorte = player.stats.sorte || 0;
  const tipoArma = player.arma.tipo;
  const pool = UPGRADES
    .filter(u => !u.arma || u.arma === tipoArma)
    .map(u => {
      let peso = RARIDADES[u.raridade].peso;
      // Sorte reduz o peso relativo dos comuns e favorece raridades maiores
      if (u.raridade !== 'comum') peso += sorte * 8;
      return { u, peso };
    });

  const escolhidos = [];
  const disponivel = pool.slice();
  while (escolhidos.length < n && disponivel.length) {
    const total = disponivel.reduce((s, x) => s + x.peso, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < disponivel.length; i++) {
      r -= disponivel[i].peso;
      if (r <= 0) { idx = i; break; }
    }
    escolhidos.push(disponivel.splice(idx, 1)[0].u);
  }
  return escolhidos;
}
