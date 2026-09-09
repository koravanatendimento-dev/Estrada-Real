// ==========================================
// PETS.JS - Gestão de Pets do Condomínio
// ==========================================

function configurarFormularioPets() {
  const formPet = document.getElementById('form-pet');
  if (!formPet) return;

  formPet.addEventListener('submit', (e) => {
    e.preventDefault();
    const lista = DB.get('pets');
    lista.push({
      name: document.getElementById('pet-name').value,
      breed: document.getElementById('pet-breed').value,
      unit: document.getElementById('pet-unit').value
    });
    DB.set('pets', lista);
    e.target.reset();
  });
}

function renderTabelaPets() {
  const tablePets = document.getElementById('table-pets');
  if (!tablePets) return;

  tablePets.innerHTML = DB.get('pets').map((pt, i) => `
    <tr>
      <td>${pt.name}</td>
      <td>${pt.breed}</td>
      <td>${pt.unit}</td>
      <td><button class="btn btn-danger" onclick="deletarItem('pets', ${i})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');
}

window.configurarFormularioPets = configurarFormularioPets;
window.renderTabelaPets = renderTabelaPets;
