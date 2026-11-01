/**
 * signature.js - Panel de Firma Digital Táctil para Celulares y Tablets
 * Permite firmar con el dedo en pantallas táctiles o mouse.
 */

class SignaturePad {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.hasDrawn = false;
    this.points = [];

    this.initEvents();
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#38bdf8'; // Cyan luminoso de alta visibilidad
  }

  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  initEvents() {
    const start = (e) => {
      e.preventDefault();
      this.isDrawing = true;
      this.hasDrawn = true;
      const pos = this.getPointerPos(e);
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    };

    const move = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = this.getPointerPos(e);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
    };

    const end = (e) => {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.ctx.closePath();
      }
    };

    // Touch events
    this.canvas.addEventListener('touchstart', start, { passive: false });
    this.canvas.addEventListener('touchmove', move, { passive: false });
    this.canvas.addEventListener('touchend', end, { passive: false });
    this.canvas.addEventListener('touchcancel', end, { passive: false });

    // Mouse events
    this.canvas.addEventListener('mousedown', start);
    this.canvas.addEventListener('mousemove', move);
    this.canvas.addEventListener('mouseup', end);
    this.canvas.addEventListener('mouseleave', end);

    window.addEventListener('resize', () => {
      // Reajustar sólo si no hay trazo activo
      if (!this.hasDrawn) this.resizeCanvas();
    });
  }

  clear() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.hasDrawn = false;
  }

  isEmpty() {
    return !this.hasDrawn;
  }

  toDataURL() {
    if (!this.hasDrawn) return null;
    return this.canvas.toDataURL('image/png');
  }
}

window.SignaturePad = SignaturePad;
