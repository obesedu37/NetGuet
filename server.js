const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');

// Connexion à la mémoire MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Mémoire connectée !"))
  .catch(err => console.log("Erreur de mémoire :", err));

// Modèle pour enregistrer les messages
const Message = mongoose.model('Message', { 
    user: String, 
    text: String, 
    date: { type: Date, default: Date.now } 
});

app.use(express.static(__dirname));

io.on('connection', async (socket) => {
    // Dès qu'on se connecte, on récupère les 50 derniers messages enregistrés
    const history = await Message.find().sort({date: -1}).limit(50);
    socket.emit('load_history', history.reverse());

    socket.on('chat_message', async (data) => {
        // On enregistre le message pour de vrai
        const newMsg = new Message({ user: data.user, text: data.text });
        await newMsg.save();
        
        io.emit('chat_message', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("Site en ligne et prêt !"));
