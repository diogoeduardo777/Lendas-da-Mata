// ============================================================
// classes.js - Personagens jogáveis (estilos de jogo)
// Cada classe tem uma identidade de atributos + arma + elemento inicial.
// Todas são inspiradas em figuras do folclore/cultura brasileira.
// ============================================================
const CLASSES = {
  guerreiro: {
    id: 'guerreiro',
    nome: 'Guerreiro',
    alcunha: 'Bandeirante',
    icone: '🛡️',
    cor: '#c8792f',
    elemento: 'terra',
    descricao: 'Tanque de corpo a corpo. Muita vida e armadura, golpes em área ao redor.',
    stats: {
      vidaMax: 160, dano: 14, armadura: 40, critChance: 0.08, critMult: 1.6,
      rouboVida: 0.05, velMov: 0.95, velAtaque: 0.9, area: 1.2, alcance: 1.0
    },
    arma: { tipo: 'golpe', alcanceBase: 78, cor: '#e0b070' } // golpe circular ao redor
  },

  mago: {
    id: 'mago',
    nome: 'Mago',
    alcunha: 'Pajé',
    icone: '🔮',
    cor: '#ff5a3c',
    elemento: 'fogo',
    descricao: 'Conjura fogo à distância. Frágil, mas dano elemental altíssimo.',
    stats: {
      vidaMax: 90, dano: 18, armadura: 8, critChance: 0.1, critMult: 1.8,
      rouboVida: 0, velMov: 1.0, velAtaque: 1.0, area: 1.1, alcance: 1.3,
      afinidade: { fogo: 1.25 }
    },
    arma: { tipo: 'projetil', velProj: 6.5, pierce: 0, cor: '#ffb03c' }
  },

  ninja: {
    id: 'ninja',
    nome: 'Ninja',
    alcunha: 'Caçador',
    icone: '🥷',
    cor: '#8ef0a8',
    elemento: 'vento',
    descricao: 'Ágil e letal. Ataca rápido, muito crítico e velocidade de movimento.',
    stats: {
      vidaMax: 100, dano: 9, armadura: 12, critChance: 0.22, critMult: 2.0,
      rouboVida: 0.03, velMov: 1.25, velAtaque: 1.5, area: 0.9, alcance: 1.1
    },
    arma: { tipo: 'projetil', velProj: 10, pierce: 1, cor: '#d6ffe0' } // shuriken perfurante
  },

  encantadeira: {
    id: 'encantadeira',
    nome: 'Encantadeira',
    alcunha: 'Iara',
    icone: '🧜‍♀️',
    cor: '#3ca7ff',
    elemento: 'agua',
    descricao: 'Domina a água e drena a vida dos inimigos. Sustentável e resiliente.',
    stats: {
      vidaMax: 110, dano: 11, armadura: 15, critChance: 0.08, critMult: 1.5,
      rouboVida: 0.2, velMov: 1.05, velAtaque: 1.05, area: 1.15, alcance: 1.15, regen: 1,
      afinidade: { agua: 1.2 }
    },
    arma: { tipo: 'projetil', velProj: 7, pierce: 0, cor: '#9be0ff' }
  },

  berserker: {
    id: 'berserker',
    nome: 'Berserker',
    alcunha: 'Lobisomem',
    icone: '🐺',
    cor: '#9a6cff',
    elemento: 'trovao',
    descricao: 'Quanto menos vida, mais dano. Alto risco, alta recompensa.',
    stats: {
      vidaMax: 130, dano: 16, armadura: 20, critChance: 0.12, critMult: 1.9,
      rouboVida: 0.08, velMov: 1.1, velAtaque: 1.1, area: 1.0, alcance: 1.0
    },
    arma: { tipo: 'golpe', alcanceBase: 70, cor: '#c9b6ff' },
    // Passiva: bônus de dano conforme vida cai (aplicada no cálculo do ataque)
    passiva: 'furia'
  }
};

// Lista ordenada para exibir na tela de seleção
const CLASSES_ORDEM = ['guerreiro', 'mago', 'ninja', 'encantadeira', 'berserker'];
