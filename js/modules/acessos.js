// ==========================================
// ACESSOS.JS - Controle de Entrada e Saída
// ==========================================

function configurarFormularioAcessos() {
  const formAccess = document.getElementById('form-access');
  if (!formAccess) return;

  formAccess.addEventListener('submit', async (e) => {
    e.preventDefault();
    const photoFile = document.getElementById('acc-photo')?.files?.[0];
    let photo = '';
    if (photoFile) {
      photo = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(photoFile);
      });
    }
    const access = {
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: document.getElementById('acc-type').value,
      desc: document.getElementById('acc-desc').value,
      unit: document.getElementById('acc-unit').value,
      photo
    };
    const lista = DB.get('access');
    lista.push(access);
    DB.set('access', lista);
    fetch('http://localhost:3001/api/portaria/acessos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(access)
    }).catch(error => console.warn('Não foi possível notificar os moradores da unidade:', error.message));
    e.target.reset();
  });
}

function renderTabelaAcessos() {
  const tableAccess = document.getElementById('table-access');
  if (!tableAccess) return;

  tableAccess.innerHTML = DB.get('access').map((a, i) => `
    <tr class="access-row">
      <td>${a.time}</td>
      <td>${a.type}</td>
      <td><strong>${a.desc}</strong><small>${a.company || ''}</small></td>
      <td><strong>${a.unit}</strong><small>${a.notes || ''}</small>${a.photo ? `<img src="${a.photo}" alt="Foto da visita" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:6px;margin-top:4px;">` : ''}</td>
      <td><button class="btn btn-danger" onclick="deletarItem('access', ${i})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');
}

window.configurarFormularioAcessos = configurarFormularioAcessos;
window.renderTabelaAcessos = renderTabelaAcessos;
