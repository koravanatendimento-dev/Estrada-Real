const express = require('express');
const cors = require('cors');
const apiStore = require('./apiStore');
const createMoradoresApi = require('./moradoresApi');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'morador-app')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

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

app.get('/status', (req, res) => res.json({ online: true, service: 'moradores-api' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'morador-app', 'index.html')));
app.get('/download', (req, res) => {
    const zipPath = path.join(__dirname, '..', 'aplicativo-moradores-estrada-real-atualizado.zip');
    if (!fs.existsSync(zipPath)) return res.status(404).send('Pacote do aplicativo ainda não foi gerado.');
    return res.download(zipPath, 'aplicativo-moradores-estrada-real.zip');
});
app.get('/compartilhar', (req, res) => {
    const appUrl = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(appUrl)}`;
    return res.send(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>App Estrada Real</title><body style="font-family:Arial,sans-serif;max-width:520px;margin:40px auto;padding:20px;text-align:center"><h1>Aplicativo Estrada Real</h1><p>Envie este endereço ao grupo de moradores:</p><p><a href="${appUrl}">${appUrl}</a></p><img src="${qrUrl}" alt="QR Code para abrir o aplicativo"><p>O morador pode abrir o endereço e escolher “Adicionar à tela inicial”.</p><p><a href="/download">Baixar pacote do aplicativo</a></p></body></html>`);
});
app.use('/api/moradores', createMoradoresApi({ apiStore, requireResident }));

const port = Number(process.env.PORT || process.env.MORADORES_API_PORT || 3002);
app.listen(port, '0.0.0.0', () => {
    console.log(`API dos moradores disponível na porta ${port}.`);
});
