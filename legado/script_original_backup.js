// ==========================================
// BACKUP DO SCRIPT ORIGINAL (Antes da modularização)
// ==========================================
// ESTRUTURA GLOBAL E BANCO DE DADOS LOCAL
// ==========================================
const DB = {
  get: (key) => {
    try {
      const item = localStorage.getItem(`zapcondo_${key}`);
      if (!item || item === 'undefined' || item === 'null') return [];
      return JSON.parse(item) || [];
    } catch (err) {
      console.warn(`Aviso ao ler zapcondo_${key} do localStorage:`, err);
      return [];
    }
  },
  set: (key, data) => {
    localStorage.setItem(`zapcondo_${key}`, JSON.stringify(data));
    renderAll();
  }
};

let listaUnidades = [];
function gerarUnidades() {
  listaUnidades = [];
  for (let andar = 1; andar <= 9; andar++) {
    for (let apto = 1; apto <= 4; apto++) {
      const numApto = `${andar}0${apto}`;
      listaUnidades.push(`${numApto} (BLOCO 01)`);
      listaUnidades.push(`${numApto} (BLOCO 02)`);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  gerarUnidades();
  popularDropdownsUnidades();
  configurarNavegacao();
  configurarFormularios();
  renderAll();
});

function configurarNavegacao() {
  const menuItems = document.querySelectorAll('#menu-list li');
  const containers = document.querySelectorAll('.container');
  const pageTitle = document.getElementById('page-title');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(i => i.classList.remove('active'));
      containers.forEach(c => c.classList.remove('active-tab'));
      
      item.classList.add('active');
      const targetId = item.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active-tab');
      pageTitle.textContent = item.textContent.trim();
    });
  });
}

function popularDropdownsUnidades() {
  const selectEnc = document.getElementById('enc_unit');
  const selectFilter = document.getElementById('filter_unit_enc');

  if (selectEnc) {
    selectEnc.innerHTML = '<option value="">Selecione a unidade...</option>';
    if (selectFilter) selectFilter.innerHTML = '<option value="">Todas as Unidades</option>';

    listaUnidades.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u;
      opt.textContent = u;
      selectEnc.appendChild(opt);

      if (selectFilter) {
        const optFlt = document.createElement('option');
        optFlt.value = u;
        optFlt.textContent = u;
        selectFilter.appendChild(optFlt);
      }
    });

    selectEnc.addEventListener('change', (e) => atualizarMoradoresEncomenda(e.target.value));
  }
}

// Dropdown com Pesquisa para Moradores (Aba People)
function renderUnitDropdown(filter = '') {
  const unitListEl = document.getElementById('unit-dropdown-list');
  const unitSearchInput = document.getElementById('unit-search-input');
  const hiddenUnitInput = document.getElementById('field_unit');

  if (!unitListEl) return;
  unitListEl.innerHTML = '';

  const filtradas = listaUnidades.filter(u => u.toLowerCase().includes(filter.toLowerCase()));
  filtradas.forEach(unit => {
    const div = document.createElement('div');
    div.className = 'dropdown-item-option';
    div.textContent = unit;
    div.onclick = () => {
      unitSearchInput.value = unit;
      hiddenUnitInput.value = unit;
      unitListEl.style.display = 'none';
    };
    unitListEl.appendChild(div);
  });
}

function toggleUnitDropdown() {
  const unitListEl = document.getElementById('unit-dropdown-list');
  if (unitListEl) {
    unitListEl.style.display = unitListEl.style.display === 'block' ? 'none' : 'block';
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-dropdown-container')) {
    const unitListEl = document.getElementById('unit-dropdown-list');
    if (unitListEl) unitListEl.style.display = 'none';
  }
});

const unitSearchInput = document.getElementById('unit-search-input');
if (unitSearchInput) {
  unitSearchInput.addEventListener('input', (e) => {
    const unitListEl = document.getElementById('unit-dropdown-list');
    if (unitListEl) unitListEl.style.display = 'block';
    renderUnitDropdown(e.target.value);
  });
}

