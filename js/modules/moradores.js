// ==========================================
// MORADORES.JS - Gestão de Moradores
// ==========================================

function exibirFormularioMorador() {
  const secLista = document.getElementById('sec-lista-moradores');
  const blocoForm = document.getElementById('blocoFormulario');
  if (secLista) secLista.style.display = 'none';
  if (blocoForm) blocoForm.style.display = 'block';
  prepararFotoMorador();
}

function exibirListaMoradores() {
  const formPeople = document.getElementById('editForm');
  if (formPeople) formPeople.reset();
  limparFotoMorador();
  
  const blocoForm = document.getElementById('blocoFormulario');
  const secLista = document.getElementById('sec-lista-moradores');
  if (blocoForm) blocoForm.style.display = 'none';
  if (secLista) secLista.style.display = 'block';
}

async function sincronizarMoradoresApi() {
    try {
      const portariaApi = window.PORTARIA_API_BASE || (location.protocol === 'file:' ? 'http://localhost:3001' : location.origin);
      const resposta = await fetch(`${portariaApi}/api/portaria/moradores`);
      if (!resposta.ok) throw new Error(`API de moradores respondeu ${resposta.status}.`);
      const dados = await resposta.json();
      const locais = DB.get('people');
      const porChave = new Map(locais.map(morador => [`${morador.cpf || ''}|${morador.email || morador.personalEmail || ''}`, morador]));
      dados.moradores.forEach(remoto => {
        const chave = `${remoto.cpf || ''}|${remoto.email || ''}`;
        const local = porChave.get(chave);
        const morador = {
          ...(local || {}),
          name: remoto.name,
          cpf: remoto.cpf || local?.cpf || '',
          email: remoto.email || local?.email || '',
          phone: remoto.phone || local?.phone || '',
          unit: remoto.unit,
          rg: remoto.rg || local?.rg || '',
          birthDate: remoto.birthDate || local?.birthDate || '',
          emergencyContact: remoto.emergencyContact || local?.emergencyContact || '',
          emergencyPhone: remoto.emergencyPhone || local?.emergencyPhone || '',
          resident: true,
          apiResidentId: remoto.id
        };
        const indice = locais.findIndex(item => (remoto.id && item.apiResidentId === remoto.id) || (chave !== '|' && `${item.cpf || ''}|${item.email || item.personalEmail || ''}` === chave));
        if (indice >= 0) locais[indice] = morador;
        else locais.push(morador);
      });
      DB.set('people', locais);
    } catch (erro) {
      console.warn('Não foi possível sincronizar moradores com a API:', erro.message);
    }
}

