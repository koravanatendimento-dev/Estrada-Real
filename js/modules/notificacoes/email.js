// ============================================================================
// EMAIL.JS - Canal de Notificação via E-mail
// ============================================================================

async function enviarNotificacaoEmail(morador, encomenda) {
  const emailDestino = morador?.email || morador?.personalEmail;
  if (!emailDestino) {
    return { success: false, error: 'O morador não possui e-mail cadastrado.' };
  }

  const assunto = `📦 Sua encomenda chegou! - Condomínio Estrada Real (${encomenda.unit})`;

  const dadosEmail = {
    email: emailDestino,
    assunto: assunto,
    morador: encomenda.dest,
    unidade: encomenda.unit,
    tipo: encomenda.tipo || 'Pacote',
    carrier: encomenda.carrier || 'Não informada',
    codigo: encomenda.code,
    protocolo: encomenda.protocolo || '-',
    data: encomenda.date || new Date().toLocaleString('pt-BR')
  };

  console.log('✉️ [E-mail] Iniciando disparo...', { emailDestino, assunto });

  try {
    const res = await fetch('http://localhost:3001/enviar-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosEmail)
    });

    const data = await res.json();
    console.log('✉️ [E-mail] Resposta do servidor:', data);
    return data;
  } catch (err) {
    console.error('❌ [E-mail] Falha na requisição:', err);
    return { success: false, error: err.message };
  }
}

// Exportações globais
window.enviarNotificacaoEmail = enviarNotificacaoEmail;
