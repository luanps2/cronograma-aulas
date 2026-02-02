const mongoose = require('mongoose');

const UCSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Code (e.g., UC1)
    desc: { type: String, required: true }, // Description
    hours: { type: String, required: true }, // Workload (e.g., 60h, 120h)
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
});

module.exports = mongoose.model('UC', UCSchema);
