const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(() => console.log("✅ Base connectée"));

// On ajoute l'Email et le MDP dans la base
const User = mongoose.model('User', { email: String, mdp: String, pseudo: String });
const Message = mongoose.model('Message', { user: String, text: String, date: { type: Date, default: Date.now } });

app.use(express.static(__dirname));
app.use(express.json());

// ROUTE INSCRIPTION
app.post('/register', async (req, res) => {
    const { email, mdp, pseudo } = req.body;
    const existant = await User.findOne({ email });
    if (existant) return res.status(400).json({ error: "Email déjà utilisé" });
    
    const nouveauUser = new User({ email, mdp, pseudo });
    await nouveauUser.save();
    res.json({ success: true, pseudo });
});

// ROUTE CONNEXION (Pour les comptes existants)
app.post('/login', async (req, res) => {
    const { email, mdp } = req.body;
    const user = await User.findOne({ email, mdp });
    if (user) {
        res.json({ success: true, pseudo: user.pseudo });
    } else {
        res.status(401).json({ error: "Email ou MDP incorrect" });
    }
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
http.listen(PORT, () => console.log("🚀 Serveur Discord Lancé"));
