// ============================================================
// main.js - Inicialização
// ============================================================

// Ajusta o tamanho do palco ao espaço realmente visível do dispositivo,
// mantendo a proporção 16:9. Evita que a tela fique "grande demais" no celular
// (onde 100vh do CSS pode contar a área atrás da barra do navegador).
function ajustarPalco() {
  const palco = document.getElementById('palco');
  if (!palco) return;
  const RAZAO = 960 / 540;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let largura = vw;
  let altura = vw / RAZAO;
  if (altura > vh) { altura = vh; largura = vh * RAZAO; } // limita pela altura visível
  if (largura > 960) { largura = 960; altura = 540; }      // não passa do tamanho nativo
  palco.style.width = Math.round(largura) + 'px';
  palco.style.height = Math.round(altura) + 'px';
}

window.addEventListener('load', () => {
  Input.init();
  const canvas = document.getElementById('jogo');
  const jogo = new Game(canvas);
  window.jogo = jogo; // exposto para depuração no console

  // Mantém o palco proporcional em qualquer dispositivo/rotação
  ajustarPalco();
  window.addEventListener('resize', ajustarPalco);
  window.addEventListener('orientationchange', () => setTimeout(ajustarPalco, 250));

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
