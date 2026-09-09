// BANCO DE DADOS EM LOCALSTORAGE (Legado)
let encomendas;
try {
  const encLocal = localStorage.getItem('zapcondo_encomendas');
  encomendas = (encLocal && encLocal !== 'undefined' && encLocal !== 'null') ? JSON.parse(encLocal) : null;
} catch (e) {
  encomendas = null;
}
if (!encomendas || !Array.isArray(encomendas)) {
  encomendas = [
    {
      id: '1819032',
      unidade: '902 (BLOCO 01)',
      ap: '902',
      bloco: '01',
      morador: 'Veronica Paixão',
      origem: 'Amazon',
      tipo: 'Pacote',
      codigo: 'ZAP-9021',
      dataRecebimento: '02/09/2026',
      status: 'Retirado',
      retiradoPor: 'Livia Lima Teixeira',
      dataRetirada: '02/09/2026 22:47'
    }
  ];
}

// ELEMENTOS DOM
const secLista = document.getElementById('sec-lista-encomendas');
const secCadastro = document.getElementById('sec-cadastrar-encomenda');
const secMoradores = document.getElementById('sec-moradores-terceiros');

const menuEncomendas = document.getElementById('menu-encomendas');
const menuMoradores = document.getElementById('menu-moradores');

const selectUnidadeZap = document.getElementById('select-unidade-zap');
const filterUnidade = document.getElementById('filter-unidade');
const cgSelectUnidade = document.getElementById('cg-select-unidade');

// NAVEGAÇÃO ENTRE TELAS
function resetMenu() {
  document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
  secLista.classList.add('hidden');
  secCadastro.classList.add('hidden');
  secMoradores.classList.add('hidden');
}

menuEncomendas.onclick = () => { resetMenu(); menuEncomendas.classList.add('active'); secLista.classList.remove('hidden'); renderizar(); };
menuMoradores.onclick = () => { resetMenu(); menuMoradores.classList.add('active'); secMoradores.classList.remove('hidden'); };
document.getElementById('btn-abrir-cadastro').onclick = () => { secLista.classList.add('hidden'); secCadastro.classList.remove('hidden'); };
document.getElementById('btn-voltar-lista').onclick = () => { secCadastro.classList.add('hidden'); secLista.classList.remove('hidden'); };

// POPULAR DROPDOWNS DE UNIDADES (72 Unidades)
function popularUnidades() {
  const blocos = ['01', '02'];
  blocos.forEach(bloco => {
    for (let andar = 1; andar <= 9; andar++) {
      for (let ap = 1; ap <= 4; ap++) {
        const numAp = `${andar}0${ap}`;
        const valFull = `${numAp} (BLOCO ${bloco})`;

        [selectUnidadeZap, cgSelectUnidade].forEach(select => {
          const opt = document.createElement('option');
          opt.value = valFull;
          opt.textContent = valFull;
          select.appendChild(opt);
        });

        const optFlt = document.createElement('option');
        optFlt.value = numAp;
        optFlt.textContent = valFull;
        filterUnidade.appendChild(optFlt);
      }
    }
  });
}

// ETAPAS DO FORMULÁRIO DE CADASTRAR ENCOMENDA
selectUnidadeZap.onchange = () => {
  document.getElementById('step-moradores').classList.remove('hidden');
  document.getElementById('step-detalhes').classList.remove('hidden');
  document.getElementById('step-salvar').classList.remove('hidden');
};

// CADASTRAR NOVA ENCOMENDA
document.getElementById('form-zap-encomenda').onsubmit = (e) => {
  e.preventDefault();

  const valUnidade = selectUnidadeZap.value;
  const match = valUnidade.match(/(\d+)\s*\(BLOCO\s*(\d+)\)/);
  const ap = match ? match[1] : '';
  const bloco = match ? match[2] : '';

  const novaEncomenda = {
    id: Date.now().toString().slice(-6),
    unidade: valUnidade,
    ap: ap,
    bloco: bloco,
    morador: document.getElementById('nome-morador-zap').value,
    tipo: document.getElementById('tipo-encomenda').value,
    origem: document.getElementById('origem-encomenda').value,
    codigo: `ZAP-${ap}${Math.floor(Math.random() * 10)}`,
    dataRecebimento: new Date().toLocaleDateString('pt-BR'),
    status: 'Pendente',
    retiradoPor: null,
    dataRetirada: null
  };

  encomendas.unshift(novaEncomenda);
  salvarECarregar();

  document.getElementById('form-zap-encomenda').reset();
  document.getElementById('step-moradores').classList.add('hidden');
  document.getElementById('step-detalhes').classList.add('hidden');
  document.getElementById('step-salvar').classList.add('hidden');

  menuEncomendas.click();
};

// DAR BAIXA / RETIRAR ENCOMENDA
function darBaixaEncomenda(id) {
  const nomeQuemRetirou = prompt("Digite o nome da pessoa que está retirando:");
  if (!nomeQuemRetirou) return;

  const enc = encomendas.find(e => e.id === id);
  if (enc) {
    enc.status = 'Retirado';
    enc.retiradoPor = nomeQuemRetirou;
    enc.dataRetirada = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    salvarECarregar();
  }
}

