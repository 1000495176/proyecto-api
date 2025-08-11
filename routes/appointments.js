const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');

// Crear cita (usuario autenticado)
router.post('/', auth, [
  body('service').notEmpty(),
  body('start').isISO8601(),
  body('duration').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { service, start, duration, notes } = req.body;
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    // Buscar solapamientos (cualquier cita que tenga inicio < end y fin > start)
    const overlapping = await Appointment.findOne({
      $or: [
        { start: { $lt: endDate }, end: { $gt: startDate } }
      ],
      status: { $ne: 'cancelled' }
    });

    if (overlapping) return res.status(400).json({ msg: 'Horario no disponible' });

    const appointment = new Appointment({
      user: req.user,
      service,
      start: startDate,
      end: endDate,
      status: 'pending',
      notes
    });
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Obtener citas del usuario
router.get('/', auth, async (req, res) => {
  try {
    const appts = await Appointment.find({ user: req.user }).sort({ start: 1 });
    res.json(appts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Obtener, actualizar, cancelar por id (solo propietario)
router.get('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ msg: 'No encontrado' });
    if (appt.user.toString() !== req.user) return res.status(403).json({ msg: 'No autorizado' });
    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.put('/:id', auth, [
  body('start').optional().isISO8601(),
  body('duration').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['pending','confirmed','completed','cancelled'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ msg: 'No encontrado' });
    if (appt.user.toString() !== req.user) return res.status(403).json({ msg: 'No autorizado' });

    const updates = {};
    if (req.body.service) updates.service = req.body.service;
    if (req.body.start && req.body.duration) {
      const startDate = new Date(req.body.start);
      const endDate = new Date(startDate.getTime() + req.body.duration * 60000);
      const overlapping = await Appointment.findOne({
        _id: { $ne: appt._id },
        $or: [{ start: { $lt: endDate }, end: { $gt: startDate } }],
        status: { $ne: 'cancelled' }
      });
      if (overlapping) return res.status(400).json({ msg: 'Horario no disponible' });
      updates.start = startDate;
      updates.end = endDate;
    }
    if (req.body.status) updates.status = req.body.status;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;

    const updated = await Appointment.findByIdAndUpdate(appt._id, { $set: updates }, { new: true });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ msg: 'No encontrado' });
    if (appt.user.toString() !== req.user) return res.status(403).json({ msg: 'No autorizado' });
    appt.status = 'cancelled';
    await appt.save();
    res.json({ msg: 'Cancelado' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
