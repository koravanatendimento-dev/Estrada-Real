console.log("=== SERVIDOR WHATSAPP E E-MAIL - ESTRADA REAL ===");

const express = require('express');
const cors = require('cors');
const whatsappService = require('./services/whatsappService');
const emailService = require('./services/emailService');
const apiStore = require('./apiStore');
const createMoradoresApi = require('./moradoresApi');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

function requireResident(req, res, next) {
    const authorization = req.headers.authorization || '';
    const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const data = apiStore.readData();
    const session = data.sessions.find(item => item.token === accessToken);
    if (!session) return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada.' });
    const resident = data.residents.find(item => item.id === session.residentId);
    if (!resident) return res.status(401).json({ success: false, error: 'Morador não encontrado.' });
    req.resident = resident;
    req.apiData = data;
    next();
}

function requirePortaria(req, res, next) {
    const configuredKey = process.env.PORTARIA_API_KEY;
    if (configuredKey && req.headers['x-portaria-key'] !== configuredKey) {
        return res.status(401).json({ success: false, error: 'Chave da portaria inválida.' });
    }
    next();
}

function normalizeText(value) {
    return String(value || '').trim();
}

function buildParcelNotification(parcel) {
    return {
        id: apiStore.id('notification'),
        residentId: parcel.residentId,
        type: 'encomenda',
        title: 'Nova encomenda na portaria',
        message: `Código de retirada: ${parcel.code}. Protocolo: ${parcel.protocolo}.`,
        parcelId: parcel.id,
        createdAt: new Date().toISOString(),
        read: false
    };
}

function buildAccessNotification(access, resident) {
    return {
        id: apiStore.id('notification'),
        residentId: resident.id,
        type: 'acesso',
        title: 'Nova visita registrada na sua unidade',
        message: `${access.desc} - ${access.type}.`,
        createdAt: new Date().toISOString(),
        read: false
    };
}

app.use('/api/moradores', createMoradoresApi({ apiStore, requireResident }));

app.get('/api/portaria/moradores', requirePortaria, (req, res) => {
    const data = apiStore.readData();
    const moradores = data.residents.map(({ passwordHash, ...morador }) => morador);
    return res.json({ success: true, moradores });
});

app.post('/api/portaria/moradores', requirePortaria, (req, res) => {
    const data = apiStore.readData();
    const name = normalizeText(req.body.name);
    const cpf = normalizeText(req.body.cpf);
    const email = normalizeText(req.body.email).toLowerCase();
    const unit = normalizeText(req.body.unit);
    if (!name || !unit) {
        return res.status(400).json({ success: false, error: 'Nome e unidade são obrigatórios.' });
    }
    let resident = data.residents.find(item => (cpf && item.cpf === cpf) || (email && item.email === email));
    if (!resident) {
        resident = { id: apiStore.id('resident'), name, cpf, email, phone: normalizeText(req.body.phone), unit, photo: req.body.photo || '', createdAt: new Date().toISOString() };
        data.residents.push(resident);
    } else {
        Object.assign(resident, { name, cpf: cpf || resident.cpf, email: email || resident.email, phone: normalizeText(req.body.phone), unit, photo: req.body.photo || resident.photo || '' });
    }
    apiStore.writeData(data);
    const { passwordHash, ...morador } = resident;
    return res.json({ success: true, morador });
});

app.get('/api/portaria/convidados/:guestQrToken', requirePortaria, (req, res) => {
    const data = apiStore.readData();
    const reservation = data.reservations.find(item => item.guestQrToken === req.params.guestQrToken);
    if (!reservation) return res.status(404).json({ success: false, error: 'QR Code de convidado inválido.' });
    return res.json({
        success: true,
        convidado: {
            reservaId: reservation.id,
            morador: reservation.residentName,
            unidade: reservation.unit,
            data: reservation.date,
            convidados: reservation.guests
        }
    });
});

