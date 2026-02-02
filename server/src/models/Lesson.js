const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    turma: { type: String, required: true },
    uc: { type: String, required: true },
    period: { type: String, enum: ['Manhã', 'Tarde', 'Noite'], required: true },
    lab: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String },
});

module.exports = mongoose.model('Lesson', LessonSchema);
