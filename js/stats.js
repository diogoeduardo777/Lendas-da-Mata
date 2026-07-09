// ============================================================
// stats.js - Modelo de atributos e matemática de combate
// O coração do jogo: tudo gira em torno destes números.
// ============================================================
class Stats {
  constructor(base = {}) {
    this.vidaMax     = base.vidaMax     ?? 100;   // pontos de vida máximos
    this.dano        = base.dano        ?? 10;    // dano base por ataque
    this.armadura    = base.armadura    ?? 0;     // reduz dano recebido (diminishing returns)
    this.critChance  = base.critChance  ?? 0.05;  // 0..1 chance de acerto crítico
    this.critMult    = base.critMult    ?? 1.5;   // multiplicador do crítico
    this.rouboVida   = base.rouboVida   ?? 0;     // 0..1 % do dano convertido em cura
    this.velMov      = base.velMov      ?? 1.0;   // multiplicador de velocidade de movimento
    this.velAtaque   = base.velAtaque   ?? 1.0;   // ataques por segundo (multiplicador)
    this.area        = base.area        ?? 1.0;   // multiplicador de área/tamanho dos ataques
    this.alcance     = base.alcance     ?? 1.0;   // multiplicador de alcance
    this.projeteis   = base.projeteis   ?? 1;     // nº de projéteis por ataque (armas à distância)
    this.golpes      = base.golpes      ?? 1;     // nº de golpes por ataque (armas corpo a corpo)
    this.regen       = base.regen       ?? 0;     // vida regenerada por segundo
    this.sorte       = base.sorte       ?? 0;     // afeta raridade de upgrades e drops
    this.magnetismo  = base.magnetismo  ?? 90;    // raio (px) de atração de XP
    this.afinidade   = base.afinidade   ?? {};    // { fogo: 1.2, ... } bônus por elemento
  }

  // Bônus de afinidade para um elemento específico
  afinidadeDe(elemento) {
    return this.afinidade[elemento] ?? 1;
  }
}

// Calcula a redução de dano vinda da armadura (curva com retornos decrescentes).
// 100 de armadura = 50% de redução; 300 = 75%; etc.
function reducaoArmadura(armadura) {
  return armadura / (armadura + 100);
}

// Resolve um golpe: retorna { dano, critico }
function calcularDano(atacanteStats, base, elemento, alvoElemento) {
  let dano = base;
  const critico = Utils.chance(atacanteStats.critChance);
  if (critico) dano *= atacanteStats.critMult;
  dano *= atacanteStats.afinidadeDe(elemento);
  dano *= multiplicadorElemental(elemento, alvoElemento);
  return { dano: Math.max(1, Math.round(dano)), critico };
}

// Aplica a armadura do alvo sobre um dano já calculado
function danoAposArmadura(dano, armadura) {
  return Math.max(1, Math.round(dano * (1 - reducaoArmadura(armadura))));
}
