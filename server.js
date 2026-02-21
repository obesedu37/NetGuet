const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(() => console.log("✅ Base connectée"));

// Schéma pour les comptes et les messages
const User = mongoose.model('User', { email: String, mdp: String, pseudo: String });
const Message = mongoose.model('Message', { user: String, text: String, date: { type: Date, default: Date.now } });

app.use(express.static(__dirname));
app.use(express.json());

// Route pour créer un compte
app.post('/register', async (req, res) => {
    const { email, mdp, pseudo } = req.body;
    const nouveauUser = new User({ email, mdp, pseudo });
    await nouveauUser.save();
    res.json({ success: true });
});

io.on('connection', async (socket) => {
    const history = await Message.find().sort({date: -1}).limit(50);
    socket.emit('load_history', history.reverse());

    socket.on('chat_message', async (data) => {
        io.emit('chat_message', data);
        const newMsg = new Message({ user: data.user, text: data.text });
        await newMsg.save();
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("🚀 Serveur prêt"));
