require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

/* ================= DB ================= */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("DB Connected"))
.catch(err => console.log(err));

/* ================= MODELS ================= */
const User = mongoose.model("User", {
  email: String,
  password: String,
  role: { type: String, default: "member" }
});

const Task = mongoose.model("Task", {
  title: String,
  assignedTo: String,
  status: { type: String, default: "todo" }
});

/* ================= AUTH ================= */

app.post("/signup", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.status(400).send("Invalid");

  const token = jwt.sign(
    { email: user.email, role: user.role },
    "secret"
  );

  res.json({ token });
});

/* ================= MIDDLEWARE ================= */

function auth(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, "secret");
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("Unauthorized");
  }
}

/* ================= ROUTES ================= */

app.post("/tasks", auth, async (req, res) => {
  const task = await Task.create(req.body);
  res.json(task);
});

app.get("/tasks", auth, async (req, res) => {
  const tasks = await Task.find({
    assignedTo: req.user.email
  });
  res.json(tasks);
});

/* ================= SERVE FRONTEND ================= */

// serve static files
app.use(express.static(path.join(__dirname, "frontend")));

// fallback (VERY IMPORTANT FIX)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend/index.html"));
});

/* ================= START ================= */

app.listen(5000, () => console.log("Server running on 5000"));