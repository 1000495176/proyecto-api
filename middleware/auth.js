const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const header = req.header('authorization') || req.header('x-auth-token');
  const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : header;
  if (!token) return res.status(401).json({ msg: 'No token, autorización denegada' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token no válido' });
  }
};
