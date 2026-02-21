const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(() => console.log("✅ MongoDB OK"));

const User = mongoose.model('User', { email: String, mdp: String, pseudo: String });
const Message = mongoose.model('Message', { user: String, text: String, date: { type: Date, default: Date.now } });

app.use(express.static(__dirname));
app.use(express.json());

// ROUTE UNIQUE : INSCRIPTION OU CONNEXION
app.post('/auth', async (req, res) => {
    const { email, mdp, pseudo, type } = req.body;

    if (type === 'login') {
        const user = await User.findOne({ email, mdp });
        if (user) return res.json({ success: true, pseudo: user.pseudo });
        return res.status(401).json({ error: "Email ou mot de passe faux" });
    } else {
        const existant = await User.findOne({ email });
        if (existant) return res.status(400).json({ error: "Compte déjà existant" });
        const nouveau = new User({ email, mdp, pseudo });
        await nouveau.save();
        res.json({ success: true, pseudo });
    }
});

io.on('connection', async (socket) => {
    const history = await Message.find().sort({date: -1}).limit(50);
    socket.emit('load_history', history.reverse());

    socket.on('chat_message', async (data) => {
        io.emit('chat_message', data);
        new Message({ user: data.user, text: data.text }).save();
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("🚀 Discord Clone Online"));
