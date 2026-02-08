import React, { useState, useEffect } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
import API_BASE_URL from '../config/api';

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
    const [allUcs, setAllUcs] = useState([]); // Base state for UCs
    const [visibleUcs, setVisibleUcs] = useState([]); // Filtered UCs
    const [allClasses, setAllClasses] = useState([]); // Base state for Classes
    const [visibleClasses, setVisibleClasses] = useState([]); // Filtered Classes
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null });

    useEffect(() => {
        if (isOpen) {
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
            fetchOptions();
        }
    }, [isOpen, lesson, initialDate, isEditing]);

    const fetchOptions = async () => {
        setLoading(true);
        try {
            const [coursesRes, classesRes, ucsRes, labsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/settings/courses`),
                axios.get(`${API_BASE_URL}/api/settings/classes`),
                axios.get(`${API_BASE_URL}/api/settings/ucs`),
                axios.get(`${API_BASE_URL}/api/settings/labs`)
            ]);
            setCourses(coursesRes.data);
            setAllClasses(classesRes.data);
            setAllUcs(ucsRes.data);
            setLabs(labsRes.data);
        } catch (err) {
            console.error('Error fetching options:', err);
        } finally {
            setLoading(false);
        }
    };

    // FILTER LOGIC: Updates visibleClasses based on courseId and allClasses
    useEffect(() => {
        if (!formData.courseId) {
            setVisibleClasses([]);
            return;
        }

        const filtered = allClasses.filter(cls => {
            const cId = cls.courseId || cls.course?._id || cls.course?.id;
            return cId && String(cId) === String(formData.courseId);
        });
        setVisibleClasses(filtered);
    }, [formData.courseId, allClasses]);

    // FILTER LOGIC: Updates visibleUcs based on courseId and allUcs
    useEffect(() => {
        if (!formData.courseId) {
            setVisibleUcs([]);
            return;
        }

        const filtered = allUcs.filter(uc => {
            const cId = uc.courseId || uc.course?._id || uc.course?.id;
            return cId && String(cId) === String(formData.courseId);
        });
        setVisibleUcs(filtered);
    }, [formData.courseId, allUcs]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.courseId || !formData.ucId || !formData.turma || !formData.lab || !formData.period) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                courseId: parseInt(formData.courseId),
                ucId: parseInt(formData.ucId),
                turma: formData.turma,
                lab: formData.lab,
                period: formData.period,
                description: formData.description,
                date: formData.date.toISOString()
            };

            if (isEditing && lesson?.id) {
                await axios.put(`${API_BASE_URL}/api/lessons/${lesson.id}`, payload);
            } else {
                await axios.post(`${API_BASE_URL}/api/lessons`, payload);
            }

            onSave();
            onClose();
        } catch (err) {
            console.error('Error saving lesson:', err);
            alert('Erro ao salvar aula. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!lesson?.id) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/lessons/${lesson.id}`);
            onSave();
            onClose();
        } catch (err) {
            console.error('Error deleting lesson:', err);
            alert('Erro ao excluir aula.');
        }
    };

    const handleDeleteClick = () => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Confirmar Exclusão',
            message: 'Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            onConfirm: () => {
                setConfirmModal({ ...confirmModal, isOpen: false });
                handleDelete();
            }
        });
    };

    const modalTitle = (
        <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>
                {isEditing ? 'Editar Aula' : 'Nova Aula'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                {(formData.date instanceof Date && !isNaN(formData.date))
                    ? formData.date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Data Inválida'}
            </div>
        </div>
    );

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="540px">
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" /> Carregando opções...</div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Curso *</label>
                                    <select
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '0.9rem' }}
                                        onChange={(e) => {
                                            const newCourseId = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                courseId: newCourseId,
                                                turma: '', // Reset Turma
                                                ucId: ''   // Reset UC
                                            }));
                                        }}
                                        value={formData.courseId}
                                    >
                                        <option value="">Selecione o Curso</option>
                                        {courses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.acronym}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Turma *</label>
                                    <select
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            opacity: !formData.courseId ? 0.6 : 1
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                turma: val,
                                                ucId: '' // Reset UC when Class changes
                                            }));
                                        }}
                                        value={formData.turma}
                                        disabled={!formData.courseId} // Disabled if no course
                                    >
                                        <option value="">Selecione a Turma</option>
                                        {visibleClasses.map(cls => (
                                            <option key={cls.id || cls._id} value={cls.name}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Unidade Curricular (UC) *</label>
                                <select
                                    disabled={!formData.courseId}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        opacity: !formData.courseId ? 0.6 : 1
                                    }}
                                    onChange={(e) => handleChange('ucId', e.target.value)}
                                    value={formData.ucId}
                                >
                                    <option value="">{formData.courseId ? 'Selecione uma UC...' : 'Selecione primeiro o curso'}</option>
                                    {visibleUcs.map(uc => (
                                        <option key={uc.id} value={uc.id}>{uc.name} - {uc.desc}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Laboratório *</label>
                                    <select
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '0.9rem' }}
                                        onChange={(e) => handleChange('lab', e.target.value)}
                                        value={formData.lab}
                                    >
                                        <option value="">Selecione</option>
                                        {labs.map(lab => (
                                            <option key={lab.id} value={lab.name}>{lab.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Período *</label>
                                    <select
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '0.9rem' }}
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
                                <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Plano de Aula</label>
                                <textarea
                                    placeholder="Conteúdo programático da aula..."
                                    rows={3}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    value={formData.description}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: isEditing ? 'space-between' : 'flex-end', gap: '10px', background: 'var(--bg-tertiary)', borderRadius: '0 0 16px 16px' }}>
                    {isEditing && (
                        <button onClick={handleDeleteClick} className="btn-outline" style={{ color: '#D32F2F', borderColor: '#FFCDD2', background: '#FFEBEE' }}>
                            <Trash2 size={18} /> Excluir
                        </button>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Salvando...' : (isEditing ? 'Atualizar Aula' : 'Criar Aula')}
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
            />
        </>
    );
}
