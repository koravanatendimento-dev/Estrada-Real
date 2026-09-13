// ==========================================
// ENCOMENDAS.JS - Gestão de Encomendas
// ==========================================

function exibirFormularioEncomenda() {
  const secLista = document.getElementById('sec-lista-encomendas');
  const secIA = document.getElementById('sec-registrar-ia');
  const secCad = document.getElementById('sec-cadastrar-encomenda');

  if (secLista) secLista.style.display = 'none';
  if (secIA) secIA.style.display = 'none';
  if (secCad) secCad.style.display = 'block';
}

function exibirListaEncomendas() {
  if (typeof window.fecharModalCameraIA === 'function') window.fecharModalCameraIA();
  if (typeof window.desligarCamera === 'function') window.desligarCamera();

  const formEnc = document.getElementById('encomendaForm');
  if (formEnc) formEnc.reset();

  const imgPreview = document.getElementById('captured-photo');
  if (imgPreview) imgPreview.style.display = 'none';

  const secIA = document.getElementById('sec-registrar-ia');
  if (secIA) secIA.style.display = 'none';

  const secCad = document.getElementById('sec-cadastrar-encomenda');
  if (secCad) secCad.style.display = 'none';

  const secLista = document.getElementById('sec-lista-encomendas');
  if (secLista) secLista.style.display = 'block';
}

function selecionarTipo(btn, tipo) {
  document.querySelectorAll('.tipo-pacote').forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-secondary');
  });
  btn.classList.remove('btn-secondary');
  btn.classList.add('btn-primary');

  const inputTipo = document.getElementById('enc_tipo');
  if (inputTipo) inputTipo.value = tipo;
}

function selecionarTransportadora(card, nome) {
  document.querySelectorAll('.transp-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');

  const inputTransp = document.getElementById('enc_transportadora');
  if (inputTransp) inputTransp.value = nome;
}

function gerarProtocoloEncomenda() {
  const agora = new Date();
  const data = [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, '0'),
    String(agora.getDate()).padStart(2, '0')
  ].join('');
  const sequencia = String(Date.now()).slice(-6);
  return `PRT-${data}-${sequencia}`;
}

function gerarCodigoRetirada() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let indice = 0; indice < 6; indice += 1) {
    codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return codigo;
}

function normalizarProtocolosEncomendas() {
  const lista = DB.get('parcels');
  let alterada = false;
  const normalizada = lista.map((encomenda, index) => {
    const atualizada = { ...encomenda };
    if (!atualizada.id) {
      atualizada.id = `legado-${Date.now()}-${index}`;
      alterada = true;
    }
    if (!atualizada.protocolo || atualizada.protocolo === '-') {
      atualizada.protocolo = `PRT-LEG-${String(atualizada.id).slice(-8)}`;
      alterada = true;
    }
    if (!/^[A-Z0-9]{6}$/.test(String(atualizada.code || '').toUpperCase())) {
      atualizada.code = gerarCodigoRetirada();
      alterada = true;
    } else {
      atualizada.code = String(atualizada.code).toUpperCase();
    }
    return atualizada;
  });
  if (alterada) DB.set('parcels', normalizada);
}

async function darBaixaEncomenda(id) {
  await iniciarEntregaPorQr(id);
}

async function iniciarEntregaPorQr(idInicial = null) {
  const pendentes = DB.get('parcels').filter(item => item.status === 'Pendente');
  if (!pendentes.length) return;
  const candidatos = idInicial ? pendentes.filter(item => item.id === idInicial) : pendentes;
  const lido = await lerQrParaEntrega(candidatos);
  if (!lido) return;
  const primeiro = pendentes.find(item => item.id === lido);
  if (primeiro) abrirSelecaoRetirada(primeiro.unit, primeiro.id);
}