app.post('/api/portaria/encomendas', requirePortaria, async (req, res) => {
    const unit = normalizeText(req.body.unit);
    const residentName = normalizeText(req.body.dest);
    const code = normalizeText(req.body.code);
    const protocolo = normalizeText(req.body.protocolo);
    if (!unit || !code || !protocolo) {
        return res.status(400).json({ success: false, error: 'Unidade, código e protocolo são obrigatórios.' });
    }
    const data = apiStore.readData();
    let resident = data.residents.find(item => item.unit === unit && item.name.toLowerCase() === residentName.toLowerCase())
        || data.residents.find(item => item.unit === unit && (
            (req.body.email && item.email === normalizeText(req.body.email).toLowerCase())
            || (req.body.phone && item.phone === normalizeText(req.body.phone))
        ));
    if (!resident && (req.body.email || req.body.phone)) {
        resident = {
            id: apiStore.id('resident'),
            name: residentName,
            cpf: '',
            email: normalizeText(req.body.email).toLowerCase(),
            phone: normalizeText(req.body.phone),
            unit,
            createdAt: new Date().toISOString()
        };
        data.residents.push(resident);
    }
    if (resident) {
        resident.email = resident.email || normalizeText(req.body.email).toLowerCase();
        resident.phone = resident.phone || normalizeText(req.body.phone);
    }
    const parcel = {
        id: apiStore.id('parcel'),
        unit,
        residentId: resident?.id || null,
        dest: residentName,
        code,
        protocolo,
        tipo: normalizeText(req.body.tipo) || 'Pacote',
        carrier: normalizeText(req.body.carrier) || 'Não informada',
        date: req.body.date || new Date().toLocaleString('pt-BR'),
        anotacoes: normalizeText(req.body.anotacoes),
        photo: normalizeText(req.body.photo),
        status: 'Pendente'
    };
    data.parcels.unshift(parcel);
    if (resident) data.notifications.unshift(buildParcelNotification(parcel));
    apiStore.writeData(data);
    let emailResult = null;
    if (resident?.email) {
        emailResult = await emailService.enviarEmail({
            email: resident.email,
            assunto: `Encomenda recebida - ${unit}`,
            morador: resident.name,
            unidade: unit,
            tipo: parcel.tipo,
            carrier: parcel.carrier,
            codigo: code,
            protocolo,
            data: parcel.date
        });
    }
    return res.status(201).json({ success: true, encomenda: parcel, email: emailResult });
});

app.get('/api/portaria/encomendas/:id', requirePortaria, (req, res) => {
    const data = apiStore.readData();
    const parcel = data.parcels.find(item => item.id === req.params.id);
    if (!parcel) return res.status(404).json({ success: false, error: 'Encomenda não encontrada.' });
    return res.json({ success: true, encomenda: parcel });
});

app.post('/api/portaria/acessos', requirePortaria, (req, res) => {
    const unit = normalizeText(req.body.unit);
    const desc = normalizeText(req.body.desc);
    if (!unit || !desc) return res.status(400).json({ success: false, error: 'Unidade e identificação são obrigatórias.' });
    const data = apiStore.readData();
    const moradores = data.residents.filter(item => item.unit === unit);
    moradores.forEach(resident => data.notifications.unshift(buildAccessNotification(req.body, resident)));
    apiStore.writeData(data);
    return res.status(201).json({ success: true, notificacoes: moradores.length });
});

// Inicia conexão do WhatsApp
whatsappService.connectToWhatsApp();

// 1. ROTA EXCLUSIVA: WHATSAPP
app.post('/enviar-whatsapp', async (req, res) => {
    try {
        const numero = req.body.numero || req.body.telefone || req.body.telefoneFinal;
        const mensagem = req.body.mensagem || req.body.text || req.body.msg;

        const resultado = await whatsappService.enviarMensagemWhatsApp(numero, mensagem);
        return res.json(resultado);
    } catch (err) {
        console.error('❌ [Erro WhatsApp]:', err.message);
        return res.status(500).json({ success: false, whatsapp: false, error: err.message, message: err.message });
    }
});

// 2. ROTA EXCLUSIVA: E-MAIL
app.post('/enviar-email', async (req, res) => {
    try {
        const resultado = await emailService.enviarEmail(req.body);
        return res.json(resultado);
    } catch (err) {
        console.error('❌ [Erro E-mail]:', err.message);
        return res.status(500).json({ success: false, email: false, error: err.message, message: err.message });
    }
});