// SALVAR NO LOCALSTORAGE E ATUALIZAR INTERFACE
function salvarECarregar() {
  localStorage.setItem('zapcondo_encomendas', JSON.stringify(encomendas));
  renderizar();
}

// RENDERIZAR LISTA DE ENCOMENDAS E PAINEL DE PENDÊNCIAS
function renderizar() {
  const containerLista = document.getElementById('lista-encomendas-cadastradas');
  const containerChips = document.getElementById('container-chips-aguardando');
  const boxAguardando = document.getElementById('box-aguardando-retirada');

  containerLista.innerHTML = '';
  containerChips.innerHTML = '';

  // 1. Atualizar Caixa Aguardando Retirada
  const pendentes = encomendas.filter(e => e.status === 'Pendente');
  
  if (pendentes.length === 0) {
    boxAguardando.classList.add('hidden');
  } else {
    boxAguardando.classList.remove('hidden');
    const contagem = {};

    pendentes.forEach(e => {
      const key = `${e.ap}_${e.bloco}`;
      if (!contagem[key]) contagem[key] = { ap: e.ap, bloco: e.bloco, qtd: 0 };
      contagem[key].qtd++;
    });

    ['01', '02'].forEach(b => {
      const itensBloco = Object.values(contagem).filter(i => i.bloco === b);
      if (itensBloco.length > 0) {
        const labelBloco = document.createElement('span');
        labelBloco.className = 'label-bloco';
        labelBloco.style.color = b === '01' ? '#d97706' : '#0284c7';
        labelBloco.textContent = `BLOCO ${b}`;
        containerChips.appendChild(labelBloco);

        itensBloco.forEach(item => {
          const btnChip = document.createElement('button');
          btnChip.className = `chip-ap ${b === '01' ? 'chip-ap-b1' : 'chip-ap-b2'}`;
          btnChip.innerHTML = `${item.ap} <span class="chip-badge">${item.qtd}</span>`;
          btnChip.onclick = () => {
            filterUnidade.value = item.ap;
            aplicarFiltros();
          };
          containerChips.appendChild(btnChip);
        });
      }
    });
  }

  // 2. Renderizar Cards de Encomendas
  encomendas.forEach(e => {
    const isPendente = e.status === 'Pendente';
    const card = document.createElement('div');
    card.className = 'package-card';
    card.setAttribute('data-unidade', e.unidade);
    card.setAttribute('data-status', e.status);

    card.innerHTML = `
      <div class="package-header">
        <span>${e.unidade}</span>
        <span class="badge-status ${isPendente ? 'status-pendente' : 'status-retirado'}">${e.status}</span>
      </div>
      <div class="package-body">
        <div class="package-img">📦</div>
        <div class="package-info-col">
          <span class="tag-type">${e.tipo}</span><br>
          <strong>Para:</strong> ${e.morador}<br>
          <strong>Origem:</strong> ${e.origem}<br>
          <strong>Código:</strong> <span style="color:#0284c7; font-weight:bold;">${e.codigo}</span><br>
          <small style="color:#64748b;">Recebido em: ${e.dataRecebimento} (Cód: ${e.id})</small>
        </div>
        <div class="package-info-col">
          ${isPendente ? `
            <button class="btn btn-green-main" style="width:100%;" onclick="darBaixaEncomenda('${e.id}')">
              ✅ Confirmar Retirada
            </button>
          ` : `
            <div style="background-color: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #f1f5f9;">
              <strong>Quem retirou:</strong> ${e.retiradoPor}<br>
              <small style="color:#64748b;">Entregue em: ${e.dataRetirada}</small>
            </div>
          `}
        </div>
      </div>
    `;
    containerLista.appendChild(card);
  });

  aplicarFiltros();
}

// FILTROS DE BUSCA E STATUS
function aplicarFiltros() {
  const unidadeSel = filterUnidade.value.toLowerCase();
  const termo = document.getElementById('filter-search').value.toLowerCase();
  const statusSel = document.querySelector('input[name="flt"]:checked').value;

  document.querySelectorAll('.package-card').forEach(card => {
    const uni = card.getAttribute('data-unidade').toLowerCase();
    const st = card.getAttribute('data-status');
    const txt = card.textContent.toLowerCase();

    const matchUni = !unidadeSel || uni.includes(unidadeSel);
    const matchTxt = !termo || txt.includes(termo);
    const matchSt = (statusSel === 'Todos') || (st === statusSel);

    card.style.display = (matchUni && matchTxt && matchSt) ? 'block' : 'none';
  });
}

document.getElementById('filter-unidade').onchange = aplicarFiltros;
document.getElementById('filter-search').oninput = aplicarFiltros;
document.querySelectorAll('input[name="flt"]').forEach(r => r.onchange = aplicarFiltros);

// INICIALIZAÇÃO
popularUnidades();
renderizar();

document.addEventListener('DOMContentLoaded', () => {
  const btnEstradaReal = document.getElementById('btn-select-estrada-real');
  btnEstradaReal?.addEventListener('click', () => {
    window.location.href = 'encomendas.html'; 
  });
});
