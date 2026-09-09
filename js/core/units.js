// ==========================================
// UNITS.JS - Gestão de Unidades e Blocos
// ==========================================
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

function popularDropdownsUnidades() {
  const selectEnc = document.getElementById('enc_unit');
  const selectEncBlock = document.getElementById('enc_block');
  const selectEncApartment = document.getElementById('enc_apartment');
  const selectFilter = document.getElementById('filter_unit_enc');
  const selectsUnidade = [
    document.getElementById('v-unit'),
    document.getElementById('pet-unit'),
    document.getElementById('acc-unit'),
    document.getElementById('inc-unit'),
    document.getElementById('field_unit')
  ].filter(Boolean);

  if (selectFilter) selectFilter.innerHTML = '<option value="">Todas as Unidades</option>';
  if (selectEnc) selectEnc.innerHTML = '<option value="">Selecione a unidade...</option>';
  if (selectEncBlock) selectEncBlock.innerHTML = '<option value="">Selecione o bloco...</option>';
  if (selectEncApartment) selectEncApartment.innerHTML = '<option value="">Selecione o apartamento...</option>';
  selectsUnidade.forEach(select => {
    select.innerHTML = '<option value="">Selecione a unidade...</option>';
  });

  listaUnidades.forEach(u => {
      if (selectEnc) {
      const opt = document.createElement('option');
      opt.value = u;
      opt.textContent = u;
      selectEnc.appendChild(opt);
      }

      if (selectFilter) {
        const optFlt = document.createElement('option');
        optFlt.value = u;
        optFlt.textContent = u;
        selectFilter.appendChild(optFlt);
      }
      selectsUnidade.forEach(select => {
        select.appendChild(new Option(u, u));
      });

  });

  const blocos = [...new Set(listaUnidades.map(u => u.match(/\((BLOCO [^)]+)\)/)?.[1]).filter(Boolean))];
  const apartamentos = [...new Set(listaUnidades.map(u => u.split(' ')[0]))];
  blocos.forEach(bloco => selectEncBlock?.appendChild(new Option(bloco, bloco)));
  apartamentos.forEach(apto => selectEncApartment?.appendChild(new Option(apto, apto)));

  const atualizarUnidadeEncomenda = () => {
    const bloco = selectEncBlock?.value || '';
    const apartamento = selectEncApartment?.value || '';
    const unidade = bloco && apartamento ? `${apartamento} (${bloco})` : '';
    if (selectEnc) selectEnc.value = unidade;
    if (typeof window.atualizarMoradoresEncomenda === 'function') {
      window.atualizarMoradoresEncomenda(unidade);
    }
  };
  selectEncBlock?.addEventListener('change', atualizarUnidadeEncomenda);
  selectEncApartment?.addEventListener('change', atualizarUnidadeEncomenda);

  const selectAcesso = document.getElementById('acc-unit');
  const selectIncidente = document.getElementById('inc-unit');
  [selectAcesso, selectIncidente].filter(Boolean).forEach(select => {
    select.insertBefore(new Option('Área comum', 'Área comum'), select.options[1] || null);
  });

  if (selectEnc) {
    selectEnc.addEventListener('change', (e) => {
      if (typeof window.atualizarMoradoresEncomenda === 'function') {
        window.atualizarMoradoresEncomenda(e.target.value);
      }
    });
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
      if (unitSearchInput) unitSearchInput.value = unit;
      if (hiddenUnitInput) hiddenUnitInput.value = unit;
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

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-dropdown-container')) {
    const unitListEl = document.getElementById('unit-dropdown-list');
    if (unitListEl) unitListEl.style.display = 'none';
  }
});

// Busca ao digitar na caixa de unidade
document.addEventListener('DOMContentLoaded', () => {
  gerarUnidades();
  popularDropdownsUnidades();
  const unitSearchInput = document.getElementById('unit-search-input');
  if (unitSearchInput) {
    unitSearchInput.addEventListener('input', (e) => {
      const unitListEl = document.getElementById('unit-dropdown-list');
      if (unitListEl) unitListEl.style.display = 'block';
      renderUnitDropdown(e.target.value);
    });
  }
});

// Exportações globais
window.listaUnidades = listaUnidades;
window.gerarUnidades = gerarUnidades;
window.popularDropdownsUnidades = popularDropdownsUnidades;
window.renderUnitDropdown = renderUnitDropdown;
window.toggleUnitDropdown = toggleUnitDropdown;
