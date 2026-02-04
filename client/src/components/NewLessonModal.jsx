import React, { useState, useEffect } from 'react';
import { X, Loader2, Trash2 } from 'lucide-react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';

export default function NewLessonModal({ isOpen, onClose, onSave, initialDate, lesson }) {
    const isEditing = !!lesson;

    const [formData, setFormData] = useState({
        courseId: '',
        ucId: '',
        turma: '',
        lab: '',
        period: '',
        description: '',
        date: initialDate || new Date()
    });

    const [courses, setCourses] = useState([]);
    const [ucs, setUcs] = useState([]);
    const [classes, setClasses] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null });

    useEffect(() => {
        if (isOpen) {
            // Reset or Load Lesson
            if (isEditing && lesson) {
                setFormData({
                    courseId: lesson.courseId,
                    ucId: lesson.ucId,
                    turma: lesson.turma,
                    lab: lesson.lab,
                    period: lesson.period,
                    description: lesson.description || '',
                    date: lesson.date ? new Date(lesson.date) : new Date()
                });
            } else {
                setFormData({
                    courseId: '',
                    ucId: '',
                    turma: '',
                    lab: '',
                    period: '',
                    description: '',
                    date: initialDate || new Date()
                });
            }
            fetchInitialData();
        }
    }, [isOpen, initialDate, lesson]);

    // Fetch UCs whenever course changes
    useEffect(() => {
        if (formData.courseId) {
            fetchUCsByCourse(formData.courseId);
        } else {
            setUcs([]);
            if (!isEditing) { // Only clear if not initial edit load
                setFormData(prev => ({ ...prev, ucId: '' }));
            }
        }
    }, [formData.courseId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [resCourses, resClasses, resLabs] = await Promise.all([
                axios.get('http://localhost:5000/api/settings/courses'),
                axios.get('http://localhost:5000/api/settings/classes'),
                axios.get('http://localhost:5000/api/settings/labs')
            ]);
            setCourses(resCourses.data);
            setClasses(resClasses.data);
            setLabs(resLabs.data);
        } catch (error) {
            console.error('Error fetching modal data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUCsByCourse = async (courseId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/settings/courses/${courseId}/ucs`);
            setUcs(res.data);
        } catch (error) {
            console.error('Error fetching filtered UCs:', error);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.courseId || !formData.ucId || !formData.turma || !formData.lab || !formData.period) {
            setConfirmModal({
                isOpen: true,
                type: 'error',
                title: 'Campos Obrigatórios',
                message: 'Por favor, preencha todos os campos obrigatórios (*)',
                confirmText: 'Entendi'
            });
            return;
        }

        setSaving(true);
        try {
            if (isEditing) {
                await axios.put(`http://localhost:5000/api/lessons/${lesson.id}`, formData);
            } else {
                await axios.post('http://localhost:5000/api/lessons', formData);
            }
            onSave();
            onClose();
        } catch (error) {
            const message = error.response?.data?.error || 'Erro ao salvar aula';
            setConfirmModal({
                isOpen: true,
                type: 'error',
                title: 'Erro ao Salvar',
                message: message,
                confirmText: 'Fechar'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = () => {
        setConfirmModal({
            isOpen: true,
            type: 'confirm',
            title: 'Excluir Aula',
            message: 'Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            onConfirm: executeDelete
        });
    };

    const executeDelete = async () => {
        setSaving(true);
        try {
            await axios.delete(`http://localhost:5000/api/lessons/${lesson.id}`);
            onSave();
            onClose();
        } catch (error) {
            setConfirmModal({
                isOpen: true,
                type: 'error',
                title: 'Erro ao Excluir',
                message: 'Não foi possível excluir a aula. Tente novamente.',
                confirmText: 'Fechar'
            });
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '540px', width: '90%' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', color: '#1A1A1A', margin: 0 }}>
                            {isEditing ? 'Editar Aula' : 'Nova Aula'}
                        </h2>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>
                            {(formData.date instanceof Date && !isNaN(formData.date))
                                ? formData.date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                : 'Data Inválida'}
                        </span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#666" /></button>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" /> Carregando opções...</div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: '#555' }}>Curso *</label>
                                    <select
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '0.9rem' }}
                                        onChange={(e) => handleChange('courseId', e.target.value)}
                                        value={formData.courseId}
                                    >
                                        <option value="">Selecione o Curso</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.acronym}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: '#555' }}>Turma *</label>
                                    <select
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '0.9rem' }}
                                        onChange={(e) => handleChange('turma', e.target.value)}
                                        value={formData.turma}
                                    >
                                        <option value="">Selecione a Turma</option>
                                        {classes.filter(cls => !formData.courseId || cls.courseId === parseInt(formData.courseId)).map(cls => (
                                            <option key={cls.id} value={cls.name}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: '#555' }}>Unidade Curricular (UC) *</label>
                                <select
                                    disabled={!formData.courseId}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #DDD',
                                        fontSize: '0.9rem',
                                        background: !formData.courseId ? '#FAFAFA' : 'white'
                                    }}
                                    onChange={(e) => handleChange('ucId', e.target.value)}
                                    value={formData.ucId}
                                >
                                    <option value="">{formData.courseId ? 'Selecione uma UC...' : 'Selecione primeiro o curso'}</option>
                                    {ucs.map(uc => (
                                        <option key={uc.id} value={uc.id}>{uc.name} - {uc.desc}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: '#555' }}>Laboratório *</label>
                                    <select
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '0.9rem' }}
                                        onChange={(e) => handleChange('lab', e.target.value)}
                                        value={formData.lab}
                                    >
                                        <option value="">Selecione</option>
                                        {labs.map(lab => (
                                            <option key={lab._id} value={lab.name}>{lab.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: '#555' }}>Período *</label>
                                    <select
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '0.9rem' }}
                                        onChange={(e) => handleChange('period', e.target.value)}
                                        value={formData.period}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Manhã">Manhã</option>
                                        <option value="Tarde">Tarde</option>
                                        <option value="Noite">Noite</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: '#555' }}>Plano de Aula</label>
                                <textarea
                                    placeholder="Conteúdo programático da aula..."
                                    rows={3}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '0.9rem', fontFamily: 'inherit' }}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    value={formData.description}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid #E0E0E0', display: 'flex', justifyContent: isEditing ? 'space-between' : 'flex-end', gap: '10px', background: '#FAFAFA', borderRadius: '0 0 12px 12px' }}>
                    {isEditing && (
                        <button onClick={handleDeleteClick} className="btn-outline" style={{ color: '#D32F2F', borderColor: '#FFCDD2', background: '#FFEBEE' }}>
                            <Trash2 size={18} /> Excluir
                        </button>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-outline" style={{ background: 'white' }} onClick={onClose} disabled={saving}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Salvando...' : (isEditing ? 'Atualizar Aula' : 'Criar Aula')}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    );
}

