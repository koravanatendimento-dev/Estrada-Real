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
    return atualizada;
  });
  if (alterada) DB.set('parcels', normalizada);
}

function darBaixaEncomenda(id) {
  const pessoa = prompt("Digite o nome de quem retirou a encomenda:");
  if (!pessoa) return;

  const lista = DB.get('parcels');
  const encomenda = lista.find(item => item.id === id);
  if (encomenda) {
    encomenda.status = 'Retirado';
    encomenda.retiradoPor = pessoa;
    encomenda.dataRetirada = new Date().toLocaleString('pt-BR');
    DB.set('parcels', lista);
  }
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
    const codigoRastreio = `ZAP-${unicoId}`;

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

    fetch('http://localhost:3001/api/portaria/encomendas', {
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

      const itens = detalhes.querySelector('.pending-unit-items');
      encomendas.forEach((encomenda) => {
        const item = document.createElement('div');
        item.className = 'pending-parcel-item';
        item.innerHTML = `
          <div>
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

function darBaixaTodasEncomendas(ids) {
  if (!ids.length) return;
  const confirmacao = confirm(`Dar baixa em todas as ${ids.length} encomendas desta unidade?`);
  if (!confirmacao) return;

  const pessoa = prompt('Digite o nome de quem retirou as encomendas:');
  if (!pessoa || !pessoa.trim()) return;

  const idsSelecionados = new Set(ids);
  const lista = DB.get('parcels');
  lista.forEach((encomenda) => {
    if (idsSelecionados.has(encomenda.id) && encomenda.status === 'Pendente') {
      encomenda.status = 'Retirado';
      encomenda.retiradoPor = pessoa.trim();
      encomenda.dataRetirada = new Date().toLocaleString('pt-BR');
    }
  });
  DB.set('parcels', lista);
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
window.copiarCodigoEncomenda = copiarCodigoEncomenda;
window.darBaixaTodasEncomendas = darBaixaTodasEncomendas;
window.aplicarFiltrosEncomendas = aplicarFiltrosEncomendas;
window.configurarFormularioEncomenda = configurarFormularioEncomenda;
window.renderChipsAguardando = renderChipsAguardando;
window.renderCardsEncomendas = renderCardsEncomendas;