function atualizarMoradoresEncomenda(unidadeSelecionada) {
  const selectMorador = document.getElementById('select-morador');
  const inputDestinatario = document.getElementById('enc_destinatario');
  const listaUnidade = document.getElementById('lista-moradores-unidade');
  
  if (inputDestinatario) inputDestinatario.value = '';
  if (selectMorador) {
    selectMorador.innerHTML = '<option value="">-- Selecione o Morador --</option>';
  }
 
  if (!unidadeSelecionada) return;

  const moradores = DB.get('people');
  const moradoresDaUnidade = moradores.filter(m => m.unit === unidadeSelecionada);
  if (listaUnidade) {
    listaUnidade.innerHTML = moradoresDaUnidade.length
      ? `<span style="color:#64748b; font-size:0.9rem;">${moradoresDaUnidade.length} morador(es) encontrado(s) em ${unidadeSelecionada}.</span>`
      : '<span style="color:#b91c1c; font-size:0.9rem;">Nenhum morador cadastrado nesta unidade.</span>';
  }

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

function configurarFormularioMorador() {
  const formMorador = document.getElementById('editForm');
  if (!formMorador) return;

  prepararFotoMorador();
  formMorador.addEventListener('submit', (e) => {
    e.preventDefault();
    const fotoData = document.getElementById('field_photo_file')?.dataset.photoData || '';
    const lista = DB.get('people');
    const morador = {
      name: document.getElementById('field_name').value,
      cpf: document.getElementById('field_id1').value,
      rg: document.getElementById('field_rg')?.value || '',
      email: document.getElementById('field_personalEmail').value,
      phone: document.getElementById('field_mobilePhone').value,
      unit: document.getElementById('field_unit').value || 'Não selecionada',
      affinity: document.getElementById('field_affinity')?.value || '',
      resident: document.getElementById('field_resident')?.checked !== false,
      responsible: document.getElementById('field_responsible')?.checked === true,
      birthDate: document.getElementById('field_birthDate')?.value || '',
      ...(fotoData ? { photo: fotoData } : {})
    };
    lista.push(morador);
    DB.set('people', lista);
    const portariaApi = window.PORTARIA_API_BASE || (location.protocol === 'file:' ? 'http://localhost:3001' : location.origin);
    fetch(`${portariaApi}/api/portaria/moradores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(morador)
    }).catch(erro => console.warn('Não foi possível sincronizar o cadastro com a API:', erro.message));
    if (e.submitter?.name === 'saveAnother') {
      const unidade = morador.unit;
      formMorador.reset();
      limparFotoMorador();
      document.getElementById('field_unit').value = unidade;
      const buscaUnidade = document.getElementById('unit-search-input');
      if (buscaUnidade) buscaUnidade.value = unidade;
      prepararFotoMorador();
      alert(`Morador salvo. Cadastre o próximo morador da unidade ${unidade}.`);
    } else {
      exibirListaMoradores();
    }
  });
}

function prepararFotoMorador() {
  const input = document.getElementById('field_photo_file');
  const upload = document.getElementById('field_photo_upload');
  const camera = document.getElementById('field_photo_camera');
  const preview = document.getElementById('field_photo_preview');
  const status = document.getElementById('field_photo_status');
  if (!input || input.dataset.configured === 'true') return;
  input.dataset.configured = 'true';
  upload?.addEventListener('click', () => input.click());
  camera?.addEventListener('click', abrirCameraMorador);
  input.addEventListener('change', () => {
    const arquivo = input.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      input.dataset.photoData = String(leitor.result);
      if (preview) {
        preview.src = input.dataset.photoData;
        preview.style.display = 'block';
      }
      if (status) {
        status.textContent = 'Foto pronta para o cadastro.';
        status.style.color = '#15803d';
      }
    };
    leitor.readAsDataURL(arquivo);
  });
}

let streamCameraMorador = null;

async function abrirCameraMorador() {
  const modal = document.getElementById('resident-photo-camera-modal');
  const video = document.getElementById('resident-photo-video');
  if (!modal || !video) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    alert('A câmera não está disponível neste navegador. Use Enviar foto.');
    return;
  }
  try {
    streamCameraMorador = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = streamCameraMorador;
    modal.hidden = false;
    modal.style.display = 'flex';
  } catch (erro) {
    alert(`Não foi possível abrir a câmera: ${erro.message}`);
  }
}

function fecharCameraMorador() {
  if (streamCameraMorador) {
    streamCameraMorador.getTracks().forEach(track => track.stop());
    streamCameraMorador = null;
  }
  const modal = document.getElementById('resident-photo-camera-modal');
  const video = document.getElementById('resident-photo-video');
  if (video) video.srcObject = null;
  if (modal) {
    modal.hidden = true;
    modal.style.display = 'none';
  }
}

function capturarFotoMorador() {
  const video = document.getElementById('resident-photo-video');
  const canvas = document.getElementById('resident-photo-canvas');
  const input = document.getElementById('field_photo_file');
  if (!video || !canvas || !input || !video.videoWidth) {
    alert('Aguarde a câmera iniciar antes de capturar.');
    return;
  }
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  input.dataset.photoData = dataUrl;
  const preview = document.getElementById('field_photo_preview');
  const status = document.getElementById('field_photo_status');
  if (preview) {
    preview.src = dataUrl;
    preview.style.display = 'block';
  }
  if (status) {
    status.textContent = 'Foto capturada pela câmera.';
    status.style.color = '#15803d';
  }
  fecharCameraMorador();
}

function limparFotoMorador() {
  const input = document.getElementById('field_photo_file');
  const preview = document.getElementById('field_photo_preview');
  const status = document.getElementById('field_photo_status');
  if (input) {
    input.value = '';
    delete input.dataset.photoData;
  }
  if (preview) {
    preview.removeAttribute('src');
    preview.style.display = 'none';
  }
  if (status) {
    status.textContent = 'Foto obrigatória para concluir o cadastro.';
    status.style.color = '#b91c1c';
  }
}

function renderTabelaMoradores() {
  const tablePeople = document.getElementById('table-people');
  if (!tablePeople) return;

  const people = DB.get('people');
  tablePeople.innerHTML = people.map((p, i) => `
    <tr class="resident-row">
      <td>
        <div class="resident-identity">
          <div class="resident-avatar">
            ${p.photo ? `<img src="${p.photo}" alt="Foto de ${p.name}">` : '<i class="fa-solid fa-user"></i>'}
          </div>
          <div>
            <strong>${p.name}</strong>
            <small>CPF: ${p.cpf || 'Não informado'}</small>
            <small>RG: ${p.rg || 'Não informado'}</small>
          </div>
        </div>
      </td>
      <td><span class="resident-unit">${p.unit || 'Não selecionada'}</span></td>
      <td>
        <div class="resident-contact">
          <span>${p.phone || p.mobilePhone || 'Telefone não informado'}</span>
          <span>${p.email || p.personalEmail || 'E-mail não informado'}</span>
        </div>
      </td>
      <td class="resident-actions">
        <button class="btn btn-primary resident-details-button" type="button" onclick="mostrarDetalhesMorador(${i})">Detalhes <i class="fa-solid fa-chevron-down"></i></button>
        <button class="btn btn-danger" type="button" onclick="deletarItem('people', ${i})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
    <tr id="resident-details-${i}" class="resident-details-row" hidden>
      <td colspan="4">
        <div class="resident-details-content">
          <span><strong>Afinidade:</strong> ${p.affinity || 'Não informada'}</span>
          <span><strong>Morador:</strong> ${p.resident === false ? 'Não' : 'Sim'}</span>
          <span><strong>Responsável:</strong> ${p.responsible ? 'Sim' : 'Não'}</span>
          <span><strong>Data de nascimento:</strong> ${p.birthDate || 'Não informada'}</span>
        </div>
      </td>
    </tr>
  `).join('');
}

function mostrarDetalhesMorador(index) {
  const linha = document.getElementById(`resident-details-${index}`);
  if (linha) linha.hidden = !linha.hidden;
}

// Exportações globais
window.exibirFormularioMorador = exibirFormularioMorador;
window.exibirListaMoradores = exibirListaMoradores;
window.atualizarMoradoresEncomenda = atualizarMoradoresEncomenda;
window.sincronizarMoradoresApi = sincronizarMoradoresApi;
window.configurarFormularioMorador = configurarFormularioMorador;
window.renderTabelaMoradores = renderTabelaMoradores;
window.mostrarDetalhesMorador = mostrarDetalhesMorador;
window.abrirCameraMorador = abrirCameraMorador;
window.fecharCameraMorador = fecharCameraMorador;
window.capturarFotoMorador = capturarFotoMorador;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('resident-photo-cancel')?.addEventListener('click', fecharCameraMorador);
  document.getElementById('resident-photo-capture')?.addEventListener('click', capturarFotoMorador);
});
