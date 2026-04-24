// backend/controllers/equipmentController.js
const Equipment = require('../models/equipmentModel');

const getAll = (req, res) => {
  Equipment.getAll((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

const create = (req, res) => {
  const { name, description, quantity, condition } = req.body;
  Equipment.create(name, description, quantity || 1, condition || 'good', (err, id) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Equipment added', id });
  });
};

const remove = (req, res) => {
  const id = req.params.id;
  Equipment.remove(id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted' });
  });
};

module.exports = { getAll, create, remove };
