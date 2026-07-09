// ============================================================
// main.js - Inicialização
// ============================================================
window.addEventListener('load', () => {
  Input.init();
  const canvas = document.getElementById('jogo');
  const jogo = new Game(canvas);
  window.jogo = jogo; // exposto para depuração no console

  // Seleção de upgrade pelas teclas 1, 2, 3
  window.addEventListener('keydown', (e) => {
    if (jogo.estado === 'levelup' && jogo._opcoesLevelUp) {
      const idx = { Digit1: 0, Digit2: 1, Digit3: 2 }[e.code];
      if (idx !== undefined && jogo._opcoesLevelUp[idx]) {
        jogo.escolherUpgrade(jogo._opcoesLevelUp[idx]);
      }
    }
  });

  jogo.abrirMenu();
  requestAnimationFrame(jogo.loop.bind(jogo));
});
