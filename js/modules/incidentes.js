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
}

window.configurarFormularioIncidentes = configurarFormularioIncidentes;
window.renderTabelaIncidentes = renderTabelaIncidentes;
