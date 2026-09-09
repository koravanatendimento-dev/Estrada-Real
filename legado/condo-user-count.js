// Componente de Contagem de Usuários (Legado)
class CondoUserCount {
  constructor() {
    this.total = null;
    this.isLoading = false;
    this.loadError = false;
  }

  connectedCallback() {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.loadError = false;

    // Simulação ou chamada para buscar a contagem
    if (typeof condoUserService !== 'undefined' && condoUserService.queryV3Count) {
      condoUserService.queryV3Count().then(e => {
        this.total = e;
        this.isLoading = false;
      }).catch(() => {
        this.isLoading = false;
        this.loadError = true;
      });
    } else {
      // Caso o serviço venha de outra estrutura, ajustamos aqui
      this.isLoading = false;
      this.total = 0; 
    }
  }
}
