import React, { useState, useEffect } from 'react';
import { Upload, Settings, BookOpen, Users, Monitor, GraduationCap, ChevronLeft, ChevronRight, List as ListIcon, LayoutGrid } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import ImportModal from './ImportModal';
import NewLessonModal from './NewLessonModal';
import QuickAddModal from './QuickAddModal';
import ConfirmModal from './ConfirmModal';
import API_BASE_URL from '../config/api';

export default function CalendarPage({ user, onLogout }) {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
    const [lessons, setLessons] = useState([]);
    const [courses, setCourses] = useState([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddType, setQuickAddType] = useState('courses');
    const [selectedDateForModal, setSelectedDateForModal] = useState(new Date());
    const [calendarViewMode, setCalendarViewMode] = useState('grid');
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null });

    useEffect(() => {
        fetchLessons();
        fetchCourses();
    }, [currentDate]);

    const handleDateClick = (date) => {
        setSelectedDateForModal(date);
        setSelectedLesson(null);
        setIsNewLessonModalOpen(true);
    };

    const handleLessonSelect = (lesson, e) => {
        e.stopPropagation();
        setSelectedLesson(lesson);
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
            const response = await axios.get(`${API_BASE_URL}/api/lessons`);
            const formattedLessons = response.data
                .filter(l => l.date && !isNaN(new Date(l.date).getTime()))
                .map(lesson => {
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
            const response = await axios.get(`${API_BASE_URL}/api/settings/courses`);
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const handleSaveQuickAdd = async (type, payload) => {
        try {
            await axios.post(`${API_BASE_URL}/api/settings/${type}`, payload);
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

    useEffect(() => {
        const handleUpdates = () => {
            console.log('🔄 Refreshing lessons due to global event...');
            fetchLessons();
            fetchCourses();
        };

        window.addEventListener('lessons-updated', handleUpdates);
        return () => window.removeEventListener('lessons-updated', handleUpdates);
    }, []);

    return (
        <>
            <div style={{ background: 'var(--bg-primary)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: 500 }}>Filtrar por:</span>
                <select style={{ padding: '8px 12px', borderRadius: '6px', minWidth: '150px' }}><option>Todas as turmas</option></select>
                <select style={{ padding: '8px 12px', borderRadius: '6px', minWidth: '150px' }}><option>Todas as UCs</option></select>

                <div style={{ flex: 1 }}></div>
                <div style={{ display: 'flex', gap: '0', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                    <button
                        onClick={() => setCalendarViewMode('grid')}
                        style={{ padding: '8px 12px', background: calendarViewMode === 'grid' ? 'var(--bg-secondary)' : 'var(--bg-primary)', color: calendarViewMode === 'grid' ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setCalendarViewMode('list')}
                        style={{ padding: '8px 12px', background: calendarViewMode === 'list' ? 'var(--bg-secondary)' : 'var(--bg-primary)', color: calendarViewMode === 'list' ? 'var(--text-secondary)' : 'var(--text-tertiary)', borderLeft: '1px solid var(--border-color)' }}>
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

            <div style={{ background: 'var(--bg-primary)', borderRadius: '12px 12px 0 0', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)', borderBottom: 'none' }}>
                <button className="btn-outline" onClick={prevMonth} style={{ width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}><ChevronLeft /></button>
                <h2 style={{ fontSize: '1.5rem', textTransform: 'capitalize' }}>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                <button className="btn-outline" onClick={nextMonth} style={{ width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}><ChevronRight /></button>
            </div>

            {
                calendarViewMode === 'grid' ? (
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
                    <div style={{ border: '1px solid var(--border-color)', borderTop: 'none', background: 'var(--bg-primary)', borderRadius: '0 0 12px 12px' }}>
                        {calendarDays.filter(d => isSameMonth(d, monthStart)).map((dayItem, idx) => {
                            const dayLessons = lessons.filter(l => isSameDay(l.date, dayItem));
                            if (dayLessons.length === 0) return null;
                            return (
                                <div key={idx} style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '20px', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
                                    <div style={{ minWidth: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{format(dayItem, 'd')}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{format(dayItem, 'EEE', { locale: ptBR })}</div>
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
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Nenhuma aula agendada para este mês.</div>
                        )}
                    </div>
                )
            }

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
        </>
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
                    gap: '15px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: lesson.period === 'Tarde' ? 'var(--bg-secondary)' : 'var(--bg-tertiary, #F3E5F5)',
                    borderLeft: `4px solid ${lesson.period === 'Tarde' ? '#2196F3' : '#9C27B0'}`,
                    flexWrap: 'wrap',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                <div style={{ width: '60px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{lesson.period}</div>
                <div style={{ width: '80px', fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{lesson.turma}</div>
                <div style={{ flex: 1, minWidth: '150px', fontWeight: '500', color: 'var(--text-secondary)' }}>{lesson.uc}</div>
                <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{lesson.lab}</div>
                {lesson.description && (
                    <div style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-tertiary)',
                        width: '100%',
                        marginTop: '4px',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '4px'
                    }}>
                        {lesson.description}
                    </div>
                )}
            </div>
        )
    }

    const getPeriodClass = (period) => {
        const normalizedPeriod = period?.toLowerCase();
        if (normalizedPeriod === 'manhã' || normalizedPeriod === 'manha') return 'event-morning';
        if (normalizedPeriod === 'tarde') return 'event-afternoon';
        if (normalizedPeriod === 'noite') return 'event-night';
        return 'event-afternoon';
    };

    return (
        <div
            onClick={onClick}
            className={`event-card ${getPeriodClass(lesson.period)}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                padding: '6px',
                borderRadius: '6px',
                minHeight: '80px'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                {lesson.period === 'Noite' ? <span style={{ fontSize: '0.8rem' }}>🌙</span> : <span style={{ fontSize: '0.8rem' }}>☀️</span>}
                <strong style={{ fontSize: '0.75rem' }}>{lesson.period}</strong>
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.85rem', lineHeight: '1.2' }}>{lesson.turma}</div>
            <div style={{ fontSize: '0.75rem', lineHeight: '1.2', margin: '2px 0' }}>{lesson.uc}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.9, fontWeight: '600' }}>{lesson.lab}</div>
            {lesson.description && (
                <div style={{
                    width: '100%',
                    fontSize: '0.7rem',
                    opacity: 0.8,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '2px',
                    paddingTop: '2px'
                }}>
                    {lesson.description}
                </div>
            )}
        </div>
    )
}

function ShortcutCard({ icon, label, color, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                background: 'var(--bg-primary)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                cursor: 'pointer',
                boxShadow: 'var(--card-shadow)',
                transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{ padding: '12px', borderRadius: '12px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
            <span style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{label}</span>
        </div>
    )
}
