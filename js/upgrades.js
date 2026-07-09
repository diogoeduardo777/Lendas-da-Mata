// ============================================================
// upgrades.js - Baralho de melhorias (escolhidas ao subir de nível)
// Tema: relíquias e bênçãos do folclore brasileiro.
// Cada carta tem raridade e uma função aplicar(player).
// ============================================================
const RARIDADES = {
  comum:   { nome: 'Comum',   cor: '#b9c2cf', peso: 100 },
  raro:    { nome: 'Raro',    cor: '#4fb0ff', peso: 45 },
  epico:   { nome: 'Épico',   cor: '#c97bff', peso: 18 },
  lendario:{ nome: 'Lendário',cor: '#ffb03c', peso: 6 }
};

const UPGRADES = [
  // --- Ofensivos ---
  { id: 'dano1', nome: 'Presságio de Guerra', icone: '⚔️', raridade: 'comum',
    desc: '+15% de dano', aplicar: p => p.stats.dano *= 1.15 },
  { id: 'crit1', nome: 'Olho de Boto', icone: '🎯', raridade: 'raro',
    desc: '+8% chance de crítico', aplicar: p => p.stats.critChance = Utils.clamp(p.stats.critChance + 0.08, 0, 1) },
  { id: 'critmult', nome: 'Fúria do Mapinguari', icone: '💥', raridade: 'epico',
    desc: '+40% de dano crítico', aplicar: p => p.stats.critMult += 0.4 },
  { id: 'velat', nome: 'Sopro do Saci', icone: '🌀', raridade: 'comum',
    desc: '+18% velocidade de ataque', aplicar: p => p.stats.velAtaque *= 1.18 },
  { id: 'proj', nome: 'Flecha Extra', icone: '➕', raridade: 'epico',
    desc: '+1 projétil/golpe por ataque', aplicar: p => p.stats.projeteis += 1 },
  { id: 'area1', nome: 'Terra Trêmula', icone: '🌐', raridade: 'raro',
    desc: '+20% de área dos ataques', aplicar: p => p.stats.area *= 1.2 },
  { id: 'alcance1', nome: 'Visão de Caçador', icone: '🔭', raridade: 'comum',
    desc: '+20% de alcance', aplicar: p => p.stats.alcance *= 1.2 },

  // --- Defensivos ---
  { id: 'vida1', nome: 'Coração de Curupira', icone: '❤️', raridade: 'comum',
    desc: '+25 vida máxima (cura total)', aplicar: p => { p.stats.vidaMax += 25; p.vida = p.stats.vidaMax; } },
  { id: 'armadura1', nome: 'Casco de Tatu', icone: '🛡️', raridade: 'comum',
    desc: '+15 de armadura', aplicar: p => p.stats.armadura += 15 },
  { id: 'regen1', nome: 'Bênção da Iara', icone: '💚', raridade: 'raro',
    desc: '+2 de regeneração por segundo', aplicar: p => p.stats.regen += 2 },
  { id: 'roubo1', nome: 'Sede da Cuca', icone: '🩸', raridade: 'epico',
    desc: '+8% de roubo de vida', aplicar: p => p.stats.rouboVida += 0.08 },

  // --- Mobilidade / Utilidade ---
  { id: 'velmov', nome: 'Pés de Vento', icone: '👟', raridade: 'comum',
    desc: '+12% velocidade de movimento', aplicar: p => p.stats.velMov *= 1.12 },
  { id: 'magneto', nome: 'Patuá Reluzente', icone: '🧲', raridade: 'comum',
    desc: '+40% de raio de coleta de XP', aplicar: p => p.stats.magnetismo *= 1.4 },
  { id: 'sorte', nome: 'Figa da Sorte', icone: '🍀', raridade: 'raro',
    desc: '+1 de sorte (melhores upgrades)', aplicar: p => p.stats.sorte += 1 },

  // --- Elementais (afinidade) ---
  { id: 'af_fogo', nome: 'Chama do Boitatá', icone: '🔥', raridade: 'raro',
    desc: '+20% de dano com Fogo', aplicar: p => p.stats.afinidade.fogo = (p.stats.afinidade.fogo ?? 1) + 0.2 },
  { id: 'af_agua', nome: 'Maré da Iara', icone: '💧', raridade: 'raro',
    desc: '+20% de dano com Água', aplicar: p => p.stats.afinidade.agua = (p.stats.afinidade.agua ?? 1) + 0.2 },
  { id: 'af_terra', nome: 'Raiz do Curupira', icone: '🪨', raridade: 'raro',
    desc: '+20% de dano com Terra', aplicar: p => p.stats.afinidade.terra = (p.stats.afinidade.terra ?? 1) + 0.2 },
  { id: 'af_vento', nome: 'Redemoinho do Saci', icone: '🌪️', raridade: 'raro',
    desc: '+20% de dano com Vento', aplicar: p => p.stats.afinidade.vento = (p.stats.afinidade.vento ?? 1) + 0.2 },
  { id: 'af_trovao', nome: 'Ira de Tupã', icone: '⚡', raridade: 'epico',
    desc: '+25% de dano com Trovão', aplicar: p => p.stats.afinidade.trovao = (p.stats.afinidade.trovao ?? 1) + 0.25 },

  // --- Lendário ---
  { id: 'lend_dano', nome: 'Coração da Mata Virgem', icone: '🌳', raridade: 'lendario',
    desc: '+30% de dano e +1 projétil', aplicar: p => { p.stats.dano *= 1.3; p.stats.projeteis += 1; } }
];

// Sorteia N upgrades ponderados por raridade (a sorte do jogador aumenta chances de raros).
function sortearUpgrades(player, n = 3) {
  const sorte = player.stats.sorte || 0;
  const pool = UPGRADES.map(u => {
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
