const express = require('express');
const app = express();
const PORT = 3000;

// Middleware para recibir JSON
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando 🚀');
});

// Rutas de autenticación
app.post('/api/auth/register', (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  res.json({
    message: 'Usuario registrado correctamente',
    user: { nombre, email }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
