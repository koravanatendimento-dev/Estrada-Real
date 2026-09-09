// ==========================================
// CAMERA-OCR.JS - Câmera Webcam e OCR via IA (Tesseract)
// ==========================================

let streamIA = null;
let mediaStream = null;

function abrirTelaRegistrarIA() {
  const secLista = document.getElementById('sec-lista-encomendas');
  const secCad = document.getElementById('sec-cadastrar-encomenda');
  const secIA = document.getElementById('sec-registrar-ia');

  if (secLista) secLista.style.display = 'none';
  if (secCad) secCad.style.display = 'none';
  if (secIA) secIA.style.display = 'block';
}

async function abrirModalCameraIA() {
  const modal = document.getElementById('modal-camera-ia');
  const video = document.getElementById('webcam-preview-modal');
  const statusEl = document.getElementById('status-ia-processando');
  if (statusEl) statusEl.style.display = 'none';

  try {
    streamIA = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    if (video) video.srcObject = streamIA;
    if (modal) modal.style.display = 'flex';
  } catch (err) {
    alert("Não foi possível acessar a câmera: " + err.message);
  }
}

function fecharModalCameraIA() {
  if (streamIA) {
    streamIA.getTracks().forEach(track => track.stop());
    streamIA = null;
  }
  const modal = document.getElementById('modal-camera-ia');
  if (modal) modal.style.display = 'none';
}

async function processarFotoIA() {
  const video = document.getElementById('webcam-preview-modal');
  const canvas = document.getElementById('webcam-canvas-modal');
  const statusEl = document.getElementById('status-ia-processando');

  if (statusEl) statusEl.style.display = 'block';

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/png');

  try {
    if (typeof Tesseract === 'undefined') {
      throw new Error("Biblioteca Tesseract.js não carregada.");
    }

    const result = await Tesseract.recognize(dataUrl, 'por', { logger: m => console.log(m) });
    const textoLido = result.data.text;

    fecharModalCameraIA();

    const secIA = document.getElementById('sec-registrar-ia');
    if (secIA) secIA.style.display = 'none';

    const secCad = document.getElementById('sec-cadastrar-encomenda');
    if (secCad) secCad.style.display = 'block';

    const inputFoto = document.getElementById('enc_foto_data');
    if (inputFoto) inputFoto.value = dataUrl;

    const imgPreview = document.getElementById('captured-photo');
    if (imgPreview) {
      imgPreview.src = dataUrl;
      imgPreview.style.display = 'block';
    }

    extrairEPreencherDadosIA(textoLido);

  } catch (err) {
    if (statusEl) statusEl.style.display = 'none';
    alert("Erro na leitura da etiqueta: " + err.message);
  }
}

function extrairEPreencherDadosIA(texto) {
  const matchApto = texto.match(/(\d{3,4})\s*(?:BLOCO|BL|B)?\s*(\d{1,2})?/i);

  if (matchApto) {
    const numAp = matchApto[1];
    const numBloco = matchApto[2] ? matchApto[2].padStart(2, '0') : '01';
    const unidadeEncontrada = `${numAp} (BLOCO ${numBloco})`;

    const selectEnc = document.getElementById('enc_unit');
    if (selectEnc) {
      selectEnc.value = unidadeEncontrada;
      if (typeof window.atualizarMoradoresEncomenda === 'function') {
        window.atualizarMoradoresEncomenda(unidadeEncontrada);
      }
    }
  }

  const matchCodigo = texto.match(/([A-Z]{2}\d{9}[A-Z]{2}|\bBR\d{10,15}\b|\bZAP-\d{4}\b)/i);
  if (matchCodigo) {
    const inputProtocolo = document.getElementById('enc_protocolo');
    if (inputProtocolo) inputProtocolo.value = matchCodigo[0].toUpperCase();
  }

  if (/shopee/i.test(texto)) selecionarTransportadoraPorNome('Shopee');
  else if (/amazon/i.test(texto)) selecionarTransportadoraPorNome('Amazon');
  else if (/mercado\s*livre/i.test(texto)) selecionarTransportadoraPorNome('Mercado Livre');
  else if (/correios/i.test(texto)) selecionarTransportadoraPorNome('Correios');
}

function selecionarTransportadoraPorNome(nome) {
  const cards = document.querySelectorAll('.transp-card');
  cards.forEach(c => {
    if (c.textContent.toLowerCase().includes(nome.toLowerCase())) {
      if (typeof window.selecionarTransportadora === 'function') {
        window.selecionarTransportadora(c, nome);
      }
    }
  });
}

async function ligarCamera() {
  const video = document.getElementById('webcam-preview');
  const btnCapturar = document.getElementById('btn-capturar-foto');
  const capturedImg = document.getElementById('captured-photo');

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    if (video) {
      video.srcObject = mediaStream;
      video.style.display = 'block';
    }
    if (btnCapturar) btnCapturar.style.display = 'inline-flex';
    if (capturedImg) capturedImg.style.display = 'none';
  } catch (err) {
    alert("Não foi possível acessar a câmera: " + err.message);
  }
}

function tirarFoto() {
  const video = document.getElementById('webcam-preview');
  const canvas = document.getElementById('webcam-canvas');
  const capturedImg = document.getElementById('captured-photo');
  const inputFotoData = document.getElementById('enc_foto_data');

  if (!video || !canvas) return;

  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/png');
  if (inputFotoData) inputFotoData.value = dataUrl;
  if (capturedImg) {
    capturedImg.src = dataUrl;
    capturedImg.style.display = 'block';
  }

  desligarCamera();
}

function desligarCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  const video = document.getElementById('webcam-preview');
  const btnCapturar = document.getElementById('btn-capturar-foto');
  if (video) video.style.display = 'none';
  if (btnCapturar) btnCapturar.style.display = 'none';
}

// Exportações globais
window.abrirTelaRegistrarIA = abrirTelaRegistrarIA;
window.abrirModalCameraIA = abrirModalCameraIA;
window.fecharModalCameraIA = fecharModalCameraIA;
window.processarFotoIA = processarFotoIA;
window.extrairEPreencherDadosIA = extrairEPreencherDadosIA;
window.selecionarTransportadoraPorNome = selecionarTransportadoraPorNome;
window.ligarCamera = ligarCamera;
window.tirarFoto = tirarFoto;
window.desligarCamera = desligarCamera;