// ==========================================
// FLUXO REGISTRAR COM IA & MODAL CÂMERA
// ==========================================

function abrirTelaRegistrarIA() {
  document.getElementById('sec-lista-encomendas').style.display = 'none';
  document.getElementById('sec-cadastrar-encomenda').style.display = 'none';
  
  const secIA = document.getElementById('sec-registrar-ia');
  if (secIA) secIA.style.display = 'block';
}

let streamIA = null;
async function abrirModalCameraIA() {
  const modal = document.getElementById('modal-camera-ia');
  const video = document.getElementById('webcam-preview-modal');
  const statusEl = document.getElementById('status-ia-processando');
  if (statusEl) statusEl.style.display = 'none';

  try {
    streamIA = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = streamIA;
    modal.style.display = 'flex';
  } catch (err) {
    alert("Não foi possível acessar a câmera: " + err.message);
  }
}

function fecharModalCameraIA() {
  if (streamIA) {
    streamIA.getTracks().forEach(track => track.stop());
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
    const result = await Tesseract.recognize(dataUrl, 'por', { logger: m => console.log(m) });
    const textoLido = result.data.text;

    fecharModalCameraIA();

    const secIA = document.getElementById('sec-registrar-ia');
    if (secIA) secIA.style.display = 'none';
    document.getElementById('sec-cadastrar-encomenda').style.display = 'block';

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
      atualizarMoradoresEncomenda(unidadeEncontrada);
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
      selecionarTransportadora(c, nome);
    }
  });
}

let mediaStream = null;
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
  }
  const video = document.getElementById('webcam-preview');
  const btnCapturar = document.getElementById('btn-capturar-foto');
  if (video) video.style.display = 'none';
  if (btnCapturar) btnCapturar.style.display = 'none';
}

// ==========================================
// POPULA DROPDOWN COM MORADORES
// ==========================================
function atualizarMoradoresEncomenda(unidadeSelecionada) {
  const selectMorador = document.getElementById('select-morador');
  const inputDestinatario = document.getElementById('enc_destinatario');
  
  if (inputDestinatario) inputDestinatario.value = '';
  if (selectMorador) {
    selectMorador.innerHTML = '<option value="">-- Selecione o Morador --</option>';
  }

  if (!unidadeSelecionada) return;

  const moradores = DB.get('people');
  const moradoresDaUnidade = moradores.filter(m => m.unit === unidadeSelecionada);

  if (moradoresDaUnidade.length > 0 && selectMorador) {
    moradoresDaUnidade.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m.name;
      
      const telText = m.phone || m.mobilePhone ? ` | Tel: ${m.phone || m.mobilePhone}` : '';
      const emailText = m.email || m.personalEmail ? ` | Email: ${m.email || m.personalEmail}` : '';
      opt.textContent = `${m.name}${telText}${emailText}`;
      
      selectMorador.appendChild(opt);
    });

    selectMorador.onchange = (e) => {
      if (inputDestinatario) inputDestinatario.value = e.target.value;
    };
  }
}

function notificarMorador(dadosEnvio, encomenda) {
  const moradores = DB.get('people');
  const moradorCadastrado = moradores.find(m => m.name.trim().toLowerCase() === encomenda.dest.trim().toLowerCase());

  const telefoneFinal = moradorCadastrado?.phone || moradorCadastrado?.mobilePhone || dadosEnvio?.phone || '31984708652';
  const emailFinal = moradorCadastrado?.email || moradorCadastrado?.personalEmail || dadosEnvio?.email || 'douglas.ribeiro86@yahoo.com.br';

  const mensagem = `📦 *Sua encomenda chegou no Condomínio Estrada Real!*\n\n` +
    `• *Morador:* ${encomenda.dest}\n` +
    `• *Unidade:* ${encomenda.unit}\n` +
    `• *Código de Retirada:* *${encomenda.code}*\n\n` +
    `Apresente a imagem do QR Code anexa na portaria para efetuar a retirada.`;

  console.log('🚀 Disparando fetch para o servidor local...', { telefoneFinal, emailFinal });

  fetch('http://localhost:3001/enviar-notificacao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telefone: telefoneFinal,
      email: emailFinal,
      mensagem: mensagem,
      codigo: encomenda.code
    })
  })
  .then(res => res.json())
  .then(data => console.log('✅ Resposta do Servidor Node:', data))
  .catch(err => console.error('❌ Erro de conexão com o servidor Node:', err));
}

