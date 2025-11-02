import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import session from 'express-session';

dotenv.config(); // load .env variables

const app = express();
const PORT = process.env.PORT || 5000;

app.use(session({
  secret: process.env.SESSION_SECRET, // a random long string
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true if using HTTPS
}));
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cors({
  origin: '*'
}));
app.get(/^(?!.*\.).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Connect to MongoDB using URI from .env
mongoose.connect(process.env.MONGO_URI, {
  
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Message schema
const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);

// Routes
app.post("/send", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ success: false, error: "All fields required" });

  try {
    const msg = new Message({ name, email, message });
    await msg.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to save message" });
  }
});

function requireAdmin(req, res, next) {
  if (req.session.admin) return next();
  res.status(401).json({ success: false, error: 'Unauthorized' });
}

app.get('/admin/messages', requireAdmin, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// login endpoint - checks secret and returns success
app.post('/admin/login', (req, res) => {
  const { secret } = req.body;
  if (secret === process.env.ADMIN_SECRET) {
    req.session.admin = true; // mark session as authenticated
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: 'Unauthorized' });
});


// messages endpoint - accept secret either as query param or header
app.get('/admin/messages', async (req, res) => {
  const secret = req.query.secret || req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});





app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
