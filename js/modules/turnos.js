// ==========================================
// TURNOS.JS - Passagem de Plantão dos Porteiros
// ==========================================

function configurarFormularioTurnos() {
  const employeeForm = document.getElementById('form-employee');
  if (employeeForm) {
    employeeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const lista = DB.get('employees');
      lista.push({
        name: document.getElementById('employee-name').value,
        role: document.getElementById('employee-role').value,
        shift: document.getElementById('employee-shift').value
      });
      DB.set('employees', lista);
      employeeForm.reset();
      renderFuncionarios();
    });
  }
  const formShift = document.getElementById('form-shift');
  if (!formShift) return;

  formShift.addEventListener('submit', (e) => {
    e.preventDefault();
    const lista = DB.get('shifts');
    lista.push({
      date: new Date().toLocaleString('pt-BR'),
      turn: document.getElementById('sh-turn').value,
      guard: document.getElementById('sh-guard').value,
      obs: document.getElementById('sh-obs').value,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
    DB.set('shifts', lista);
    e.target.reset();
  });
}

function renderFuncionarios() {
  const lista = DB.get('employees');
  const container = document.getElementById('employee-list');
  const select = document.getElementById('sh-guard');
  if (container) {
    container.innerHTML = lista.map((f, i) => `<div class="employee-card"><i class="fa-solid fa-user-shield"></i><span><strong>${f.name}</strong><small>${f.role} · ${f.shift}</small></span><button class="btn btn-danger" onclick="deletarItem('employees', ${i})"><i class="fa-solid fa-trash"></i></button></div>`).join('');
  }
  if (select) {
    select.innerHTML = '<option value="">Selecione o funcionário</option>';
    lista.forEach(f => select.add(new Option(f.name, f.name)));
  }
}

function renderTabelaTurnos() {
  const tableShifts = document.getElementById('table-shifts');
  if (!tableShifts) return;

  tableShifts.innerHTML = DB.get('shifts').slice().reverse().map((s, i) => `
    <article class="shift-report-card">
      <div class="shift-report-meta">
        <span><strong>DATA DE CADASTRO</strong>${s.date}</span>
        <span><strong>TURNO</strong>${s.turn}</span>
        <span><strong>PORTEIRO</strong>${s.guard}</span>
      </div>
      <div class="shift-report-body">
        <strong>RELATO</strong>
        <p>${s.obs}</p>
        <small>Registrado às ${s.time || '--:--'}</small>
      </div>
      <button class="btn btn-danger" onclick="deletarItem('shifts', ${DB.get('shifts').length - 1 - i})"><i class="fa-solid fa-trash"></i> Excluir</button>
    </article>
  `).join('');
}

window.configurarFormularioTurnos = configurarFormularioTurnos;
window.renderTabelaTurnos = renderTabelaTurnos;
window.renderFuncionarios = renderFuncionarios;
