// ==========================================
// NAVIGATION.JS - Controle do Menu Lateral e Abas
// ==========================================
function configurarNavegacao() {
  const menuItems = document.querySelectorAll('#menu-list li');
  const containers = document.querySelectorAll('.container');
  const pageTitle = document.getElementById('page-title');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(i => i.classList.remove('active'));
      containers.forEach(c => c.classList.remove('active-tab'));
      
      item.classList.add('active');
      const targetId = item.getAttribute('data-target');
      const targetContainer = document.getElementById(targetId);
      if (targetContainer) {
        targetContainer.classList.add('active-tab');
      }
      if (targetId === 'tab-parcel' && typeof window.exibirListaEncomendas === 'function') {
        window.exibirListaEncomendas();
      }
      if (pageTitle) {
        pageTitle.textContent = item.textContent.trim();
      }
    });
  });
}

window.configurarNavegacao = configurarNavegacao;
