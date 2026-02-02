const mongoose = require('mongoose');

const LabSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: String },
});

module.exports = mongoose.model('Lab', LabSchema);
