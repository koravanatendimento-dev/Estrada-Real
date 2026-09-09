// ============================================================================
// WHATSAPP.JS - Canal de Notificação via WhatsApp
// ============================================================================

async function enviarNotificacaoWhatsApp(morador, encomenda) {
  const telefone = morador?.phone || morador?.mobilePhone;
  if (!telefone) {
    return { success: false, error: 'O morador não possui telefone cadastrado.' };
  }

  const mensagem = `📦 *Sua encomenda chegou no Condomínio Estrada Real!*\n\n` +
    `• *Morador:* ${encomenda.dest}\n` +
    `• *Unidade:* ${encomenda.unit}\n` +
    `• *Tipo:* ${encomenda.tipo || 'Pacote'}\n` +
    `• *Origem:* ${encomenda.carrier || 'Não informada'}\n` +
    `• *Protocolo:* ${encomenda.protocolo || 'Não informado'}\n` +
    `• *Código de Retirada:* *${encomenda.code}*\n\n` +
    `Por favor, apresente este código na portaria para efetuar a retirada.`;

  console.log('📱 [WhatsApp] Iniciando disparo...', { telefone, destinatario: encomenda.dest });

  try {
    const res = await fetch('http://localhost:3001/enviar-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telefone: telefone,
        mensagem: mensagem,
        morador: encomenda.dest,
        unidade: encomenda.unit,
        codigo: encomenda.code
      })
    });

    const data = await res.json();
    console.log('📱 [WhatsApp] Resposta do servidor:', data);
    return data;
  } catch (err) {
    console.error('❌ [WhatsApp] Falha na requisição:', err);
    return { success: false, error: err.message };
  }
}

// Exportações globais
window.enviarNotificacaoWhatsApp = enviarNotificacaoWhatsApp;
