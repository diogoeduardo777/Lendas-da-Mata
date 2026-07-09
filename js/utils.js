// ============================================================
// utils.js - Funções utilitárias compartilhadas
// ============================================================
const Utils = {
  clamp(v, min, max) { return v < min ? min : (v > max ? max : v); },
  lerp(a, b, t) { return a + (b - a) * t; },
  rand(min, max) { return min + Math.random() * (max - min); },
  randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); },
  chance(p) { return Math.random() < p; },
  choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  // Distância entre dois pontos
  dist(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Escolhe N itens únicos aleatórios de um array
  pickUnique(arr, n) {
    const copia = arr.slice();
    const res = [];
    while (res.length < n && copia.length) {
      const i = Math.floor(Math.random() * copia.length);
      res.push(copia.splice(i, 1)[0]);
    }
    return res;
  },

  // Colisão AABB (retângulos alinhados aos eixos)
  aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  },

  // Formata segundos como MM:SS
  formatTempo(seg) {
    const m = Math.floor(seg / 60);
    const s = Math.floor(seg % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
};
