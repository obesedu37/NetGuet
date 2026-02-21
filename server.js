const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connecté"))
  .catch(err => console.error("❌ Erreur de connexion MongoDB:", err));

const User = mongoose.model('User', { email: String, mdp: String, pseudo: String });
const Message = mongoose.model('Message', { user: String, text: String, date: { type: Date, default: Date.now } });

app.use(express.static(__dirname));
app.use(express.json());

// Auth : Inscription ou Connexion
app.post('/auth', async (req, res) => {
    try {
        const { email, mdp, pseudo, type } = req.body;
        if (type === 'login') {
            const user = await User.findOne({ email, mdp });
            if (user) return res.json({ success: true, pseudo: user.pseudo });
            return res.status(401).json({ error: "Email ou mot de passe incorrect" });
        } else {
            const existant = await User.findOne({ email });
            if (existant) return res.status(400).json({ error: "Ce compte existe déjà" });
            const nouveau = new User({ email, mdp, pseudo });
            await nouveau.save();
            return res.json({ success: true, pseudo });
        }
    } catch (e) { 
        res.status(500).json({ error: "Erreur technique" }); 
    }
});

io.on('connection', async (socket) => {
    // Envoi de l'historique
    try {
        const history = await Message.find().sort({date: -1}).limit(50);
        socket.emit('load_history', history.reverse());
    } catch(e) {}

    socket.on('chat_message', async (data) => {
        io.emit('chat_message', data);
        try {
            await new Message({ user: data.user, text: data.text }).save();
        } catch(e) {}
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("🚀 Serveur NetGuet OK"));
