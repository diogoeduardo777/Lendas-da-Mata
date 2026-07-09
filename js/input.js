// ============================================================
// input.js - Captura de teclado
// ============================================================
const Input = {
  keys: {},
  temToque: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,

  init() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      // Evita rolagem da página com setas/espaço durante o jogo
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    // Se a janela perde o foco, zera as teclas (evita "andar sozinho")
    window.addEventListener('blur', () => { this.keys = {}; });

    this.initToque();
  },

  // Botões na tela para jogar no celular (esquerda / direita / pular)
  initToque() {
    const botoes = document.querySelectorAll('.btn-toque');
    botoes.forEach((b) => {
      const code = b.dataset.key;
      const press = (e) => { e.preventDefault(); this.keys[code] = true; b.classList.add('ativo'); };
      const solta = (e) => { e.preventDefault(); this.keys[code] = false; b.classList.remove('ativo'); };
      b.addEventListener('pointerdown', press);
      b.addEventListener('pointerup', solta);
      b.addEventListener('pointercancel', solta);
      b.addEventListener('pointerleave', solta);
      // Impede menu de contexto ao segurar no toque
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    if (this.temToque) document.body.classList.add('toque');
  },

  isDown(...codes) {
    return codes.some(c => this.keys[c]);
  },

  esquerda() { return this.isDown('ArrowLeft', 'KeyA'); },
  direita()  { return this.isDown('ArrowRight', 'KeyD'); },
  pular()    { return this.isDown('ArrowUp', 'KeyW', 'Space'); }
};
