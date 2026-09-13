// ==========================================
// INCIDENTES.JS - Registro de Ocorrências e Incidentes
// ==========================================

function configurarFormularioIncidentes() {
  const formIncident = document.getElementById('form-incident');
  if (!formIncident) return;

  formIncident.addEventListener('submit', (e) => {
    e.preventDefault();
    const lista = DB.get('incidents');
    lista.push({
      date: new Date().toLocaleString('pt-BR'),
      title: document.getElementById('inc-title').value,
      type: document.getElementById('inc-type')?.value || 'Outro',
      unit: document.getElementById('inc-unit').value,
      desc: document.getElementById('inc-desc').value
    });
    DB.set('incidents', lista);
    const apiBase = window.PORTARIA_API_BASE || (location.protocol === 'file:' ? 'http://localhost:3001' : location.origin);
    fetch(`${apiBase}/api/portaria/ocorrencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: document.getElementById('inc-title').value, type: document.getElementById('inc-type')?.value || 'Outro', unit: document.getElementById('inc-unit').value, description: document.getElementById('inc-desc').value })
    }).catch(error => console.warn('Não foi possível sincronizar a ocorrência:', error.message));
    e.target.reset();
  });
}

function renderTabelaIncidentes() {
  const tableIncidents = document.getElementById('table-incidents');
  if (!tableIncidents) return;

  tableIncidents.innerHTML = DB.get('incidents').map((inc, i) => `
    <tr>
      <td>${inc.date}</td>
      <td><span class="incident-type">${inc.type || 'Outro'}</span><strong>${inc.title}</strong></td>
      <td>${inc.unit}</td>
      <td>${inc.desc}</td>
      <td><button class="btn btn-danger" onclick="deletarItem('incidents', ${i})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');
  const apiBase = window.PORTARIA_API_BASE || (location.protocol === 'file:' ? 'http://localhost:3001' : location.origin);
  fetch(`${apiBase}/api/portaria/ocorrencias`).then(response => response.ok ? response.json() : null).then(data => {
    if (!data?.ocorrencias?.length) return;
    tableIncidents.innerHTML = data.ocorrencias.map(inc => `<tr><td>${new Date(inc.createdAt).toLocaleString('pt-BR')}</td><td><span class="incident-type">${inc.type}</span><strong>${inc.title}</strong></td><td>${inc.unit || 'Não informado'}</td><td>${inc.description}</td><td><span class="badge">${inc.status}</span></td></tr>`).join('') + tableIncidents.innerHTML;
  }).catch(error => console.warn('Não foi possível carregar ocorrências do app:', error.message));
}

window.configurarFormularioIncidentes = configurarFormularioIncidentes;
window.renderTabelaIncidentes = renderTabelaIncidentes;
