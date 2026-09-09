const express = require('express');

function createMoradoresApi({ apiStore, requireResident }) {
    const router = express.Router();

    const normalizeText = value => String(value || '').trim();

    router.post('/cadastro', (req, res) => {
        const name = normalizeText(req.body.name);
        const cpf = normalizeText(req.body.cpf);
        const email = normalizeText(req.body.email).toLowerCase();
        const phone = normalizeText(req.body.phone);
        const unit = normalizeText(req.body.unit);
        const password = String(req.body.password || '');
        if (!name || !cpf || !email || !phone || !unit || password.length < 6) {
            return res.status(400).json({ success: false, error: 'Preencha os dados obrigatórios e crie uma senha com pelo menos 6 caracteres.' });
        }
        const data = apiStore.readData();
        const existingResident = data.residents.find(item => item.cpf === cpf || item.email === email);
        if (existingResident && existingResident.passwordHash) {
            return res.status(409).json({ success: false, error: 'CPF ou e-mail já cadastrado.' });
        }
        if (existingResident) {
            Object.assign(existingResident, {
                name, cpf, email, phone, unit,
                rg: normalizeText(req.body.rg),
                birthDate: normalizeText(req.body.birthDate),
                emergencyContact: normalizeText(req.body.emergencyContact),
                emergencyPhone: normalizeText(req.body.emergencyPhone),
                photo: normalizeText(req.body.photo),
                passwordHash: apiStore.passwordHash(password)
            });
            const accessToken = apiStore.token();
            data.sessions.push({ token: accessToken, residentId: existingResident.id, createdAt: new Date().toISOString() });
            apiStore.writeData(data);
            return res.status(201).json({ success: true, resident: existingResident, accessToken });
        }
        const resident = {
            id: apiStore.id('resident'), name, cpf, email, phone, unit,
            rg: normalizeText(req.body.rg),
            birthDate: normalizeText(req.body.birthDate),
            emergencyContact: normalizeText(req.body.emergencyContact),
            emergencyPhone: normalizeText(req.body.emergencyPhone),
            photo: normalizeText(req.body.photo),
            passwordHash: apiStore.passwordHash(password),
            createdAt: new Date().toISOString()
        };
        const accessToken = apiStore.token();
        data.residents.push(resident);
        data.sessions.push({ token: accessToken, residentId: resident.id, createdAt: new Date().toISOString() });
        apiStore.writeData(data);
        return res.status(201).json({ success: true, resident, accessToken });
    });

    router.post('/login', (req, res) => {
        const identifier = normalizeText(req.body.identifier).toLowerCase();
        const password = String(req.body.password || '');
        if (!identifier) return res.status(400).json({ success: false, error: 'Informe CPF ou e-mail.' });
        const data = apiStore.readData();
        const resident = data.residents.find(item => item.cpf.toLowerCase() === identifier || item.email === identifier);
        if (!resident || !apiStore.verifyPassword(password, resident.passwordHash)) {
            return res.status(401).json({ success: false, error: 'CPF/e-mail ou senha inválidos.' });
        }
        const accessToken = apiStore.token();
        data.sessions.push({ token: accessToken, residentId: resident.id, createdAt: new Date().toISOString() });
        apiStore.writeData(data);
        return res.json({ success: true, resident, accessToken });
    });

    router.get('/me', requireResident, (req, res) => res.json({ success: true, resident: req.resident }));

    router.get('/me/encomendas', requireResident, (req, res) => {
        const parcels = req.apiData.parcels.filter(item => item.unit === req.resident.unit);
        return res.json({ success: true, encomendas: parcels });
    });

    router.get('/me/notificacoes', requireResident, (req, res) => {
        const notifications = req.apiData.notifications.filter(item => item.residentId === req.resident.id);
        return res.json({ success: true, notificacoes: notifications });
    });

    router.patch('/me/notificacoes/:id/lida', requireResident, (req, res) => {
        const notification = req.apiData.notifications.find(item => item.id === req.params.id && item.residentId === req.resident.id);
        if (!notification) return res.status(404).json({ success: false, error: 'Notificação não encontrada.' });
        notification.read = true;
        apiStore.writeData(req.apiData);
        return res.json({ success: true, notificacao: notification });
    });

    router.get('/me/reservas', requireResident, (req, res) => {
        const reservations = req.apiData.reservations.filter(item => item.residentId === req.resident.id);
        return res.json({ success: true, reservas: reservations });
    });

    router.post('/me/reservas', requireResident, (req, res) => {
        const date = normalizeText(req.body.date);
        const guests = Array.isArray(req.body.guests) ? req.body.guests.map(normalizeText).filter(Boolean) : [];
        if (!date) return res.status(400).json({ success: false, error: 'Data da reserva é obrigatória.' });
        if (guests.length > 35) return res.status(400).json({ success: false, error: 'A reserva permite no máximo 35 convidados.' });
        const data = req.apiData;
        if (data.reservations.some(item => item.date === date)) {
            return res.status(409).json({ success: false, error: 'Esta data já está reservada.' });
        }
        const reservation = {
            id: apiStore.id('reservation'),
            residentId: req.resident.id,
            residentName: req.resident.name,
            unit: req.resident.unit,
            date,
            guests,
            guestQrToken: apiStore.token(),
            createdAt: new Date().toISOString()
        };
        data.reservations.push(reservation);
        apiStore.writeData(data);
        return res.status(201).json({ success: true, reserva: reservation });
    });

    return router;
}

module.exports = createMoradoresApi;