function exibirFormularioEncomenda() {
  document.getElementById('sec-lista-encomendas').style.display = 'none';
  const secIA = document.getElementById('sec-registrar-ia');
  if (secIA) secIA.style.display = 'none';
  document.getElementById('sec-cadastrar-encomenda').style.display = 'block';
}

function exibirListaEncomendas() {
  fecharModalCameraIA();
  desligarCamera();
  const formEnc = document.getElementById('encomendaForm');
  if (formEnc) formEnc.reset();

  const imgPreview = document.getElementById('captured-photo');
  if (imgPreview) imgPreview.style.display = 'none';

  const secIA = document.getElementById('sec-registrar-ia');
  if (secIA) secIA.style.display = 'none';

  document.getElementById('sec-cadastrar-encomenda').style.display = 'none';
  document.getElementById('sec-lista-encomendas').style.display = 'block';
}

function exibirFormularioMorador() {
  document.getElementById('sec-lista-moradores').style.display = 'none';
  document.getElementById('blocoFormulario').style.display = 'block';
}

function exibirListaMoradores() {
  const formPeople = document.getElementById('editForm');
  if (formPeople) formPeople.reset();
  document.getElementById('blocoFormulario').style.display = 'none';
  document.getElementById('sec-lista-moradores').style.display = 'block';
}

// ==========================================
// SUBMISSÃO DE FORMULÁRIOS
// ==========================================
function configurarFormularios() {
  // Salvar Morador
  document.getElementById('editForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const lista = DB.get('people');
    lista.push({
      name: document.getElementById('field_name').value,
      cpf: document.getElementById('field_id1').value,
      email: document.getElementById('field_personalEmail').value,
      phone: document.getElementById('field_mobilePhone').value,
      unit: document.getElementById('field_unit').value || 'Não selecionada'
    });
    DB.set('people', lista);
    exibirListaMoradores();
  });

  // Salvar Encomenda
  document.getElementById('encomendaForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const unit = document.getElementById('enc_unit').value;
    const selectMorador = document.getElementById('select-morador');
    const nomeDestinatario = selectMorador ? selectMorador.value : '';

    if (!nomeDestinatario || nomeDestinatario.trim() === '') {
      alert('Por favor, selecione qual morador vai receber a encomenda!');
      return;
    }

    const tipo = document.getElementById('enc_tipo').value;
    const carrier = document.getElementById('enc_transportadora').value;
    const protocoloVal = document.getElementById('enc_protocolo')?.value || '-';
    
    const unicoId = Date.now().toString().slice(-5) + Math.floor(10 + Math.random() * 90);
    const codigoRastreio = `ZAP-${unicoId}`;

    const novaEncomenda = {
      id: Date.now().toString().slice(-6),
      unit: unit,
      dest: nomeDestinatario,
      tipo: tipo,
      carrier: carrier,
      code: codigoRastreio,
      date: new Date().toLocaleString('pt-BR'),
      status: 'Pendente',
      photo: document.getElementById('enc_foto_data')?.value || null,
      protocolo: protocoloVal
    };

    const lista = DB.get('parcels');
    lista.unshift(novaEncomenda);
    DB.set('parcels', lista);

    notificarMorador({}, novaEncomenda);
    exibirListaEncomendas();
  });

  // Veículos
  document.getElementById('form-vehicle')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const lista = DB.get('vehicles');
    lista.push({ model: document.getElementById('v-model').value, plate: document.getElementById('v-plate').value, owner: document.getElementById('v-owner').value });
    DB.set('vehicles', lista);
    e.target.reset();
  });

  // Pets
  document.getElementById('form-pet')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const lista = DB.get('pets');
    lista.push({ name: document.getElementById('pet-name').value, breed: document.getElementById('pet-breed').value, unit: document.getElementById('pet-unit').value });
    DB.set('pets', lista);
    e.target.reset();
  });

  // Acessos
  document.getElementById('form-access')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const lista = DB.get('access');
    lista.push({ time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), type: document.getElementById('acc-type').value, desc: document.getElementById('acc-desc').value, unit: document.getElementById('acc-unit').value });
    DB.set('access', lista);
    e.target.reset();
  });

  // Incidentes
  document.getElementById('form-incident')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const lista = DB.get('incidents');
    lista.push({ date: new Date().toLocaleString('pt-BR'), title: document.getElementById('inc-title').value, unit: document.getElementById('inc-unit').value, desc: document.getElementById('inc-desc').value });
    DB.set('incidents', lista);
    e.target.reset();
  });

  // Plantão
  document.getElementById('form-shift')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const lista = DB.get('shifts');
    lista.push({ date: new Date().toLocaleString('pt-BR'), turn: document.getElementById('sh-turn').value, guard: document.getElementById('sh-guard').value, obs: document.getElementById('sh-obs').value });
    DB.set('shifts', lista);
    e.target.reset();
  });
}