// 3. ROTA UNIFICADA: NOTIFICAÇÃO COMPLETA (Compatibilidade)
app.post('/enviar-notificacao', async (req, res) => {
    const resultados = {
        success: true,
        whatsapp: false,
        email: false,
        detalhes: {}
    };

    // Tentativa WhatsApp
    const numero = req.body.numero || req.body.telefone || req.body.telefoneFinal;
    const mensagem = req.body.mensagem || req.body.text || req.body.msg;

    if (numero && mensagem) {
        try {
            const resZap = await whatsappService.enviarMensagemWhatsApp(numero, mensagem);
            resultados.whatsapp = true;
            resultados.detalhes.whatsapp = resZap;
        } catch (err) {
            resultados.detalhes.whatsapp = { error: err.message };
        }
    }

    // Tentativa E-mail
    if (req.body.email) {
        try {
            const resMail = await emailService.enviarEmail(req.body);
            resultados.email = true;
            resultados.detalhes.email = resMail;
        } catch (err) {
            resultados.detalhes.email = { error: err.message };
        }
    }

    resultados.message = `Disparo processado. WhatsApp: ${resultados.whatsapp ? 'OK' : 'Falhou'} | E-mail: ${resultados.email ? 'OK' : 'Pendente'}`;
    return res.json(resultados);
});

// 4. ROTA VISUAL DO QR CODE (Para facilitar escaneamento no navegador)
app.get('/qr', (req, res) => {
    const status = whatsappService.getStatus();
    if (status.isConnected) {
        return res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head><meta charset="utf-8"><title>WhatsApp Conectado</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #f0fdf4;">
                <h1 style="color: #166534;">✅ WhatsApp da Portaria Conectado!</h1>
                <p style="color: #15803d; font-size: 1.1rem;">O sistema já está pronto para disparar notificações.</p>
                <a href="http://127.0.0.1:5501/index.html" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Voltar para a Portaria</a>
            </body>
            </html>
        `);
    }

    const qr = whatsappService.getLatestQR();
    if (!qr) {
        return res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head><meta charset="utf-8"><meta http-equiv="refresh" content="3"><title>Gerando QR Code...</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #f8fafc;">
                <h2 style="color: #475569;">⏳ Gerando QR Code do WhatsApp...</h2>
                <p style="color: #64748b;">Esta página recarrega automaticamente a cada 3 segundos.</p>
            </body>
            </html>
        `);
    }

    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qr)}`;
    return res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head><meta charset="utf-8"><meta http-equiv="refresh" content="20"><title>Conectar WhatsApp da Portaria</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #f8fafc;">
            <h1 style="color: #1e293b; margin-bottom: 5px;">📲 Conectar WhatsApp da Portaria</h1>
            <p style="color: #64748b; font-size: 1rem;">Abra o WhatsApp no celular da portaria &gt; <strong>Aparelhos conectados</strong> &gt; <strong>Conectar um aparelho</strong></p>
            <div style="margin: 25px auto; display: inline-block; padding: 15px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <img src="${qrImgUrl}" alt="QR Code WhatsApp" style="display: block; width: 320px; height: 320px;" />
            </div>
            <p style="color: #0284c7; font-weight: bold;">Após escanear, o status mudará para conectado automaticamente!</p>
        </body>
        </html>
    `);
});

// 5. ROTA DE STATUS
app.get('/status', (req, res) => {
    const statusZap = whatsappService.getStatus();
    return res.json({
        online: true,
        whatsapp: statusZap,
        email: { pronto: true }
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando na porta ${PORT}!`);
    console.log(`Rotas ativas:`);
    console.log(`• POST http://localhost:${PORT}/enviar-whatsapp`);
    console.log(`• POST http://localhost:${PORT}/enviar-email`);
    console.log(`• POST http://localhost:${PORT}/enviar-notificacao`);
    console.log(`• GET  http://localhost:${PORT}/qr (Para escanear no navegador)`);
    console.log(`• GET  http://localhost:${PORT}/status`);
});
