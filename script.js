// ============================================================================
// ZapCondo Estrada Real - Código Modularizado
// ============================================================================
// O código deste sistema foi organizado em pastas e módulos dentro de "js/":
//
// 📁 js/core/
//    ├── db.js           -> Banco Local (LocalStorage seguro)
//    ├── units.js        -> Gestão e dropdowns das 72 unidades
//    └── navigation.js   -> Navegação do menu lateral e abas
//
// 📁 js/modules/
//    ├── notificacoes.js -> WhatsApp e notificações para moradores
//    ├── camera-ocr.js   -> Câmera webcam e leitura IA de etiquetas (Tesseract)
//    ├── moradores.js    -> Gestão de moradores e contatos
//    ├── encomendas.js   -> Gestão, filtros e baixa de encomendas
//    ├── gourmet.js      -> Reservas do espaço gourmet
//    ├── veiculos.js     -> Gestão de veículos
//    ├── pets.js         -> Gestão de pets
//    ├── acessos.js      -> Portaria (entradas e saídas)
//    ├── incidentes.js   -> Ocorrências e incidentes
//    ├── turnos.js       -> Passagem de plantão dos porteiros
//    └── dashboard.js    -> Indicadores e contadores
//
// 📁 js/
//    └── main.js         -> Ponto de entrada (inicializador no DOMContentLoaded)
//
// 📁 server/
//    ├── server.js       -> Servidor WhatsApp Express (porta 3001)
//    └── package.json    -> Dependências do backend
//
// 📁 legado/
//    ├── app.js
//    ├── condo-user-count.js
//    └── script_original_backup.js
// ============================================================================