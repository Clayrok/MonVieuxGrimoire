const app = require('./app');
const logger = require('./config/logger');

const http = require('http');
const fs = require('fs');
const path = require('path');

const mandatoryFolders = [
    path.join(__dirname, 'upload'),
    path.join(__dirname, 'logs')
];

mandatoryFolders.forEach(folderPath => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        logger.info(`Répertoire "${folderPath}" créé.`);
    }
});

const port = process.env.PORT || '4000';
app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => logger.info(`Serveur démarré sur le port ${port}`));