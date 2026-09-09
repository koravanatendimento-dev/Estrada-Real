// ============================================================================
// INDEX.JS - Orquestrador Central de Notificações (WhatsApp e E-mail)
// ============================================================================

async function notificarMorador(dadosEnvio, encomenda, opcoes = { whatsapp: true, email: true }) {
  const moradores = (typeof DB !== 'undefined') ? DB.get('people') : [];
  const moradorCadastrado = moradores.find(m => m.name.trim().toLowerCase() === encomenda.dest.trim().toLowerCase()) || {};

  // Mescla dados cadastrados com dados eventuais passados na chamada
  const moradorFinal = {
    ...moradorCadastrado,
    phone: moradorCadastrado.phone || moradorCadastrado.mobilePhone || dadosEnvio?.phone || '',
    email: moradorCadastrado.email || moradorCadastrado.personalEmail || dadosEnvio?.email || ''
  };

  const promessas = [];

  if (opcoes.whatsapp !== false && typeof window.enviarNotificacaoWhatsApp === 'function') {
    promessas.push(window.enviarNotificacaoWhatsApp(moradorFinal, encomenda));
  }

  if (opcoes.email !== false && typeof window.enviarNotificacaoEmail === 'function') {
    promessas.push(window.enviarNotificacaoEmail(moradorFinal, encomenda));
  }

  const resultados = await Promise.allSettled(promessas);
  console.log('📬 [Notificações] Todos os disparos foram processados:', resultados);
  return resultados;
}

// Exportações globais
window.notificarMorador = notificarMorador;