function selecionarTipo(btn, tipo) {
  document.querySelectorAll('.tipo-pacote').forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-secondary');
  });
  btn.classList.remove('btn-secondary');
  btn.classList.add('btn-primary');
  document.getElementById('enc_tipo').value = tipo;
}

function selecionarTransportadora(card, nome) {
  document.querySelectorAll('.transp-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  document.getElementById('enc_transportadora').value = nome;
}

function darBaixaEncomenda(index) {
  const pessoa = prompt("Digite o nome de quem retirou a encomenda:");
  if (!pessoa) return;

  const lista = DB.get('parcels');
  lista[index].status = 'Retirado';
  lista[index].retiradoPor = pessoa;
  lista[index].dataRetirada = new Date().toLocaleString('pt-BR');
  DB.set('parcels', lista);
}

function aplicarFiltrosEncomendas() {
  renderAll();
}

function deletarItem(chave, index) {
  if (confirm("Deseja realmente remover este item?")) {
    const lista = DB.get(chave);
    lista.splice(index, 1);
    DB.set(chave, lista);
  }
}

// ==========================================
// RENDERIZAÇÃO GERAL
// ==========================================
function renderAll() {
  const parcels = DB.get('parcels');
  const people = DB.get('people');
  const unitFlt = document.getElementById('filter_unit_enc')?.value || '';
  const statusFlt = document.querySelector('input[name="flt_st"]:checked')?.value || 'Todos';

  const countParcelsEl = document.getElementById('count-parcels');
  if (countParcelsEl) countParcelsEl.textContent = parcels.filter(p => p.status === 'Pendente').length;
  
  const countPeopleEl = document.getElementById('count-people');
  if (countPeopleEl) countPeopleEl.textContent = people.length;

  const containerChips = document.getElementById('container-chips-aguardando');
  const boxAguardando = document.getElementById('box-aguardando-retirada');
  const pendentes = parcels.filter(p => p.status === 'Pendente');

  if (containerChips && boxAguardando) {
    if (pendentes.length === 0) {
      boxAguardando.style.display = 'none';
    } else {
      boxAguardando.style.display = 'block';
      containerChips.innerHTML = '';
      
      const porUnidade = {};
      pendentes.forEach(p => {
        porUnidade[p.unit] = (porUnidade[p.unit] || 0) + 1;
      });

      Object.keys(porUnidade).forEach(u => {
        containerChips.innerHTML += `
          <button class="btn btn-secondary" style="background:#fef08a; color:#854d0e; border:none; padding:4px 10px; font-size:0.8rem; font-weight:bold; border-radius:12px;">
            ${u} <span class="badge" style="background:#eab308; color:#fff;">${porUnidade[u]}</span>
          </button>
        `;
      });
    }
  }

  const containerCards = document.getElementById('container-cards-encomendas');
  if (containerCards) {
    let filtrados = parcels;
    if (unitFlt) filtrados = filtrados.filter(p => p.unit === unitFlt);
    if (statusFlt !== 'Todos') filtrados = filtrados.filter(p => p.status === statusFlt);

    containerCards.innerHTML = filtrados.map((p, i) => `
      <div class="panel-section mb-3" style="border: 1px solid #cbd5e1; padding: 0; overflow: hidden;">
        <div style="background: #f8fafc; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
          <h3 style="font-size: 1.1rem; color: #1e293b; margin: 0;">${p.unit}</h3>
          <span class="badge ${p.status === 'Pendente' ? 'warning' : 'success'}">${p.status}</span>
        </div>
        <div style="padding: 20px; display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="width: 120px; height: 120px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            ${p.photo ? `<img src="${p.photo}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-box" style="font-size:2.5rem; color:#cbd5e1;"></i>`}
          </div>
          <div style="flex: 1; min-width: 200px;">
            <span class="badge warning" style="background:#dcfce7; color:#15803d; margin-bottom: 8px; display: inline-block;">${p.tipo}</span>
            <p style="margin: 4px 0;"><strong>Para:</strong> ${p.dest}</p>
            <p style="margin: 4px 0;"><strong>Protocolo:</strong> ${p.protocolo}</p>
            <p style="margin: 4px 0;"><strong>Origem:</strong> ${p.carrier}</p>
            <p style="margin: 4px 0; color: #64748b; font-size: 0.85rem;">Cadastrado em: ${p.date} (Cód: ${p.code})</p>
          </div>
          <div style="width: 200px; display: flex; flex-direction: column; justify-content: center; gap: 10px;">
            ${p.status === 'Pendente' ? `
              <button class="btn btn-success" style="width:100%;" onclick="darBaixaEncomenda(${i})"><i class="fa-solid fa-check"></i> Entregar</button>
            ` : `
              <div style="background:#f8fafc; padding:8px; border-radius:6px; font-size:0.8rem;">
                <strong>Entregue para:</strong> ${p.retiradoPor}<br>
                <small style="color:#64748b;">${p.dataRetirada}</small>
              </div>
            `}
          </div>
        </div>
      </div>
    `).join('');
  }

  const tablePeople = document.getElementById('table-people');
  if (tablePeople) {
    tablePeople.innerHTML = people.map((p, i) => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.unit}</td>
        <td>${p.phone || p.email || '-'}</td>
        <td><button class="btn btn-danger" onclick="deletarItem('people', ${i})"><i class="fa-solid fa-trash"></i></button></td>
      </tr>
    `).join('');
  }

  const tableVehicles = document.getElementById('table-vehicles');
  if (tableVehicles) {
    tableVehicles.innerHTML = DB.get('vehicles').map((v, i) => `
      <tr><td>${v.model}</td><td><strong>${v.plate}</strong></td><td>${v.owner}</td><td><button class="btn btn-danger" onclick="deletarItem('vehicles', ${i})"><i class="fa-solid fa-trash"></i></button></td></tr>
    `).join('');
  }

  const tablePets = document.getElementById('table-pets');
  if (tablePets) {
    tablePets.innerHTML = DB.get('pets').map((pt, i) => `
      <tr><td>${pt.name}</td><td>${pt.breed}</td><td>${pt.unit}</td><td><button class="btn btn-danger" onclick="deletarItem('pets', ${i})"><i class="fa-solid fa-trash"></i></button></td></tr>
    `).join('');
  }

  const tableAccess = document.getElementById('table-access');
  if (tableAccess) {
    tableAccess.innerHTML = DB.get('access').map((a, i) => `
      <tr><td>${a.time}</td><td>${a.type}</td><td>${a.desc}</td><td>${a.unit}</td><td><button class="btn btn-danger" onclick="deletarItem('access', ${i})"><i class="fa-solid fa-trash"></i></button></td></tr>
    `).join('');
  }

  const tableIncidents = document.getElementById('table-incidents');
  if (tableIncidents) {
    tableIncidents.innerHTML = DB.get('incidents').map((inc, i) => `
      <tr><td>${inc.date}</td><td>${inc.title}</td><td>${inc.unit}</td><td>${inc.desc}</td><td><button class="btn btn-danger" onclick="deletarItem('incidents', ${i})"><i class="fa-solid fa-trash"></i></button></td></tr>
    `).join('');
  }

  const tableShifts = document.getElementById('table-shifts');
  if (tableShifts) {
    tableShifts.innerHTML = DB.get('shifts').map((s, i) => `
      <tr><td>${s.date}</td><td>${s.turn}</td><td>${s.guard}</td><td>${s.obs}</td><td><button class="btn btn-danger" onclick="deletarItem('shifts', ${i})"><i class="fa-solid fa-trash"></i></button></td></tr>
    `).join('');
  }
}

// ==========================================
// BOTÕES DE TESTE E DISPARO MANUAL
// ==========================================
window.testarEnvioManual = async function() {
  console.log("🖱️ Botão de teste clicado!");
  
  const payload = {
    telefone: '31984708652',
    email: 'douglas.ribeiro86@yahoo.com.br',
    mensagem: '📦 *Encomenda Chegou! - Condomínio Estrada Real*\n\n• *Morador:* DOUGLAS LAINE SANTOS RIBEIRO\n• *Unidade:* 601 (BLOCO 02)\n• *Código de Retirada:* *ZAP-TESTE99*'
  };

  console.log("📤 Enviando notificação:", payload);

  try {
    const res = await fetch('http://localhost:3001/enviar-notificacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('📥 Resposta do servidor:', data);

    if (data.success) {
      alert(`✅ Disparo Realizado com Sucesso!\n\n• WhatsApp: ${data.whatsapp ? 'Enviado ✅' : 'Não enviado'}\n• Mensagem: ${data.message || 'Entregue'}`);
    } else {
      alert(`⚠️ Atenção do Servidor:\n${data.message || data.error || 'Não foi possível enviar.'}`);
    }
  } catch (err) {
    console.error('❌ Erro no fetch:', err);
    alert('❌ Erro de conexão com o servidor na porta 3001.\n\nCertifique-se de que o servidor Node está rodando no terminal:\nnode server.js');
  }
};

document.getElementById('form-gourmet')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const apartamento = document.getElementById('aptGourmet').value;
    const data = document.getElementById('dataGourmet').value;
    
    if (!apartamento || !data) return;

    const tbody = document.getElementById('lista-reservas-gourmet');
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #e2e8f0';
    
    tr.innerHTML = `
        <td style="padding: 10px;">${data.split('-').reverse().join('/')}</td>
        <td style="padding: 10px;">${apartamento}</td>
        <td style="padding: 10px;"><button type="button" onclick="this.parentElement.parentElement.remove()" class="btn btn-danger" style="padding: 5px 10px;"><i class="fa-solid fa-trash"></i> Cancelar</button></td>
    `;
    
    tbody.appendChild(tr);
    document.getElementById('form-gourmet').reset();
});
