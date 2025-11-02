import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config(); // load .env variables

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

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

app.get("/admin/messages", async (req, res) => {
  const { secret } = req.query;
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
});




app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
