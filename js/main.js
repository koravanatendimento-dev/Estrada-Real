// ==========================================
// MAIN.JS - Ponto de Entrada da Aplicação
// ==========================================

function configurarFormularios() {
  if (typeof window.configurarFormularioMorador === 'function') window.configurarFormularioMorador();
  if (typeof window.configurarFormularioEncomenda === 'function') window.configurarFormularioEncomenda();
  if (typeof window.configurarFormularioGourmet === 'function') window.configurarFormularioGourmet();
  if (typeof window.configurarFormularioVeiculos === 'function') window.configurarFormularioVeiculos();
  if (typeof window.configurarFormularioPets === 'function') window.configurarFormularioPets();
  if (typeof window.configurarFormularioAcessos === 'function') window.configurarFormularioAcessos();
  if (typeof window.configurarFormularioIncidentes === 'function') window.configurarFormularioIncidentes();
  if (typeof window.configurarFormularioTurnos === 'function') window.configurarFormularioTurnos();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 Inicializando ZapCondo - Condomínio Estrada Real...");
  
  if (typeof window.gerarUnidades === 'function') window.gerarUnidades();
  if (typeof window.popularDropdownsUnidades === 'function') window.popularDropdownsUnidades();
  if (typeof window.sincronizarMoradoresApi === 'function') window.sincronizarMoradoresApi();
  if (typeof window.configurarNavegacao === 'function') window.configurarNavegacao();
  
  configurarFormularios();
  
  if (typeof window.renderAll === 'function') window.renderAll();
});

window.configurarFormularios = configurarFormularios;
