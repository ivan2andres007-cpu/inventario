/**
 * scanner.js - Escáner de Códigos de Barra y QR para Herramientas
 * Soporta cámara web/móvil con BarcodeDetector y simulador táctil ultrarrápido con pitido.
 */

class ToolScanner {
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.isScanning = false;
    this.audioCtx = null;
  }

  playBeep() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, this.audioCtx.currentTime); // 1800Hz beep tipo escáner industrial
      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.12);

      // Vibración háptica en celulares si está disponible
      if (navigator.vibrate) {
        navigator.vibrate([40]);
      }
    } catch (e) {
      console.warn('Audio/Haptics no disponible:', e);
    }
  }

  async startCamera(videoEl, onCodeDetected) {
    this.videoElement = videoEl;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('La cámara no está disponible en este dispositivo o requiere conexión HTTPS/localhost.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();
      this.isScanning = true;

      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8']
        });
        this.scanInterval = setInterval(async () => {
          if (!this.isScanning) return;
          try {
            const barcodes = await barcodeDetector.detect(this.videoElement);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              this.playBeep();
              this.stopCamera();
              onCodeDetected(code);
            }
          } catch (err) {
            // Error momentáneo de lectura de frame
          }
        }, 300);
      }
    } catch (err) {
      throw new Error('Permiso de cámara denegado o no disponible: ' + err.message);
    }
  }

  stopCamera() {
    this.isScanning = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }
}

window.toolScanner = new ToolScanner();
