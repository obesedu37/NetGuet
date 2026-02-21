const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Ton nom d'admin secret
const MON_NOM = "obesedu37";

// Pour que le site affiche ton fichier HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('Nouvelle connexion !');

    socket.on('chat_message', (data) => {
        // On vérifie si c'est toi l'admin
        const isAdmin = (data.user.toLowerCase() === MON_NOM.toLowerCase());
        
        // On renvoie le message à tout le monde
        io.emit('chat_message', {
            user: data.user,
            text: data.text,
            orbe: data.orbe,
            isAdmin: isAdmin
        });
    });
});

// Port spécial pour que Render puisse lancer le site
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Le site est en ligne !');
});