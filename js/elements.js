// ============================================================
// elements.js - Poderes elementais e suas interações
// Cada elemento tem uma criatura do folclore como "padroeira".
// ============================================================
const ELEMENTOS = {
  fogo:   { id: 'fogo',   nome: 'Fogo',   cor: '#ff5a3c', cor2: '#ffb03c', icone: '🔥', padroeiro: 'Boitatá' },
  agua:   { id: 'agua',   nome: 'Água',   cor: '#3ca7ff', cor2: '#9be0ff', icone: '💧', padroeiro: 'Iara' },
  terra:  { id: 'terra',  nome: 'Terra',  cor: '#b07a3c', cor2: '#e0b070', icone: '🪨', padroeiro: 'Curupira' },
  vento:  { id: 'vento',  nome: 'Vento',  cor: '#8ef0a8', cor2: '#d6ffe0', icone: '🌪️', padroeiro: 'Saci' },
  trovao: { id: 'trovao', nome: 'Trovão', cor: '#ffd93c', cor2: '#fff7c0', icone: '⚡', padroeiro: 'Tupã' }
};

// Bônus de dano por afinidade elemental (rock-paper-scissors simplificado).
// atacante -> alvo. Valores > 1 significam "forte contra".
// Aqui usamos como bônus contra inimigos que tenham uma "fraqueza" definida.
const VANTAGEM_ELEMENTAL = {
  fogo:   'vento',   // fogo se alastra com o vento
  agua:   'fogo',    // água apaga o fogo
  terra:  'agua',    // terra absorve a água
  vento:  'terra',   // vento erode a terra
  trovao: 'agua'     // trovão eletrifica a água
};

// Retorna o multiplicador de dano do elemento do atacante contra a fraqueza do alvo
function multiplicadorElemental(elementoAtaque, elementoAlvo) {
  if (!elementoAtaque || !elementoAlvo) return 1;
  return VANTAGEM_ELEMENTAL[elementoAtaque] === elementoAlvo ? 1.5 : 1;
}
