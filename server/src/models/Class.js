const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Auto-generated (e.g., TI - 27)
    number: { type: String, required: true }, // Raw number (e.g., 27)
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    year: { type: String }, // Optional, mostly metadata
});

module.exports = mongoose.model('Class', ClassSchema);
