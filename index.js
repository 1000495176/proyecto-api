// index.js
const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("./models/Appointment");

const app = express();
const PORT = 3000;

// Middleware para leer JSON
app.use(express.json());

// Conexión a MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/proyecto-api", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error conectando a MongoDB", err));

// Ruta principal
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

// Registrar usuario
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }
  res.json({ message: "Usuario registrado correctamente", user: { name, email } });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "lizeth@example.com" && password === "123456") {
    return res.json({ message: "Login exitoso" });
  }
  res.status(401).json({ message: "Credenciales inválidas" });
});

// Crear cita
app.post("/api/auth/appointments", async (req, res) => {
  try {
    const { date, time, description } = req.body;
    const newAppointment = new Appointment({ date, time, description });
    await newAppointment.save();
    res.json({ message: "Cita creada correctamente", appointment: newAppointment });
  } catch (error) {
    res.status(500).json({ message: "Error creando cita", error });
  }
});

// Listar citas
app.get("/api/auth/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo citas", error });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
