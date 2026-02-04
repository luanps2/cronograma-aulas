import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, GraduationCap, Users, BookOpen, Monitor, Loader2, Edit2, X } from 'lucide-react';
import axios from 'axios';
import CourseForm from './forms/CourseForm';
import ClassForm from './forms/ClassForm';
import UCForm from './forms/UCForm';
import LabForm from './forms/LabForm';

export default function SettingsView({ onBack }) {
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [ucs, setUcs] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Context states
    const [selectedCourseForUCs, setSelectedCourseForUCs] = useState(null);

    // Edit states
    const [editingCourse, setEditingCourse] = useState(null);
    const [editingClass, setEditingClass] = useState(null);
    const [editingUC, setEditingUC] = useState(null);
    const [editingLab, setEditingLab] = useState(null);

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (selectedCourseForUCs) {
            fetchUCsByCourse(selectedCourseForUCs.id || selectedCourseForUCs._id);
        } else {
            setUcs([]);
        }
    }, [selectedCourseForUCs]);

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
        try {
            const res = await axios.get(`http://localhost:5000/api/settings/courses/${courseId}/ucs`);
            setUcs(res.data);
        } catch (error) {
            console.error('Error fetching UCs:', error);
        }
    };

    const handleDelete = async (type, id) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/settings/${type}/${id}`);
            if (type === 'ucs' && selectedCourseForUCs) {
                fetchUCsByCourse(selectedCourseForUCs.id || selectedCourseForUCs._id);
            } else {
                fetchAll();
            }
        } catch (error) {
            const message = error.response?.data?.error || 'Erro ao excluir item';
            alert(message);
        }
    };

    const handleCreateOrUpdate = async (type, data, id = null) => {
        try {
            // Inject context courseId for UCs if creation
            let finalData = { ...data };
            if (type === 'ucs' && selectedCourseForUCs) {
                finalData.courseId = selectedCourseForUCs.id || selectedCourseForUCs._id;
            }

            if (id) {
                await axios.put(`http://localhost:5000/api/settings/${type}/${id}`, finalData);
            } else {
                await axios.post(`http://localhost:5000/api/settings/${type}`, finalData);
            }

            // Clear editing states
            setEditingCourse(null);
            setEditingClass(null);
            setEditingUC(null);
            setEditingLab(null);

            if (type === 'ucs' && selectedCourseForUCs) {
                fetchUCsByCourse(selectedCourseForUCs.id || selectedCourseForUCs._id);
            } else {
                fetchAll();
            }
        } catch (error) {
            const message = error.response?.data?.error || 'Erro ao salvar item';
            alert(message);
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
                {/* CURSOS */}
                <SettingsColumn title="Cursos" count={`${courses.length} cursos`} icon={<GraduationCap size={20} color="#5E35B1" />} iconBg="#EDE7F6">
                    <div style={{ padding: '0 15px 15px 15px' }}>
                        <CourseForm
                            initialData={editingCourse}
                            onSubmit={(data) => handleCreateOrUpdate('courses', data, editingCourse?._id)}
                            onCancel={() => setEditingCourse(null)}
                        />
                    </div>
                    <div className="settings-scroll">
                        {courses.map(course => (
                            <div
                                key={course._id}
                                className={`card-item ${selectedCourseForUCs?._id === course._id ? 'selected' : ''}`}
                                style={{
                                    cursor: 'pointer',
                                    border: selectedCourseForUCs?._id === course._id ? '2px solid #5E35B1' : editingCourse?._id === course._id ? '2px solid #5E35B1' : '1px solid #EEE'
                                }}
                                onClick={() => { setEditingCourse(course); setSelectedCourseForUCs(course); }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#5E35B1', fontSize: '0.95rem', marginBottom: '4px' }}>{course.acronym}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#333' }}>{course.name}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button className="btn-icon-edit" onClick={(e) => { e.stopPropagation(); setEditingCourse(course); }}><Edit2 size={16} /></button>
                                    <button className="btn-icon-delete" onClick={(e) => { e.stopPropagation(); handleDelete('courses', course._id); }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SettingsColumn>

                {/* UNIDADES CURRICULARES (Obrigatório Curso) */}
                <SettingsColumn
                    title="Unidades Curriculares"
                    count={selectedCourseForUCs ? `${ucs.length} UCs em ${selectedCourseForUCs.acronym}` : 'Selecione um curso'}
                    icon={<BookOpen size={20} color="#0277BD" />}
                    iconBg="#E1F5FE"
                >
                    {selectedCourseForUCs ? (
                        <>
                            <div style={{ padding: '15px' }}>
                                <div style={{ padding: '8px 12px', background: '#E3F2FD', borderRadius: '6px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#01579B' }}>
                                        Curso: {selectedCourseForUCs.acronym}
                                    </span>
                                    <button onClick={() => setSelectedCourseForUCs(null)} style={{ background: 'none', border: 'none', color: '#0277BD', cursor: 'pointer', fontSize: '0.8rem' }}>Trocar</button>
                                </div>
                                <UCForm
                                    courses={courses}
                                    initialData={editingUC}
                                    onSubmit={(data) => handleCreateOrUpdate('ucs', data, editingUC?._id)}
                                    onCancel={() => setEditingUC(null)}
                                />
                            </div>
                            <div className="settings-scroll">
                                {ucs.map(uc => (
                                    <div
                                        key={uc._id}
                                        className="card-item"
                                        style={{ display: 'block', border: editingUC?._id === uc._id ? '2px solid #0277BD' : '', cursor: 'pointer' }}
                                        onClick={() => setEditingUC(uc)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{uc.name}</span>
                                            <span style={{ background: '#FFF3E0', color: '#F57C00', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{uc.hours}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '8px' }}>{uc.desc}</div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                                            <button className="btn-icon-edit" onClick={(e) => { e.stopPropagation(); setEditingUC(uc); }}><Edit2 size={16} /></button>
                                            <button className="btn-icon-delete" onClick={(e) => { e.stopPropagation(); handleDelete('ucs', uc._id); }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666', background: '#FAFAFA', borderRadius: '8px', border: '1px dashed #DDD', margin: '20px' }}>
                            <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
                            <p style={{ fontSize: '0.9rem' }}>Selecione um curso à esquerda para visualizar e gerenciar suas Unidades Curriculares.</p>
                        </div>
                    )}
                </SettingsColumn>

                {/* TURMAS */}
                <SettingsColumn title="Turmas" count={`${classes.length} turmas`} icon={<Users size={20} color="#F57C00" />} iconBg="#FFF3E0">
                    <div style={{ padding: '0 15px 15px 15px' }}>
                        <ClassForm
                            courses={courses}
                            initialData={editingClass}
                            onSubmit={(data) => handleCreateOrUpdate('classes', data, editingClass?._id)}
                            onCancel={() => setEditingClass(null)}
                        />
                    </div>
                    <div className="settings-scroll">
                        {classes.map(cls => (
                            <div
                                key={cls._id}
                                className="card-item"
                                style={{ border: editingClass?._id === cls._id ? '2px solid #F57C00' : '', cursor: 'pointer' }}
                                onClick={() => setEditingClass(cls)}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{cls.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{cls.course?.name || 'Sem curso'}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button className="btn-icon-edit" onClick={(e) => { e.stopPropagation(); setEditingClass(cls); }}><Edit2 size={16} /></button>
                                    <button className="btn-icon-delete" onClick={(e) => { e.stopPropagation(); handleDelete('classes', cls._id); }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SettingsColumn>

                {/* LABORATORIOS */}
                <SettingsColumn title="Laboratórios" count={`${labs.length} laboratórios`} icon={<Monitor size={20} color="#455A64" />} iconBg="#ECEFF1">
                    <div style={{ padding: '0 15px 15px 15px' }}>
                        <LabForm
                            initialData={editingLab}
                            onSubmit={(data) => handleCreateOrUpdate('labs', data, editingLab?._id)}
                            onCancel={() => setEditingLab(null)}
                        />
                    </div>
                    <div className="settings-scroll">
                        {labs.map(lab => (
                            <div
                                key={lab._id}
                                className="card-item"
                                style={{ border: editingLab?._id === lab._id ? '2px solid #455A64' : '', cursor: 'pointer' }}
                                onClick={() => setEditingLab(lab)}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{lab.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{lab.capacity}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button className="btn-icon-edit" onClick={(e) => { e.stopPropagation(); setEditingLab(lab); }}><Edit2 size={16} /></button>
                                    <button className="btn-icon-delete" onClick={(e) => { e.stopPropagation(); handleDelete('labs', lab._id); }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SettingsColumn>
            </div>

            <style>{`
                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
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
                    padding: 0 15px 15px 15px;
                    display: flex; 
                    flex-direction: column; 
                    gap: 12px;
                }
                .card-item { background: white; border: 1px solid #EEE; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.02); transition: all 0.2s; }
                .card-item:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-color: #DDD; }
                .card-item.selected { background: #F3E5F5; }
                .btn-icon-delete { color: #EF5350; opacity: 0.7; border-radius: 4px; padding: 4px; transition: all 0.2s; cursor: pointer; background: none; border: none; }
                .btn-icon-delete:hover { opacity: 1; background: #FFEBEE; }
                .btn-icon-edit { color: #004587; opacity: 0.7; border-radius: 4px; padding: 4px; transition: all 0.2s; cursor: pointer; background: none; border: none; }
                .btn-icon-edit:hover { opacity: 1; background: #E3F2FD; }

                /* Mobile/Tablet Responsiveness */
                @media (max-width: 1400px) {
                    .settings-grid {
                        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                        height: auto;
                    }
                    .settings-column {
                        height: 600px; /* Fixed height for columns when wrapped to maintain scroll */
                    }
                    /* On very small screens, let it flow naturally? No, sticky headers are nice. Keeping fixed height. */
                }
                @media (max-width: 768px) {
                     .settings-grid {
                        grid-template-columns: 1fr;
                    }
                    .settings-column {
                        height: 500px;
                    }
                }
            `}</style>
        </div>
    );
}

function SettingsColumn({ title, count, icon, iconBg, children }) {
    return (
        <div className="settings-column">
            <div style={{ padding: '20px', borderBottom: '1px solid #fafafa', display: 'flex', alignItems: 'center', gap: '12px', background: 'white' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: iconBg }}>{icon}</div>
                <div>
                    <h3 style={{ fontSize: '1rem', color: '#333', margin: 0 }}>{title}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{count}</span>
                </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: '15px' }}>
                {children}
            </div>
        </div>
    );
}

