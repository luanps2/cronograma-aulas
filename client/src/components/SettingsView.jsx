import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, GraduationCap, Users, BookOpen, Monitor, Loader2, Edit2, ChevronDown, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import CourseForm from './forms/CourseForm';
import ClassForm from './forms/ClassForm';
import UCForm from './forms/UCForm';
import LabForm from './forms/LabForm';
import SettingsFormModal from './SettingsFormModal';

export default function SettingsView({ onBack }) {
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Accordion State for Courses
    // Storing expanded course ID to fetch and show UCs
    const [expandedCourseId, setExpandedCourseId] = useState(null);
    const [courseUCs, setCourseUCs] = useState({}); // Cache UCs by courseId: { [id]: [ucs] }
    const [loadingUCs, setLoadingUCs] = useState({}); // Loading state by courseId

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: null, // 'course', 'uc', 'class', 'lab'
        data: null, // Editing data or null for new
        parentId: null // For UCs (courseId)
    });

    // Clear Month State
    const [clearModal, setClearModal] = useState({ isOpen: false, year: new Date().getFullYear(), month: new Date().getMonth() });
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    // Fetch UCs when a course is expanded and not yet cached (or invalid)
    useEffect(() => {
        if (expandedCourseId && !courseUCs[expandedCourseId]) {
            fetchUCsByCourse(expandedCourseId);
        }
    }, [expandedCourseId]);

    const fetchAll = async () => {
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
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUCsByCourse = async (courseId) => {
        setLoadingUCs(prev => ({ ...prev, [courseId]: true }));
        try {
            const res = await axios.get(`http://localhost:5000/api/settings/courses/${courseId}/ucs`);
            setCourseUCs(prev => ({ ...prev, [courseId]: res.data }));
        } catch (error) {
            console.error('Error fetching UCs:', error);
        } finally {
            setLoadingUCs(prev => ({ ...prev, [courseId]: false }));
        }
    };

    const handleToggleCourse = (courseId) => {
        setExpandedCourseId(prev => prev === courseId ? null : courseId);
    };

    const handleDelete = async (type, id, parentId = null) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/settings/${type}/${id}`);

            if (type === 'ucs' && parentId) {
                // Refresh specific course UCs
                fetchUCsByCourse(parentId);
            } else {
                fetchAll();
            }
        } catch (error) {
            const message = error.response?.data?.error || 'Erro ao excluir item';
            alert(message);
        }
    };

    const handleOpenModal = (type, data = null, parentId = null) => {
        setModalConfig({ isOpen: true, type, data, parentId });
    };

    const handleCloseModal = () => {
        setModalConfig({ isOpen: false, type: null, data: null, parentId: null });
    };

    const handleCreateOrUpdate = async (type, data, id = null) => {
        try {
            let finalData = { ...data };
            // Inject parent ID if necessary (for UCs)
            if (type === 'ucs' && modalConfig.parentId) {
                finalData.courseId = modalConfig.parentId;
            }

            if (id) {
                await axios.put(`http://localhost:5000/api/settings/${type}/${id}`, finalData);
            } else {
                await axios.post(`http://localhost:5000/api/settings/${type}`, finalData);
            }

            handleCloseModal();

            if (type === 'ucs' && modalConfig.parentId) {
                fetchUCsByCourse(modalConfig.parentId);
            } else {
                fetchAll();
            }
        } catch (error) {
            const message = error.response?.data?.error || 'Erro ao salvar item';
            alert(message);
        }
    };

    const handleClearMonth = async () => {
        if (!confirm(`ATENÇÃO: Isso apagará TODAS as aulas de ${clearModal.month + 1}/${clearModal.year}. Confirmar?`)) return;

        setClearing(true);
        try {
            const res = await axios.delete('http://localhost:5000/api/lessons/clear-month', {
                data: { year: clearModal.year, month: clearModal.month + 1 } // API expects 1-based month
            });
            alert(res.data.message || 'Calendário limpo com sucesso.');
            setClearModal({ ...clearModal, isOpen: false });
        } catch (error) {
            console.error('Error clearing month:', error);
            alert('Erro ao limpar calendário.');
        } finally {
            setClearing(false);
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="animate-spin" /> Carregando configurações...</div>;

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '20px' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                <button onClick={onBack} className="btn-outline" style={{ border: 'none', padding: '10px' }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src="/senac-logo.png" alt="Senac" style={{ height: '40px' }} />
                    <div style={{ borderLeft: '1px solid #ddd', paddingLeft: '15px' }}>
                        <h1 style={{ fontSize: '20px', color: '#004587', margin: 0 }}>Configurações</h1>
                        <span style={{ fontSize: '14px', color: '#666' }}>Gerencie a estrutura hierárquica do SENAC</span>
                    </div>
                </div>
            </header>

            <div className="settings-grid">
                {/* CURSOS & UCs (Merged Column) */}
                <SettingsColumn
                    title="Estrutura Acadêmica (Cursos e UCs)"
                    count={`${courses.length} cursos`}
                    icon={<GraduationCap size={20} color="#5E35B1" />}
                    iconBg="#EDE7F6"
                    action={<button className="btn-icon-add" onClick={() => handleOpenModal('course')}><Plus size={18} /></button>}
                >
                    <div className="settings-scroll">
                        {courses.map(course => {
                            const isExpanded = expandedCourseId === course._id;
                            const ucs = courseUCs[course._id] || [];
                            const isLoadingUCs = loadingUCs[course._id];

                            // Calculate Total Hours securely
                            const totalHours = ucs.reduce((acc, uc) => {
                                const h = parseInt(String(uc.hours || 0).replace(/\D/g, ''), 10) || 0;
                                return acc + h;
                            }, 0);

                            return (
                                <div key={course._id} className={`course-card ${isExpanded ? 'expanded' : ''}`}>
                                    <div
                                        className="course-header"
                                        onClick={() => handleToggleCourse(course._id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                            {isExpanded ? <ChevronDown size={18} color="#5E35B1" /> : <ChevronRight size={18} color="#666" />}
                                            <div style={{ fontWeight: 700, color: '#5E35B1', fontSize: '0.95rem' }}>{course.acronym}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#333' }}>- {course.name}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button className="btn-icon-edit" onClick={(e) => { e.stopPropagation(); handleOpenModal('course', course); }}><Edit2 size={16} /></button>
                                            <button className="btn-icon-delete" onClick={(e) => { e.stopPropagation(); handleDelete('courses', course._id); }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="course-body">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 5px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666' }}>UNIDADES CURRICULARES</span>
                                                    {ucs.length > 0 && (
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0277BD', background: '#E1F5FE', padding: '2px 8px', borderRadius: '12px', border: '1px solid #B3E5FC' }}>
                                                            Total: {totalHours}h
                                                        </span>
                                                    )}
                                                </div>
                                                <button className="btn-small-add" onClick={() => handleOpenModal('uc', null, course._id)}>
                                                    <Plus size={14} /> Nova UC
                                                </button>
                                            </div>

                                            {isLoadingUCs ? (
                                                <div style={{ padding: '10px', textAlign: 'center', color: '#999', fontSize: '0.8rem' }}><Loader2 size={16} className="animate-spin" /> Carregando UCs...</div>
                                            ) : ucs.length > 0 ? (
                                                <div className="ucs-list">
                                                    {ucs.map(uc => (
                                                        <div key={uc._id} className="uc-item" onClick={() => handleOpenModal('uc', uc, course._id)}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{uc.name}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{uc.desc}</div>
                                                            </div>
                                                            <div className="uc-meta">
                                                                <span className="badge-hours">{parseInt(String(uc.hours || 0).replace(/\D/g, ''), 10)}h</span>
                                                                <button className="btn-icon-mini-delete" onClick={(e) => { e.stopPropagation(); handleDelete('ucs', uc._id, course._id); }}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ padding: '15px', textAlign: 'center', color: '#AAA', fontSize: '0.8rem', fontStyle: 'italic', background: '#F5F5F5', borderRadius: '6px' }}>
                                                    Nenhuma UC cadastrada neste curso.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </SettingsColumn>

                {/* TURMAS */}
                <SettingsColumn
                    title="Turmas"
                    count={`${classes.length} turmas`}
                    icon={<Users size={20} color="#F57C00" />}
                    iconBg="#FFF3E0"
                    action={<button className="btn-icon-add" onClick={() => handleOpenModal('class')}><Plus size={18} /></button>}
                >
                    <div className="settings-scroll">
                        {classes.map(cls => (
                            <div
                                key={cls._id}
                                className="card-item simple"
                                onClick={() => handleOpenModal('class', cls)}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{cls.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{cls.course?.name || 'Sem curso'}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button className="btn-icon-edit" onClick={(e) => { e.stopPropagation(); handleOpenModal('class', cls); }}><Edit2 size={16} /></button>
                                    <button className="btn-icon-delete" onClick={(e) => { e.stopPropagation(); handleDelete('classes', cls._id); }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SettingsColumn>

                {/* LABORATORIOS */}
                <SettingsColumn
                    title="Laboratórios"
                    count={`${labs.length} laboratórios`}
                    icon={<Monitor size={20} color="#455A64" />}
                    iconBg="#ECEFF1"
                    action={<button className="btn-icon-add" onClick={() => handleOpenModal('lab')}><Plus size={18} /></button>}
                >
                    <div className="settings-scroll">
                        {labs.map(lab => (
                            <div
                                key={lab._id}
                                className="card-item simple"
                                onClick={() => handleOpenModal('lab', lab)}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{lab.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{lab.capacity}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button className="btn-icon-edit" onClick={(e) => { e.stopPropagation(); handleOpenModal('lab', lab); }}><Edit2 size={16} /></button>
                                    <button className="btn-icon-delete" onClick={(e) => { e.stopPropagation(); handleDelete('labs', lab._id); }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SettingsColumn>

                {/* Administration */}
                <SettingsColumn title="Administração" count="" icon={<AlertTriangle size={20} color="#D32F2F" />} iconBg="#FFEBEE" action={null}>
                    <div className="settings-scroll">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ padding: '15px', background: '#FFEBEE', borderRadius: '8px', border: '1px solid #FFCDD2' }}>
                                <h4 style={{ margin: '0 0 8px 0', color: '#B71C1C', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={16} /> Limpeza de Calendário
                                </h4>
                                <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#C62828' }}>
                                    Apagar todas as aulas de um mês específico. Ação irreversível.
                                </p>
                                <button
                                    onClick={() => setClearModal({ isOpen: true, year: new Date().getFullYear(), month: new Date().getMonth() })}
                                    style={{ width: '100%', padding: '8px', background: 'white', border: '1px solid #EF9A9A', borderRadius: '6px', color: '#D32F2F', cursor: 'pointer', fontWeight: 500 }}
                                >
                                    Limpar Mês
                                </button>
                            </div>
                        </div>
                    </div>
                </SettingsColumn>
            </div>

            {/* MODAL WRAPPER */}
            <SettingsFormModal
                isOpen={modalConfig.isOpen}
                onClose={handleCloseModal}
                title={
                    modalConfig.type === 'course' ? (modalConfig.data ? 'Editar Curso' : 'Novo Curso') :
                        modalConfig.type === 'uc' ? (modalConfig.data ? 'Editar UC' : 'Nova UC') :
                            modalConfig.type === 'class' ? (modalConfig.data ? 'Editar Turma' : 'Nova Turma') :
                                modalConfig.type === 'lab' ? (modalConfig.data ? 'Editar Laboratório' : 'Novo Laboratório') : ''
                }
            >
                {modalConfig.type === 'course' && (
                    <CourseForm
                        initialData={modalConfig.data}
                        onSubmit={(data) => handleCreateOrUpdate('courses', data, modalConfig.data?._id)}
                        onCancel={handleCloseModal}
                        isModal
                    />
                )}
                {modalConfig.type === 'uc' && (
                    <UCForm
                        courses={courses} // Still pass courses, but maybe pre-select if parentId exists? The form handles it.
                        initialData={modalConfig.data}
                        onSubmit={(data) => handleCreateOrUpdate('ucs', data, modalConfig.data?._id)}
                        onCancel={handleCloseModal}
                        isModal
                        defaultCourseId={modalConfig.parentId}
                    />
                )}
                {modalConfig.type === 'class' && (
                    <ClassForm
                        courses={courses}
                        initialData={modalConfig.data}
                        onSubmit={(data) => handleCreateOrUpdate('classes', data, modalConfig.data?._id)}
                        onCancel={handleCloseModal}
                        isModal
                    />
                )}
                {modalConfig.type === 'lab' && (
                    <LabForm
                        initialData={modalConfig.data}
                        onSubmit={(data) => handleCreateOrUpdate('labs', data, modalConfig.data?._id)}
                        onCancel={handleCloseModal}
                        isModal
                    />
                )}
            </SettingsFormModal>

            <style>{`
                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    height: calc(100vh - 150px);
                    align-items: stretch;
                }
                .settings-column {
                    background: white;
                    border: 1px solid #EEE;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .settings-scroll {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                    display: flex; 
                    flex-direction: column; 
                    gap: 12px;
                }
                
                /* Course Card & Accordion */
                .course-card {
                    border: 1px solid #E0E0E0;
                    border-radius: 8px;
                    background: white;
                    transition: all 0.2s;
                    overflow: hidden;
                }
                .course-card.expanded {
                    border-color: #5E35B1;
                    box-shadow: 0 2px 8px rgba(94, 53, 177, 0.1);
                }
                .course-header {
                    padding: 12px 15px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    background: #FAFAFA;
                }
                .course-card.expanded .course-header {
                    background: #EDE7F6;
                    border-bottom: 1px solid #D1C4E9;
                }
                .course-body {
                    padding: 15px;
                    background: white;
                }

                /* UC List inside Course */
                .ucs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-height: 400px;
                    overflow-y: auto;
                    padding-right: 4px;
                }
                .ucs-list::-webkit-scrollbar { width: 6px; }
                .ucs-list::-webkit-scrollbar-thumb { background: #E0E0E0; border-radius: 3px; }
                .ucs-list::-webkit-scrollbar-thumb:hover { background: #BDBDBD; }
                .uc-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    border: 1px solid #EEE;
                    border-radius: 6px;
                    background: #FFF;
                    cursor: pointer;
                    transition: 0.1s;
                }
                .uc-item:hover {
                    border-color: #0277BD;
                    background: #E1F5FE;
                }
                .uc-meta {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .badge-hours {
                    background: #FFF3E0;
                    color: #F57C00;
                    font-size: 0.75rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 600;
                }

                /* Independent Cards (simple) */
                .card-item.simple {
                    background: white; 
                    border: 1px solid #EEE; 
                    padding: 15px; 
                    border-radius: 8px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .card-item.simple:hover {
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    border-color: #DDD;
                }

                /* Buttons */
                .btn-icon-add {
                    background: #E3F2FD;
                    color: #0277BD;
                    border: none;
                    border-radius: 6px;
                    padding: 6px;
                    cursor: pointer;
                    transition: 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-icon-add:hover { background: #BBDEFB; }

                .btn-small-add {
                    background: none;
                    border: 1px dashed #0277BD;
                    color: #0277BD;
                    font-size: 0.75rem;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex; align-items: center; gap: 4px;
                }
                .btn-small-add:hover { background: #E1F5FE; }

                .btn-icon-edit, .btn-icon-delete, .btn-icon-mini-delete {
                    background: none; border: none; cursor: pointer; opacity: 0.6; padding: 4px;
                }
                .btn-icon-edit:hover { color: #0277BD; opacity: 1; background: #E1F5FE; border-radius: 4px; }
                .btn-icon-delete:hover { color: #C62828; opacity: 1; background: #FFEBEE; border-radius: 4px; }
                .btn-icon-mini-delete:hover { color: #C62828; opacity: 1; }

                /* Mobile */
                @media (max-width: 1200px) {
                    .settings-grid {
                        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                        height: auto;
                    }
                    .settings-column { height: 600px; }
                }
                @media (max-width: 768px) {
                    .settings-grid { grid-template-columns: 1fr; }
                    .settings-column { height: auto; min-height: 400px; }
                }
            `}</style>
        </div>
    );
}

function SettingsColumn({ title, count, icon, iconBg, action, children }) {
    return (
        <div className="settings-column">
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: iconBg }}>{icon}</div>
                    <div>
                        <h3 style={{ fontSize: '1rem', color: '#333', margin: 0 }}>{title}</h3>
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>{count}</span>
                    </div>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}