function abrirSelecaoRetirada(unidade, idInicial) {
  const encomendas = DB.get('parcels').filter(item => item.status === 'Pendente' && item.unit === unidade);
  const moradores = DB.get('people').filter(item => item.unit === unidade && item.name).map(item => item.name);
  const nomesUnicos = [...new Set(moradores)];
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.78);z-index:10000;display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto';
  modal.innerHTML = `<form class="retirada-modal" style="background:#fff;border-radius:14px;padding:20px;max-width:620px;width:100%;max-height:calc(100vh - 24px);overflow-y:auto;box-shadow:0 18px 50px rgba(0,0,0,.28)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><h3 style="margin:0 0 4px">Retirada de encomendas</h3><small style="color:#64748b">Unidade: ${unidade}</small></div>
      <button type="button" class="btn btn-secondary cancelar-retirada" aria-label="Fechar">✕</button>
    </div>
    <section style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <strong>1. O que está sendo retirado?</strong>
        <div style="display:flex;gap:6px"><button type="button" class="btn btn-secondary selecionar-todas">Selecionar todas</button><button type="button" class="btn btn-secondary limpar-selecao">Limpar seleção</button></div>
      </div>
      <div class="retirada-itens" style="display:grid;gap:8px;margin-top:10px">${encomendas.map(item => `<label class="retirada-item" style="display:flex;align-items:center;gap:10px;padding:11px;border:1px solid #dbeafe;border-radius:8px;cursor:pointer;background:${item.id === idInicial ? '#eff6ff' : '#fff'}"><input type="checkbox" value="${item.id}" ${item.id === idInicial ? 'checked' : ''} style="width:19px;height:19px;flex:0 0 auto"><span style="min-width:0"><strong style="display:block">${item.dest || 'Morador'}</strong><small style="display:block;color:#64748b">Protocolo: ${item.protocolo || 'Não informado'} · Código: ${item.code}</small></span></label>`).join('')}</div>
    </section>
    <section style="margin-top:18px">
      <strong>2. Quem está retirando?</strong>
      <div class="retirada-moradores" style="display:grid;gap:8px;margin-top:10px">${nomesUnicos.length ? nomesUnicos.map((nome, index) => `<label style="display:flex;align-items:center;gap:10px;padding:11px;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer"><input type="radio" name="retiradoPor" value="${nome.replace(/"/g, '&quot;')}" ${index === 0 ? 'checked' : ''} style="width:19px;height:19px"><span>${nome}</span></label>`).join('') : '<p style="color:#b91c1c;margin:8px 0">Nenhum morador cadastrado nesta unidade.</p>'}</div>
      <input name="retiradoPorManual" placeholder="Ou digite outro nome" style="margin-top:10px;width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:8px">
    </section>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px;position:sticky;bottom:0;background:#fff;padding-top:10px;border-top:1px solid #e2e8f0"><button type="button" class="btn btn-secondary cancelar-retirada">Cancelar</button><button class="btn btn-success">Confirmar entrega</button></div>
  </form>`;
  document.body.appendChild(modal);
  const form = modal.querySelector('form');
  const caixas = () => [...modal.querySelectorAll('.retirada-itens input[type="checkbox"]')];
  modal.querySelectorAll('.cancelar-retirada').forEach(button => { button.onclick = () => modal.remove(); });
  modal.querySelector('.selecionar-todas').onclick = () => caixas().forEach(input => { input.checked = true; input.closest('.retirada-item').style.background = '#eff6ff'; });
  modal.querySelector('.limpar-selecao').onclick = () => caixas().forEach(input => { input.checked = false; input.closest('.retirada-item').style.background = '#fff'; });
  caixas().forEach(input => input.addEventListener('change', () => { input.closest('.retirada-item').style.background = input.checked ? '#eff6ff' : '#fff'; }));
  form.onsubmit = event => {
    event.preventDefault();
    const ids = [...modal.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
    const pessoaManual = modal.querySelector('[name="retiradoPorManual"]').value.trim();
    const pessoaSelecionada = modal.querySelector('input[name="retiradoPor"]:checked')?.value || '';
    const pessoa = pessoaManual || pessoaSelecionada;
    if (!ids.length || !pessoa) return;
    registrarRetirada(ids, pessoa);
    modal.remove();
  };
}

function registrarRetirada(ids, pessoa) {
  const selecionados = new Set(ids);
  const lista = DB.get('parcels');
  lista.forEach((encomenda) => {
    if (selecionados.has(encomenda.id) && encomenda.status === 'Pendente') {
      encomenda.status = 'Retirado';
      encomenda.retiradoPor = pessoa;
      encomenda.dataRetirada = new Date().toLocaleString('pt-BR');
    }
  });
  DB.set('parcels', lista);
  if (typeof window.renderAll === 'function') window.renderAll();
}

async function lerQrParaEntrega(candidatos) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.82);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = '<div style="background:#fff;border-radius:12px;padding:18px;max-width:520px;width:100%;text-align:center"><h3>Baixar encomenda</h3><video autoplay playsinline style="width:100%;border-radius:8px;background:#000"></video><p class="qr-reader-status">Aponte a câmera para o QR Code ou informe o código de 6 caracteres.</p><div style="display:flex;gap:8px;margin:10px 0"><input class="codigo-retirada-manual" maxlength="6" pattern="[A-Za-z0-9]{6}" placeholder="Código (6 caracteres)" style="flex:1;padding:10px;text-transform:uppercase"><button type="button" class="btn btn-primary confirmar-codigo">Usar código</button></div><button type="button" class="btn btn-secondary cancelar-leitura">Cancelar</button></div>';
  document.body.appendChild(modal);
  const video = modal.querySelector('video');
  const status = modal.querySelector('.qr-reader-status');
  const detector = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let stream;
  let ativo = true;
  let resultadoManual = null;
  const fechar = () => { ativo = false; stream?.getTracks().forEach(track => track.stop()); modal.remove(); };
  modal.querySelector('.cancelar-leitura').addEventListener('click', fechar);
  modal.querySelector('.confirmar-codigo').addEventListener('click', () => {
    const codigo = modal.querySelector('.codigo-retirada-manual').value.trim().toUpperCase();
    const encontrado = candidatos.find(item => item.code.toUpperCase() === codigo);
    if (encontrado) { resultadoManual = encontrado.id; fechar(); }
    else status.textContent = 'Código não encontrado entre as encomendas pendentes.';
  });
  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = 'Câmera indisponível. Informe o código de 6 caracteres.';
    return new Promise(resolve => {
      modal.querySelector('.confirmar-codigo').addEventListener('click', () => resolve(resultadoManual), { once: true });
    });
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    while (ativo) {
      let rawValue = '';
      if (detector) {
        const codes = await detector.detect(video);
        rawValue = codes[0]?.rawValue || '';
      } else if (video.readyState >= 2 && window.jsQR) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        rawValue = context.getImageData(0, 0, canvas.width, canvas.height);
        rawValue = window.jsQR(rawValue.data, rawValue.width, rawValue.height)?.data || '';
      }
      if (rawValue) {
        const partes = String(rawValue).split('|');
        const encontrados = partes[1] === 'RETIRADA_MULTIPLA' ? partes[2].split(',') : [partes[2]];
        const encontrado = candidatos.find(item => encontrados.includes(item.id) || encontrados.includes(item.code));
        if (encontrado) { fechar(); return encontrado.id; }
        status.textContent = 'QR Code não corresponde à encomenda selecionada.';
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  } catch (error) {
    console.error('Não foi possível abrir a câmera para leitura do QR Code:', error);
    status.textContent = 'Não foi possível abrir a câmera. Verifique a permissão.';
  }
  return resultadoManual;
}

async function copiarCodigoEncomenda(codigo) {
  try {
    await navigator.clipboard.writeText(codigo);
    alert('Código de retirada copiado.');
  } catch (erro) {
    console.error('Não foi possível copiar o código da encomenda:', erro);
    prompt('Copie o código de retirada:', codigo);
  }
}

function aplicarFiltrosEncomendas() {
  if (typeof window.renderAll === 'function') {
    window.renderAll();
  }
}

function configurarFormularioEncomenda() {
  const formEncomenda = document.getElementById('encomendaForm');
  if (!formEncomenda) return;

  normalizarProtocolosEncomendas();
  formEncomenda.addEventListener('submit', (e) => {
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
    const protocoloInformado = document.getElementById('enc_protocolo')?.value.trim();
    const morador = DB.get('people').find(item => item.name === nomeDestinatario && item.unit === unit) || {};
    
    const unicoId = Date.now().toString().slice(-5) + Math.floor(10 + Math.random() * 90);
    const codigoRastreio = gerarCodigoRetirada();

    const novaEncomenda = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      unit: unit,
      dest: nomeDestinatario,
      tipo: tipo,
      carrier: carrier,
      code: codigoRastreio,
      date: new Date().toLocaleString('pt-BR'),
      status: 'Pendente',
      photo: document.getElementById('enc_foto_data')?.value || null,
      protocolo: protocoloInformado || gerarProtocoloEncomenda(),
      anotacoes: document.getElementById('enc_anotacoes')?.value.trim() || '',
      email: morador.email || morador.personalEmail || '',
      phone: morador.phone || morador.mobilePhone || ''
    };

    const lista = DB.get('parcels');
    lista.unshift(novaEncomenda);
    DB.set('parcels', lista);

    const portariaApi = window.PORTARIA_API_BASE || (location.protocol === 'file:' ? 'http://localhost:3001' : location.origin);
    fetch(`${portariaApi}/api/portaria/encomendas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaEncomenda)
    }).then((resposta) => {
      if (!resposta.ok) throw new Error(`API de moradores respondeu ${resposta.status}.`);
      return resposta.json();
    }).catch((erro) => {
      console.error('Não foi possível sincronizar a encomenda com a API dos moradores:', erro);
    });

    exibirListaEncomendas();
  });
}

