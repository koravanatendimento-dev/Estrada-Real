// ============================================================================
// WHATSAPPSERVICE.JS - Serviço de Integração com Baileys WhatsApp
// ============================================================================
const qrcodeTerminal = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

let sock = null;
let isConnected = false;
let latestQR = null;

async function connectToWhatsApp() {
    let authPath = path.join(__dirname, '../auth_baileys');
    if (!fs.existsSync(authPath) && fs.existsSync(path.join(__dirname, '../../auth_baileys'))) {
        authPath = path.join(__dirname, '../../auth_baileys');
    }

    // Se a sessão existente estiver com registered: false ou desconectada, limpa para novo QR code
    const credsPath = path.join(authPath, 'creds.json');
    if (fs.existsSync(credsPath)) {
        try {
            const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
            if (credsData.registered === false) {
                console.log('🔄 [WhatsApp] Sessão anterior expirada. Limpando credenciais para gerar novo QR Code...');
                fs.rmSync(authPath, { recursive: true, force: true });
            }
        } catch (err) {
            try { fs.rmSync(authPath, { recursive: true, force: true }); } catch (e) {}
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            latestQR = qr;
            console.log('\n📲 [WhatsApp] Escaneie o QR Code abaixo com o WhatsApp da Portaria:');
            qrcodeTerminal.generate(qr, { small: true });
            console.log('💡 DICA: Você também pode ver o QR Code no navegador em: http://localhost:3001/qr\n');
        }
        
        if (connection === 'close') {
            isConnected = false;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log(`⚠️ [WhatsApp] Conexão fechada (Código: ${statusCode}).`);

            if (statusCode === DisconnectReason.loggedOut) {
                console.log('🔄 [WhatsApp] Sessão desconectada. Limpando credenciais e gerando novo QR Code...');
                try {
                    fs.rmSync(authPath, { recursive: true, force: true });
                } catch (e) {}
                setTimeout(connectToWhatsApp, 2000);
            } else {
                console.log('🔄 [WhatsApp] Reconectando em 3 segundos...');
                setTimeout(connectToWhatsApp, 3000);
            }
        } else if (connection === 'open') {
            isConnected = true;
            latestQR = null;
            console.log('✅ [WhatsApp] Portaria Conectada e Pronta para envios!');
        }
    });
}

function getStatus() {
    return { isConnected, hasSocket: !!sock, hasQR: !!latestQR };
}

function getLatestQR() {
    return latestQR;
}

async function enviarMensagemWhatsApp(numeroBruto, mensagemBruta) {
    if (!isConnected || !sock) {
        throw new Error('WhatsApp da portaria ainda não está conectado. Escaneie o QR Code em http://localhost:3001/qr');
    }

    if (!numeroBruto || !mensagemBruta) {
        throw new Error('Número e mensagem são obrigatórios.');
    }

    let numeroLimpo = String(numeroBruto).replace(/\D/g, '');

    if (numeroLimpo.startsWith('55')) {
        numeroLimpo = numeroLimpo.substring(2);
    }

    if (numeroLimpo.startsWith('3199') && numeroLimpo.length > 10) {
        numeroLimpo = '319' + numeroLimpo.slice(-8);
    }

    const numeroCompleto = `55${numeroLimpo}`;

    console.log(`🔍 [WhatsApp] Validando conta no WhatsApp: ${numeroCompleto}`);

    const [resultadoConsulta] = await sock.onWhatsApp(numeroCompleto);

    if (!resultadoConsulta || !resultadoConsulta.exists) {
        throw new Error(`O número ${numeroCompleto} não possui conta válida no WhatsApp.`);
    }

    const jidFinal = resultadoConsulta.jid;
    console.log(`📤 [WhatsApp] Enviando mensagem validada para: ${jidFinal}`);

    await sock.sendMessage(jidFinal, { text: String(mensagemBruta) });

    return {
        success: true,
        whatsapp: true,
        destinatario: jidFinal,
        message: 'Mensagem enviada com sucesso no WhatsApp!'
    };
}

module.exports = {
    connectToWhatsApp,
    getStatus,
    getLatestQR,
    enviarMensagemWhatsApp
};
