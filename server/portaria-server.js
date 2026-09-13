const express = require('express');
const path = require('path');
const apiStore = require('./apiStore');
const createMoradoresApi = require('./moradoresApi');

const app = express();
const root = path.join(__dirname, '..');

app.use(express.static(root));
app.use(express.json({ limit: '10mb' }));
function requireResident(req, res, next) {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const data = apiStore.readData();
    const session = data.sessions.find(item => item.token === token);
    const resident = session && data.residents.find(item => item.id === session.residentId);
    if (!resident) return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada.' });
    req.resident = resident;
    req.apiData = data;
    next();
}
app.use('/api/moradores', createMoradoresApi({ apiStore, requireResident }));
app.get('/api/portaria/moradores', (req, res) => {
    const data = apiStore.readData();
    return res.json({ moradores: data.residents.map(({ passwordHash, ...resident }) => resident) });
});
app.post('/api/portaria/moradores', (req, res) => {
    const { name, cpf, email, phone, unit } = req.body;
    if (!name || !unit) return res.status(400).json({ success: false, error: 'Nome e unidade são obrigatórios.' });
    const data = apiStore.readData();
    const existing = data.residents.find(item => (cpf && item.cpf === cpf) || (email && item.email === String(email).toLowerCase()));
    if (existing) return res.json({ success: true, morador: existing });
    const resident = { id: apiStore.id('resident'), name, cpf: cpf || '', email: email ? String(email).toLowerCase() : '', phone: phone || '', unit, passwordHash: '' };
    data.residents.push(resident);
    apiStore.writeData(data);
    const { passwordHash, ...safeResident } = resident;
    return res.status(201).json({ success: true, morador: safeResident });
});
app.post('/api/portaria/encomendas', (req, res) => {
    const unit = String(req.body.unit || '').trim();
    const code = String(req.body.code || '').trim().toUpperCase();
    const protocolo = String(req.body.protocolo || '').trim();
    if (!unit || !code || !protocolo) return res.status(400).json({ success: false, error: 'Unidade, código e protocolo são obrigatórios.' });
    if (!/^[A-Z0-9]{6}$/.test(code)) return res.status(400).json({ success: false, error: 'O código de retirada deve ter exatamente 6 letras ou números.' });
    const data = apiStore.readData();
    const dest = String(req.body.dest || '').trim().toLowerCase();
    const resident = data.residents.find(item => item.unit === unit && item.name.toLowerCase() === dest)
        || data.residents.find(item => item.unit === unit && ((req.body.email && item.email === String(req.body.email).toLowerCase()) || (req.body.phone && item.phone === req.body.phone)));
    const parcel = { id: req.body.id || apiStore.id('parcel'), unit, residentId: resident ? resident.id : null, dest: req.body.dest || '', code, protocolo, tipo: req.body.tipo || 'Pacote', carrier: req.body.carrier || 'Não informada', date: req.body.date || new Date().toLocaleString('pt-BR'), photo: req.body.photo || '', anotacoes: req.body.anotacoes || '', status: 'Pendente' };
    data.parcels.unshift(parcel);
    if (resident) data.notifications.unshift({ id: apiStore.id('notification'), residentId: resident.id, type: 'encomenda', title: 'Nova encomenda na portaria', message: `Código de retirada: ${code}. Protocolo: ${protocolo}.`, parcelId: parcel.id, createdAt: new Date().toISOString(), read: false });
    apiStore.writeData(data);
    return res.status(201).json({ success: true, encomenda: parcel });
});
app.post('/api/portaria/acessos', (req, res) => {
    const unit = String(req.body.unit || '').trim();
    const desc = String(req.body.desc || '').trim();
    if (!unit || !desc) return res.status(400).json({ success: false, error: 'Unidade e identificação são obrigatórias.' });
    const data = apiStore.readData();
    data.residents.filter(item => item.unit === unit).forEach(resident => data.notifications.unshift({ id: apiStore.id('notification'), residentId: resident.id, type: 'acesso', title: 'Nova visita registrada na sua unidade', message: `${desc} - ${req.body.type || 'Entrada'}.`, createdAt: new Date().toISOString(), read: false }));
    apiStore.writeData(data);
    return res.status(201).json({ success: true });
});
app.get('/api/portaria/ocorrencias', (req, res) => {
    const data = apiStore.readData();
    return res.json({ success: true, ocorrencias: data.occurrences });
});
app.post('/api/portaria/ocorrencias', (req, res) => {
    const data = apiStore.readData();
    const occurrence = {
        id: apiStore.id('occurrence'),
        residentId: null,
        residentName: 'Portaria',
        unit: String(req.body.unit || '').trim(),
        title: String(req.body.title || '').trim(),
        type: String(req.body.type || 'Outro').trim(),
        description: String(req.body.description || req.body.desc || '').trim(),
        status: 'Aberta',
        createdAt: new Date().toISOString()
    };
    if (!occurrence.title || !occurrence.description) return res.status(400).json({ success: false, error: 'Título e descrição são obrigatórios.' });
    data.occurrences.unshift(occurrence);
    apiStore.writeData(data);
    return res.status(201).json({ success: true, ocorrencia: occurrence });
});
app.get('/status', (req, res) => res.json({ online: true, service: 'portaria-web' }));
app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));

const port = Number(process.env.PORT || process.env.PORTARIA_WEB_PORT || 5501);
app.listen(port, '0.0.0.0', () => {
    console.log(`Portaria web disponível na porta ${port}.`);
});
