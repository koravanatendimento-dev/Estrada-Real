// ==========================================
// VEICULOS.JS - Gestão de Veículos
// ==========================================

function configurarFormularioVeiculos() {
  const formVehicle = document.getElementById('form-vehicle');
  if (!formVehicle) return;

  formVehicle.addEventListener('submit', (e) => {
    e.preventDefault();
    const lista = DB.get('vehicles');
    lista.push({
      model: document.getElementById('v-model').value,
      plate: document.getElementById('v-plate').value,
      unit: document.getElementById('v-unit').value,
      owner: document.getElementById('v-owner').value,
      color: document.getElementById('v-color').value
    });
    DB.set('vehicles', lista);
    e.target.reset();
  });
}

function renderTabelaVeiculos() {
  const tableVehicles = document.getElementById('table-vehicles');
  if (!tableVehicles) return;

  tableVehicles.innerHTML = DB.get('vehicles').map((v, i) => `
    <tr class="vehicle-row">
      <td><strong>${v.model}</strong><small>Placa: ${v.plate}</small><small>Cor: ${v.color || 'Não informada'}</small></td>
      <td>${v.unit || v.owner || '-'}</td>
      <td>${v.owner || '-'}</td>
      <td class="vehicle-actions"><button class="btn btn-primary" type="button"><i class="fa-solid fa-eye"></i> Visualizar</button><button class="btn btn-danger" onclick="deletarItem('vehicles', ${i})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');
}

window.configurarFormularioVeiculos = configurarFormularioVeiculos;
window.renderTabelaVeiculos = renderTabelaVeiculos;
