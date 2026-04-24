// backend/controllers/medicineController.js
const Medicine = require('../models/medicineModel');

const getAll = (req, res) => {
  Medicine.getAll((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

const create = (req, res) => {
  const { name, description, quantity, expiryDate } = req.body;
  Medicine.create(name, description, quantity || 1, expiryDate || null, (err, id) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Medicine added', id });
  });
};

const remove = (req, res) => {
  const id = req.params.id;
  Medicine.remove(id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted' });
  });
};

module.exports = { getAll, create, remove };
