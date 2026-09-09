// ============================================================================
// EMAILSERVICE.JS - Serviço de Envio de E-mails
// ============================================================================
let nodemailer = null;
try {
    nodemailer = require('nodemailer');
} catch (e) {
    // Nodemailer pode ainda não ter sido instalado
    nodemailer = null;
}

// Configurações SMTP (podem ser personalizadas via variáveis de ambiente ou aqui)
const SMTP_CONFIG = {
    host: process.env.SMTP_HOST || '',          // ex: 'smtp.gmail.com' ou 'smtp.mail.yahoo.com'
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para 587
    auth: {
        user: process.env.SMTP_USER || '',      // seu e-mail da portaria
        pass: process.env.SMTP_PASS || ''       // sua senha de aplicativo
    },
    from: process.env.SMTP_FROM || 'Portaria Estrada Real <portaria.estradareal@gmail.com>'
};

function gerarTemplateHTMLEncomenda(dados) {
    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1e293b; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 1.3rem;">📦 Condomínio Estrada Real</h1>
            <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 0.9rem;">Aviso de Encomenda na Portaria</p>
        </div>
        <div style="padding: 24px; color: #334155;">
            <p style="font-size: 1rem; margin-top: 0;">Olá, <strong>${dados.morador || 'Morador'}</strong>!</p>
            <p>Uma nova encomenda para a sua unidade acabou de ser recebida na portaria do condomínio.</p>

            <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 4px 0;"><strong>🏢 Unidade:</strong> ${dados.unidade || '-'}</p>
                <p style="margin: 4px 0;"><strong>📦 Tipo:</strong> ${dados.tipo || 'Pacote'}</p>
                <p style="margin: 4px 0;"><strong>🚚 Origem / Transportadora:</strong> ${dados.carrier || 'Não informada'}</p>
                <p style="margin: 4px 0;"><strong>🏷️ Protocolo:</strong> ${dados.protocolo || '-'}</p>
                <p style="margin: 4px 0;"><strong>📅 Recebida em:</strong> ${dados.data || new Date().toLocaleString('pt-BR')}</p>
            </div>

            <div style="text-align: center; margin: 30px 0; background: #eff6ff; padding: 15px; border-radius: 8px; border: 1px dashed #3b82f6;">
                <span style="font-size: 0.85rem; color: #1e40af; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Código de Retirada</span><br>
                <span style="font-size: 1.8rem; font-weight: bold; color: #1d4ed8; letter-spacing: 2px;">${dados.codigo || 'ZAP-0000'}</span>
            </div>

            <p style="font-size: 0.9rem; color: #64748b; line-height: 1.5;">
                ℹ️ Para retirar, basta comparecer à portaria e informar o seu código de retirada ou o seu nome e apartamento.
            </p>
        </div>
        <div style="background: #f1f5f9; padding: 12px; text-align: center; font-size: 0.8rem; color: #94a3b8;">
            Sistema de Portaria ZapCondo • Condomínio Estrada Real
        </div>
    </div>
    `;
}

async function enviarEmail(dados) {
    const { email, assunto, morador, unidade, tipo, carrier, codigo, protocolo, data } = dados;

    if (!email) {
        throw new Error('Endereço de e-mail de destino é obrigatório.');
    }

    const htmlContent = gerarTemplateHTMLEncomenda({
        morador,
        unidade,
        tipo,
        carrier,
        codigo,
        protocolo,
        data
    });

    // Se o nodemailer não estiver instalado ou credenciais não preenchidas, opera em modo log/simulado
    const hasCredentials = SMTP_CONFIG.auth.user && SMTP_CONFIG.auth.pass;

    if (!nodemailer || !hasCredentials) {
        console.log('\n✉️ [E-mail - Modo Simulação/Registro]');
        console.log(`Para: ${email}`);
        console.log(`Assunto: ${assunto || 'Sua encomenda chegou! - Estrada Real'}`);
        console.log(`Código: ${codigo}`);
        console.log('Status: E-mail formatado e validado com sucesso! (Configure SMTP_USER e SMTP_PASS para envio externo real)');
        
        return {
            success: true,
            email: true,
            simulado: true,
            destinatario: email,
            message: 'E-mail gerado e validado com sucesso (Modo Registro ativo).'
        };
    }

    // Envio real via Nodemailer
    const transporter = nodemailer.createTransport({
        host: SMTP_CONFIG.host,
        port: SMTP_CONFIG.port,
        secure: SMTP_CONFIG.secure,
        auth: {
            user: SMTP_CONFIG.auth.user,
            pass: SMTP_CONFIG.auth.pass
        }
    });

    const info = await transporter.sendMail({
        from: SMTP_CONFIG.from,
        to: email,
        subject: assunto || `📦 Encomenda Chegou! - Condomínio Estrada Real (${unidade})`,
        html: htmlContent
    });

    console.log(`✅ [E-mail] Enviado com sucesso via SMTP para ${email}: MessageID ${info.messageId}`);

    return {
        success: true,
        email: true,
        simulado: false,
        destinatario: email,
        messageId: info.messageId,
        message: 'E-mail enviado com sucesso via servidor SMTP!'
    };
}

module.exports = {
    enviarEmail,
    gerarTemplateHTMLEncomenda
};