function renderChipsAguardando(parcels) {
  const containerChips = document.getElementById('container-chips-aguardando');
  const boxAguardando = document.getElementById('box-aguardando-retirada');
  const pendentes = parcels.filter(p => p.status === 'Pendente');

  if (!containerChips || !boxAguardando) return;

  if (pendentes.length === 0) {
    boxAguardando.style.display = 'block';
    containerChips.innerHTML = '<p class="pending-empty-message">Nenhuma encomenda aguardando retirada.</p>';
  } else {
    boxAguardando.style.display = 'block';
    containerChips.innerHTML = '';
    const porUnidade = {};
    pendentes.forEach(p => {
      if (!porUnidade[p.unit]) porUnidade[p.unit] = [];
      porUnidade[p.unit].push(p);
    });

    Object.entries(porUnidade).forEach(([unidade, encomendas]) => {
      const grupo = document.createElement('div');
      grupo.className = 'pending-unit-group';

      const resumo = document.createElement('button');
      resumo.type = 'button';
      resumo.className = 'pending-unit-summary';
      resumo.innerHTML = `
        <span>${unidade}</span>
        <span class="badge warning">${encomendas.length}</span>
      `;

      const detalhes = document.createElement('div');
      detalhes.className = 'pending-unit-details';
      detalhes.hidden = true;
      detalhes.innerHTML = `
        <div class="pending-unit-actions">
          <span>${encomendas.length} ${encomendas.length === 1 ? 'encomenda aguardando retirada' : 'encomendas aguardando retirada'}</span>
          <button class="btn btn-secondary pending-bulk-qr" type="button">
            <i class="fa-solid fa-qrcode"></i> QR das selecionadas
          </button>
          <button class="btn btn-success pending-bulk-delivery" type="button">
            <i class="fa-solid fa-check-double"></i> Dar baixa em todas
          </button>
        </div>
        <div class="pending-unit-items"></div>
      `;

      resumo.addEventListener('click', () => {
        detalhes.hidden = !detalhes.hidden;
        resumo.classList.toggle('expanded', !detalhes.hidden);
        grupo.classList.toggle('expanded', !detalhes.hidden);
      });

      detalhes.querySelector('.pending-bulk-delivery').addEventListener('click', () => {
        darBaixaTodasEncomendas(encomendas.map(encomenda => encomenda.id));
      });
      detalhes.querySelector('.pending-bulk-qr').addEventListener('click', () => {
        const selecionadas = [...detalhes.querySelectorAll('input[type="checkbox"]:checked')]
          .map(input => encomendas.find(encomenda => encomenda.id === input.value))
          .filter(Boolean);
        gerarQrUnicoEncomendas(selecionadas);
      });

      const itens = detalhes.querySelector('.pending-unit-items');
      encomendas.forEach((encomenda) => {
        const item = document.createElement('div');
        item.className = 'pending-parcel-item';
        item.innerHTML = `
          <div>
            <label><input type="checkbox" value="${encomenda.id}" checked> Selecionar</label>
            <strong>${encomenda.dest || 'Morador não informado'}</strong>
            <small>Protocolo: ${encomenda.protocolo || gerarProtocoloEncomenda()}</small>
            <small>Código: ${encomenda.code || 'Não informado'} · ${encomenda.carrier || 'Origem não informada'}</small>
            ${encomenda.anotacoes ? `<small>Observação: ${encomenda.anotacoes}</small>` : ''}
          </div>
          <div class="parcel-identification">
            <img class="parcel-qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(`ZAPCONDO|ENCOMENDA|${encomenda.id}|${encomenda.unit}|${encomenda.protocolo}|${encomenda.code}`)}" alt="QR Code da encomenda">
            ${encomenda.photo ? `<img class="parcel-photo" src="${encomenda.photo}" alt="Foto da encomenda">` : ''}
          </div>
          <div class="pending-parcel-actions">
            <button class="btn btn-secondary parcel-copy-code" type="button" title="Copiar código"><i class="fa-solid fa-copy"></i></button>
            <button class="btn btn-success parcel-deliver" type="button"><i class="fa-solid fa-check"></i> Entregar</button>
          </div>
        `;
        item.querySelector('.parcel-copy-code').addEventListener('click', () => copiarCodigoEncomenda(encomenda.code));
        item.querySelector('.parcel-deliver').addEventListener('click', () => darBaixaEncomenda(encomenda.id));
        itens.appendChild(item);
      });
      grupo.append(resumo, detalhes);
      containerChips.appendChild(grupo);
    });
  }
}

