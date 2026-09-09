// ==========================================
// DB.JS - Gerenciador do Banco Local (LocalStorage)
// ==========================================
const DB = {
  get: (key) => {
    try {
      const item = localStorage.getItem(`zapcondo_${key}`);
      if (!item || item === 'undefined' || item === 'null') return [];
      return JSON.parse(item) || [];
    } catch (err) {
      console.warn(`Aviso ao ler zapcondo_${key} do localStorage:`, err);
      return [];
    }
  },
  set: (key, data) => {
    try {
      localStorage.setItem(`zapcondo_${key}`, JSON.stringify(data));
      if (typeof window.renderAll === 'function') {
        window.renderAll();
      }
    } catch (err) {
      console.error(`Erro ao salvar zapcondo_${key} no localStorage:`, err);
    }
  }
};

function deletarItem(chave, index) {
  if (confirm("Deseja realmente remover este item?")) {
    const lista = DB.get(chave);
    lista.splice(index, 1);
    DB.set(chave, lista);
  }
}

// Exportações globais para compatibilidade
window.DB = DB;
window.deletarItem = deletarItem;
