const express = require('express');
const path = require('path');

const app = express();
const root = path.join(__dirname, '..');

app.use(express.static(root));
app.get('/status', (req, res) => res.json({ online: true, service: 'portaria-web' }));
app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));

const port = Number(process.env.PORT || process.env.PORTARIA_WEB_PORT || 5501);
app.listen(port, '0.0.0.0', () => {
    console.log(`Portaria web disponível na porta ${port}.`);
});