function gerarQrUnicoEncomendas(encomendas) {
    if (!encomendas.length) {
      alert('Selecione pelo menos uma encomenda.');
      return;
    }
    const payload = `ZAPCONDO|RETIRADA_MULTIPLA|${encomendas.map(item => item.id).join(',')}`;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(payload)}`;
    const janela = window.open('', '_blank', 'noopener,noreferrer');
    if (!janela) {
      alert('Permita pop-ups para exibir o QR Code de retirada.');
      return;
    }
    janela.document.write(`<title>QR Code de retirada</title><body style="font-family:Arial;text-align:center;padding:24px"><h1>Retirada de encomendas</h1><p>${encomendas.length} encomenda(s) selecionada(s)</p><img src="${url}" alt="QR Code único de retirada"></body>`);
    janela.document.close();
}

function darBaixaTodasEncomendas(ids) {
  if (!ids.length) return;
  iniciarEntregaPorQr(ids[0]);
}

function renderCardsEncomendas(parcels) {
  const containerCards = document.getElementById('container-cards-encomendas');
  if (!containerCards) return;
  containerCards.replaceChildren();
  if (!parcels.length) {
    containerCards.innerHTML = '<p class="pending-empty-message">Nenhuma encomenda registrada.</p>';
    return;
  }
  parcels.forEach((encomenda) => {
    const card = document.createElement('article');
    card.className = 'parcel-history-card';
    card.innerHTML = `
      <div>
        <strong>${encomenda.dest || 'Morador não informado'}</strong>
        <small>${encomenda.unit || 'Unidade não informada'} · ${encomenda.date || ''}</small>
        <small>Protocolo: ${encomenda.protocolo || 'Não informado'} · Código: ${encomenda.code || 'Não informado'}</small>
      </div>
      <span class="badge ${encomenda.status === 'Retirado' ? 'success' : 'warning'}">${encomenda.status || 'Pendente'}</span>
    `;
    containerCards.appendChild(card);
  });
}

// Exportações globais
window.exibirFormularioEncomenda = exibirFormularioEncomenda;
window.exibirListaEncomendas = exibirListaEncomendas;
window.selecionarTipo = selecionarTipo;
window.selecionarTransportadora = selecionarTransportadora;
window.darBaixaEncomenda = darBaixaEncomenda;
window.iniciarEntregaPorQr = iniciarEntregaPorQr;
window.copiarCodigoEncomenda = copiarCodigoEncomenda;
window.darBaixaTodasEncomendas = darBaixaTodasEncomendas;
window.gerarQrUnicoEncomendas = gerarQrUnicoEncomendas;
window.aplicarFiltrosEncomendas = aplicarFiltrosEncomendas;
window.configurarFormularioEncomenda = configurarFormularioEncomenda;
window.renderChipsAguardando = renderChipsAguardando;
window.renderCardsEncomendas = renderCardsEncomendas;
