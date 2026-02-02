const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    acronym: { type: String, required: true, unique: true }, // Sigla (e.g., TI)
});

module.exports = mongoose.model('Course', CourseSchema);
