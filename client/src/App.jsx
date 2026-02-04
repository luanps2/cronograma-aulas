import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Upload, Settings, Plus, BookOpen, Users, Monitor, GraduationCap, ChevronLeft, ChevronRight, List as ListIcon, LayoutGrid } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';
import ImportModal from './components/ImportModal';
import NewLessonModal from './components/NewLessonModal';
import QuickAddModal from './components/QuickAddModal';
import SettingsView from './components/SettingsView';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import ConfirmModal from './components/ConfirmModal';

const initAuthHelper = (token, storedUser) => {
    if (token && storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.id) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                return { isAuthenticated: true, user: parsedUser };
            }
        } catch (e) {
            console.error('Auth initialization error:', e);
        }
    }
    delete axios.defaults.headers.common['Authorization'];
    return { isAuthenticated: false, user: null };
};

function App() {
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    // Initialize Auth State on Mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const authState = initAuthHelper(token, storedUser);

        setIsAuthenticated(authState.isAuthenticated);
        setUser(authState.user);
        setIsAuthLoading(false);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
        setUser(null);
        setCurrentView('calendar');
    };

    // Axios Interceptor for 401/403 (Global)
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    handleLogout();
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
    const [lessons, setLessons] = useState([]);
    const [courses, setCourses] = useState([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddType, setQuickAddType] = useState('courses');
    const [selectedDateForModal, setSelectedDateForModal] = useState(new Date());
    const [currentView, setCurrentView] = useState('calendar');
    const [calendarViewMode, setCalendarViewMode] = useState('grid');
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null });

    // Fetch lessons (Effect)
    useEffect(() => {
        if (isAuthenticated) {
            fetchLessons();
            fetchCourses();
        }
    }, [currentDate, isAuthenticated]);

    // Loading State
    if (isAuthLoading) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' }}>
                <div className="animate-spin" style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #E3F2FD',
                    borderTop: '4px solid #0277BD',
                    borderRadius: '50%',
                    marginBottom: '16px'
                }}></div>
                <div style={{ color: '#0277BD', fontWeight: 600 }}>Carregando aplicação...</div>
                <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .animate-spin { animation: spin 1s linear infinite; }
                `}</style>
            </div>
        );
    }

    // Defensive: Invalid State (Auth but no User)
    if (isAuthenticated && !user) {
        handleLogout();
        return null; // Will trigger re-render
    }

    // Login State
    if (!isAuthenticated) {
        return <LoginPage onLogin={(userData, token) => {
            const authToken = token || localStorage.getItem('token');
            if (authToken) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
                // Double check it's saved (LoginPage does it, but safety first)
                if (token) localStorage.setItem('token', token);
            }

            setIsAuthenticated(true);
            setUser(userData);
            setCurrentView('calendar'); // Ensure safe view state
            localStorage.setItem('user', JSON.stringify(userData));
        }} />;
    }

    const handleDateClick = (date) => {
        setSelectedDateForModal(date);
        setSelectedLesson(null);
        setIsNewLessonModalOpen(true);
    };

    const handleNewLesson = () => {
        setSelectedDateForModal(new Date());
        setSelectedLesson(null);
        setIsNewLessonModalOpen(true);
    };

    const handleLessonSelect = (lesson, e) => {
        e.stopPropagation(); // Prevent triggering date click
        setSelectedLesson(lesson);
        // Ensure date is set correct for the modal visually
        setSelectedDateForModal(new Date(lesson.date));
        setIsNewLessonModalOpen(true);
    }

    const openQuickAdd = async (type) => {
        setQuickAddType(type);
        if (type === 'classes' || type === 'ucs') {
            await fetchCourses();
        }
        setIsQuickAddOpen(true);
    };

    const fetchLessons = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/lessons');
            const formattedLessons = response.data
                .filter(l => l.date && !isNaN(new Date(l.date).getTime()))
                .map(lesson => {
                    // Fix: Parse 'YYYY-MM-DD' as local date to prevent timezone shift (UTC -> Local)
                    let dateObj;
                    if (typeof lesson.date === 'string' && lesson.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const [year, month, day] = lesson.date.split('-').map(Number);
                        dateObj = new Date(year, month - 1, day);
                    } else {
                        dateObj = new Date(lesson.date);
                    }
                    return { ...lesson, date: dateObj };
                });
            setLessons(formattedLessons);
        } catch (error) {
            console.error('Error fetching lessons:', error);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/settings/courses');
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const handleSaveQuickAdd = async (type, payload) => {
        try {
            await axios.post(`http://localhost:5000/api/settings/${type}`, payload);
            setIsQuickAddOpen(false);
            setConfirmModal({
                isOpen: true,
                type: 'success',
                title: 'Sucesso',
                message: 'Item adicionado com sucesso!',
                confirmText: 'OK'
            });
        } catch (error) {
            const message = error.response?.data?.error || 'Erro ao salvar item';
            setConfirmModal({
                isOpen: true,
                type: 'error',
                title: 'Erro',
                message: message,
                confirmText: 'OK'
            });
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <Layout user={user} onLogout={handleLogout} onNavigateHome={() => setCurrentView('calendar')}>

            {currentView === 'settings' ? (
                <SettingsView onBack={() => setCurrentView('calendar')} />
            ) : (
                <>
                    {/* Action Bar (Sub-header) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
                        <button className="btn-outline" onClick={() => setIsImportModalOpen(true)}>
                            <Upload size={18} /> <span className="hide-mobile">Importar</span>
                        </button>
                        <button className="btn-outline" onClick={() => setCurrentView('settings')}>
                            <Settings size={18} /> <span className="hide-mobile">Configurações</span>
                        </button>
                        <button className="btn-primary" onClick={handleNewLesson}>
                            <Plus size={18} /> <span className="hide-mobile">Nova Aula</span>
                        </button>
                    </div>

                    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e0e0e0', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>Filtrar por:</span>
                        <select style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '150px' }}><option>Todas as turmas</option></select>
                        <select style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '150px' }}><option>Todas as UCs</option></select>

                        <div style={{ flex: 1 }}></div>

                        <div style={{ display: 'flex', gap: '0', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                            <button
                                onClick={() => setCalendarViewMode('grid')}
                                style={{ padding: '8px 12px', background: calendarViewMode === 'grid' ? '#E3F2FD' : 'white', color: calendarViewMode === 'grid' ? '#004587' : '#666' }}>
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setCalendarViewMode('list')}
                                style={{ padding: '8px 12px', background: calendarViewMode === 'list' ? '#E3F2FD' : 'white', color: calendarViewMode === 'list' ? '#004587' : '#666', borderLeft: '1px solid #ddd' }}>
                                <ListIcon size={18} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <ShortcutCard icon={<GraduationCap color="#5E35B1" size={24} />} label="Curso" color="#EDE7F6" onClick={() => openQuickAdd('courses')} />
                        <ShortcutCard icon={<Users color="#3949AB" size={24} />} label="Turma" color="#E8EAF6" onClick={() => openQuickAdd('classes')} />
                        <ShortcutCard icon={<BookOpen color="#00897B" size={24} />} label="UC" color="#E0F2F1" onClick={() => openQuickAdd('ucs')} />
                        <ShortcutCard icon={<Monitor color="#0277BD" size={24} />} label="Lab" color="#E1F5FE" onClick={() => openQuickAdd('labs')} />
                    </div>

                    <div style={{ background: 'white', borderRadius: '12px 12px 0 0', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e0e0e0', borderBottom: 'none' }}>
                        <button className="btn-outline" onClick={prevMonth} style={{ width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}><ChevronLeft /></button>
                        <h2 style={{ fontSize: '1.5rem', textTransform: 'capitalize' }}>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                        <button className="btn-outline" onClick={nextMonth} style={{ width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}><ChevronRight /></button>
                    </div>

                    {calendarViewMode === 'grid' ? (
                        <div className="calendar-grid">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                <div key={day} className="calendar-day-header">{day}</div>
                            ))}

                            {calendarDays.map((dayItem, idx) => {
                                const isCurrentMonth = isSameMonth(dayItem, monthStart);
                                const dayLessons = lessons.filter(l => isSameDay(l.date, dayItem));

                                return (
                                    <div
                                        key={idx}
                                        className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''}`}
                                        onClick={() => handleDateClick(dayItem)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span className="day-number">{format(dayItem, 'd')}</span>
                                        <div className="day-events">
                                            {dayLessons.map((lesson, lIdx) => (
                                                <LessonCard key={lIdx} lesson={lesson} onClick={(e) => handleLessonSelect(lesson, e)} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ border: '1px solid #e0e0e0', borderTop: 'none', background: 'white', borderRadius: '0 0 12px 12px' }}>
                            {calendarDays.filter(d => isSameMonth(d, monthStart)).map((dayItem, idx) => {
                                const dayLessons = lessons.filter(l => isSameDay(l.date, dayItem));
                                if (dayLessons.length === 0) return null;
                                return (
                                    <div key={idx} style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', gap: '20px', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
                                        <div style={{ minWidth: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#004587' }}>{format(dayItem, 'd')}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase' }}>{format(dayItem, 'EEE', { locale: ptBR })}</div>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {dayLessons.map((lesson, lIdx) => (
                                                <LessonCard key={lIdx} lesson={lesson} horizontal onClick={(e) => handleLessonSelect(lesson, e)} />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                            {lessons.filter(l => isSameMonth(l.date, monthStart)).length === 0 && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Nenhuma aula agendada para este mês.</div>
                            )}
                        </div>
                    )}
                </>
            )}

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportSuccess={fetchLessons}
            />
            <NewLessonModal
                isOpen={isNewLessonModalOpen}
                initialDate={selectedDateForModal}
                lesson={selectedLesson}
                onClose={() => setIsNewLessonModalOpen(false)}
                onSave={() => {
                    setIsNewLessonModalOpen(false);
                    fetchLessons();
                }}
            />
            <QuickAddModal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                type={quickAddType}
                data={{ courses }}
                onSave={handleSaveQuickAdd}
            />
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText || 'Confirmar'}
                onConfirm={confirmModal.onConfirm}
            />
        </Layout>
    )
}


function LessonCard({ lesson, horizontal, onClick }) {
    if (horizontal) {
        return (
            <div
                onClick={onClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    backgroundColor: lesson.period === 'Tarde' ? '#E3F2FD' : '#F3E5F5',
                    borderLeft: `4px solid ${lesson.period === 'Tarde' ? '#2196F3' : '#9C27B0'}`,
                    flexWrap: 'wrap',
                    cursor: 'pointer'
                }}>
                <div style={{ width: '60px', fontWeight: '600' }}>{lesson.period}</div>
                <div style={{ width: '80px', fontWeight: 'bold' }}>{lesson.turma}</div>
                <div style={{ flex: 1, minWidth: '120px' }}>{lesson.uc}</div>
                <div style={{ fontWeight: '600', color: '#555' }}>{lesson.lab}</div>
                {lesson.description && <div style={{ fontSize: '0.85rem', color: '#666', width: '100%', marginTop: '5px' }}>{lesson.description}</div>}
            </div>
        )
    }

    return (
        <div
            onClick={onClick}
            className={`event-card ${lesson.period === 'Tarde' ? 'event-blue' : 'event-purple'}`}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                {lesson.period === 'Noite' ? <span style={{ fontSize: '0.8rem' }}>🌙</span> : <span style={{ fontSize: '0.8rem' }}>☀️</span>}
                <strong style={{ fontSize: '0.75rem' }}>{lesson.period}</strong>
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '1px' }}>{lesson.turma}</div>
            <div style={{ fontSize: '0.75rem', marginBottom: '4px' }}>{lesson.uc}</div>
            <div style={{ textAlign: 'right', fontSize: '0.7rem', opacity: 0.8, fontWeight: '600' }}>{lesson.lab}</div>
        </div>
    )
}

function ShortcutCard({ icon, label, color, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{ padding: '12px', borderRadius: '12px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
            <span style={{ fontWeight: 600, fontSize: '1.2rem', color: '#333' }}>{label}</span>
        </div>
    )
}

export default App
