import React, { useState, useEffect, useCallback } from 'react';
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
    const [allUcs, setAllUcs] = useState([]);
    const [visibleUcs, setVisibleUcs] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [visibleClasses, setVisibleClasses] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dataReady, setDataReady] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null });

    // Reset everything when modal opens
    useEffect(() => {
        if (isOpen) {
            setDataReady(false);
            if (isEditing && lesson) {
                setFormData({
                    courseId: String(lesson.courseId || ''),
                    ucId: String(lesson.ucId || ''),
                    turma: lesson.turma || '',
                    lab: lesson.lab || '',
                    period: lesson.period || '',
                    description: lesson.description || '',
                    date: lesson.date
                        ? (typeof lesson.date === 'string' ? lesson.date.split('T')[0] : `${lesson.date.getFullYear()}-${String(lesson.date.getMonth() + 1).padStart(2, '0')}-${String(lesson.date.getDate()).padStart(2, '0')}`)
                        : (selectedDate
                            ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
                            : new Date().toISOString().split('T')[0])
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
    }, [isOpen, lesson, initialDate]);

    const fetchOptions = async () => {
        setLoading(true);
        try {
            const [coursesRes, classesRes, ucsRes, labsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/settings/courses`),
                axios.get(`${API_BASE_URL}/api/settings/classes`),
                axios.get(`${API_BASE_URL}/api/settings/ucs`),
                axios.get(`${API_BASE_URL}/api/settings/labs`)
            ]);
            setCourses(coursesRes.data || []);
            setAllClasses(classesRes.data || []);
            setAllUcs(ucsRes.data || []);
            setLabs(labsRes.data || []);
            setDataReady(true);
        } catch (err) {
            console.error('Error fetching options:', err);
        } finally {
            setLoading(false);
        }
    };

    // FILTER LOGIC: Updates visibleClasses based on courseId
    // Only runs when data is ready (prevents race condition)
    useEffect(() => {
        if (!dataReady) return;

        if (!formData.courseId) {
            setVisibleClasses([]);
            return;
        }

        const courseIdStr = String(formData.courseId);
        const filtered = allClasses.filter(cls => {
            const cId = String(cls.courseId || cls.course?.id || cls.course?._id || '');
            return cId === courseIdStr;
        });
        setVisibleClasses(filtered);
    }, [formData.courseId, allClasses, dataReady]);

    // FILTER LOGIC: Updates visibleUcs based on courseId
    useEffect(() => {
        if (!dataReady) return;

        if (!formData.courseId) {
            setVisibleUcs([]);
            return;
        }

        const courseIdStr = String(formData.courseId);
        const filtered = allUcs.filter(uc => {
            const cId = String(uc.courseId || uc.course?.id || uc.course?._id || '');
            return cId === courseIdStr;
        });
        setVisibleUcs(filtered);
    }, [formData.courseId, allUcs, dataReady]);

    const handleCourseChange = (newCourseId) => {
        setFormData(prev => ({
            ...prev,
            courseId: newCourseId,
            turma: '',  // Reset Turma
            ucId: ''    // Reset UC
        }));
    };

    const handleClassChange = (val) => {
        setFormData(prev => ({
            ...prev,
            turma: val
        }));
    };

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
                // TIMEZONE FIX: Send date as YYYY-MM-DD string, never toISOString()
                date: typeof formData.date === 'string'
                    ? formData.date.split('T')[0]
                    : `${formData.date.getFullYear()}-${String(formData.date.getMonth() + 1).padStart(2, '0')}-${String(formData.date.getDate()).padStart(2, '0')}`
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
            const msg = err.response?.data?.error || 'Erro ao salvar aula. Tente novamente.';
            alert(msg);
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
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
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

    const selectStyle = {
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '0.9rem'
    };

    const labelStyle = {
        display: 'block',
        fontWeight: 500,
        marginBottom: '6px',
        fontSize: '0.85rem',
        color: 'var(--text-tertiary)'
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="540px">
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" /> Carregando opções...</div>
                    ) : (
                        <>
                            {/* Curso + Turma */}
                            <div className="modal-row-2col">
                                <div>
                                    <label style={labelStyle}>Curso *</label>
                                    <select
                                        style={selectStyle}
                                        onChange={(e) => handleCourseChange(e.target.value)}
                                        value={formData.courseId}
                                    >
                                        <option value="">Selecione o Curso</option>
                                        {courses.map(c => (
                                            <option key={c.id || c._id} value={String(c.id || c._id)}>
                                                {c.acronym || c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Turma *</label>
                                    <select
                                        style={{
                                            ...selectStyle,
                                            opacity: !formData.courseId ? 0.6 : 1
                                        }}
                                        onChange={(e) => handleClassChange(e.target.value)}
                                        value={formData.turma}
                                        disabled={!formData.courseId}
                                    >
                                        <option value="">Selecione a Turma</option>
                                        {visibleClasses.map(cls => (
                                            <option key={cls.id || cls._id} value={cls.name}>
                                                {cls.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* UC */}
                            <div>
                                <label style={labelStyle}>Unidade Curricular (UC) *</label>
                                <select
                                    disabled={!formData.courseId}
                                    style={{
                                        ...selectStyle,
                                        opacity: !formData.courseId ? 0.6 : 1
                                    }}
                                    onChange={(e) => handleChange('ucId', e.target.value)}
                                    value={formData.ucId}
                                >
                                    <option value="">{formData.courseId ? 'Selecione uma UC...' : 'Selecione primeiro o curso'}</option>
                                    {visibleUcs.map(uc => (
                                        <option key={uc.id || uc._id} value={String(uc.id || uc._id)}>
                                            {uc.name}{uc.desc ? ` - ${uc.desc}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Lab + Período */}
                            <div className="modal-row-2col">
                                <div>
                                    <label style={labelStyle}>Laboratório *</label>
                                    <select
                                        style={selectStyle}
                                        onChange={(e) => handleChange('lab', e.target.value)}
                                        value={formData.lab}
                                    >
                                        <option value="">Selecione</option>
                                        {labs.map(lab => (
                                            <option key={lab.id || lab._id} value={lab.name}>{lab.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Período *</label>
                                    <select
                                        style={selectStyle}
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

                            {/* Descrição */}
                            <div>
                                <label style={labelStyle}>Plano de Aula</label>
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

                {/* Footer buttons */}
                <div className="modal-footer">
                    {isEditing && (
                        <button onClick={handleDeleteClick} className="btn-outline modal-btn-delete" style={{ color: '#D32F2F', borderColor: '#FFCDD2', background: '#FFEBEE' }}>
                            <Trash2 size={18} /> Excluir
                        </button>
                    )}
                    <div className="modal-footer-actions">
                        <button className="btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Salvando...' : (isEditing ? 'Atualizar Aula' : 'Criar Aula')}
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
            />

            <style>{`
                .modal-row-2col {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }

                .modal-footer {
                    padding: 16px 20px;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    background: var(--bg-tertiary);
                    border-radius: 0 0 16px 16px;
                }

                .modal-footer-actions {
                    display: flex;
                    gap: 10px;
                    margin-left: auto;
                }

                @media (max-width: 640px) {
                    .modal-row-2col {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                    }

                    .modal-footer {
                        flex-direction: column !important;
                        gap: 10px !important;
                        padding: 16px !important;
                    }

                    .modal-footer-actions {
                        width: 100%;
                        margin-left: 0;
                    }

                    .modal-footer-actions button,
                    .modal-btn-delete {
                        width: 100% !important;
                        justify-content: center !important;
                    }

                    .modal-footer-actions {
                        flex-direction: column;
                    }
                }
            `}</style>
        </>
    );
}
