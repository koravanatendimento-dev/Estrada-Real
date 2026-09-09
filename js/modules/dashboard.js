// ==========================================
// DASHBOARD.JS - Indicadores e Renderização Geral
// ==========================================

function renderAll() {
  const parcels = DB.get('parcels');
  const people = DB.get('people');
  const vehicles = DB.get('vehicles');

  // Atualização dos Contadores
  const countParcelsEl = document.getElementById('count-parcels');
  if (countParcelsEl) {
    countParcelsEl.textContent = parcels.filter(p => p.status === 'Pendente').length;
  }
  
  const countPeopleEl = document.getElementById('count-people');
  if (countPeopleEl) {
    countPeopleEl.textContent = people.length;
  }

  const countVehiclesEl = document.getElementById('count-vehicles');
  if (countVehiclesEl) {
    countVehiclesEl.textContent = vehicles.length;
  }

  // Renderização dos Módulos Específicos
  if (typeof window.renderChipsAguardando === 'function') {
    window.renderChipsAguardando(parcels);
  }

  if (typeof window.renderCardsEncomendas === 'function') {
    window.renderCardsEncomendas(parcels);
  }

  if (typeof window.renderTabelaMoradores === 'function') {
    window.renderTabelaMoradores();
  }

  if (typeof window.renderTabelaVeiculos === 'function') {
    window.renderTabelaVeiculos();
  }

  if (typeof window.renderTabelaPets === 'function') {
    window.renderTabelaPets();
  }

  if (typeof window.renderTabelaAcessos === 'function') {
    window.renderTabelaAcessos();
  }

  if (typeof window.renderTabelaIncidentes === 'function') {
    window.renderTabelaIncidentes();
  }

  if (typeof window.renderTabelaTurnos === 'function') {
    window.renderTabelaTurnos();
  }

  if (typeof window.renderTabelaGourmet === 'function') {
    window.renderTabelaGourmet();
  }

  if (typeof window.renderFuncionarios === 'function') {
    window.renderFuncionarios();
  }
}

window.renderAll = renderAll;
