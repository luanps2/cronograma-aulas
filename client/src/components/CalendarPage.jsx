import React, { useState, useEffect, useRef } from 'react';
import { Upload, Settings, BookOpen, Users, Monitor, GraduationCap, ChevronLeft, ChevronRight, List as ListIcon, LayoutGrid, GripVertical, CalendarDays } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
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
    const [events, setEvents] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetchLessons();
        fetchCourses();
        fetchEvents();
        fetchFilterOptions();
    }, [currentDate]);

    // Generate holidays when currentDate changes (year context)
    useEffect(() => {
        import('../utils/holidays').then(({ getHolidays }) => {
            setHolidays(getHolidays(currentDate.getFullYear()));
        });
    }, [currentDate.getFullYear()]);

    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/events`);
            const formattedEvents = response.data.map(event => {
                // TIMEZONE FIX: Always parse YYYY-MM-DD as local date
                const dateStr = typeof event.date === 'string' ? event.date.split('T')[0] : event.date;
                const parts = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (!parts) return null;
                const dateObj = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
                return { ...event, date: dateObj };
            }).filter(Boolean);
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleDateClick = (date) => {
        // If in "moving" mode, move the lesson to the clicked date
        if (movingLesson) {
            handleMoveLesson(movingLesson, date);
            setMovingLesson(null);
            return;
        }
        setSelectedDateForModal(date);

        // Custom Logic: If date has events, maybe show list? 
        // For now, we open a small menu or just default to New Modal.
        // The user asked for an option: "Create Lesson" OR "Create Event"
        // We will implement a simple choice modal or rely on the UI to provide buttons.
        // Let's modify this to open a choice or just defaulting to LessonModal but adding an "Add Event" button there?
        // User request: "Ao clicar em uma data: Criar Aula / Criar Evento"
        // Let's inject a specialized small modal or use the context menu approach.
        // For simplicity and mobile-friendliness, let's open a "Day Action Modal" or simply add a toggle in the UI.
        // Actually, let's use a state `isDateMenuOpen` to show options.
        setDateMenu({ isOpen: true, date });
    };

    const [dateMenu, setDateMenu] = useState({ isOpen: false, date: null });

    const handleEventSelect = (event, e) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setSelectedDateForModal(event.date);
        setIsEventModalOpen(true);
    };

    const handleLessonSelect = (lesson, e) => {
        e.stopPropagation();
        if (movingLesson) {
            setMovingLesson(null);
            return;
        }
        setSelectedLesson(lesson);
        // TIMEZONE FIX: extract YYYY-MM-DD string, parse locally
        const dateStr = typeof lesson.date === 'string' ? lesson.date.split('T')[0] : `${lesson.date.getFullYear()}-${String(lesson.date.getMonth() + 1).padStart(2, '0')}-${String(lesson.date.getDate()).padStart(2, '0')}`;
        const [y, m, d] = dateStr.split('-').map(Number);
        setSelectedDateForModal(new Date(y, m - 1, d));
        setIsNewLessonModalOpen(true);
    }

    // ========== DRAG AND DROP ==========
    const handleDragStart = (e, lesson) => {
        setDraggedLesson(lesson);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ id: lesson.id }));
        // Add visual feedback
        if (e.currentTarget) {
            setTimeout(() => {
                e.currentTarget.style.opacity = '0.5';
            }, 0);
        }
    };

    const handleDragEnd = (e) => {
        setDraggedLesson(null);
        setDragOverDate(null);
        if (e.currentTarget) {
            e.currentTarget.style.opacity = '1';
        }
    };

    const handleDragOver = (e, dayItem) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverDate(dayItem);
    };

    const handleDragLeave = () => {
        setDragOverDate(null);
    };

    const handleDrop = async (e, targetDate) => {
        e.preventDefault();
        setDragOverDate(null);

        if (!draggedLesson) return;

        // Don't do anything if same date
        if (isSameDay(draggedLesson.date, targetDate)) {
            setDraggedLesson(null);
            return;
        }

        await handleMoveLesson(draggedLesson, targetDate);
        setDraggedLesson(null);
    };

    const handleMoveLesson = async (lesson, targetDate) => {
        try {
            const payload = {
                courseId: parseInt(lesson.courseId),
                ucId: parseInt(lesson.ucId),
                turma: lesson.turma,
                lab: lesson.lab,
                period: lesson.period,
                description: lesson.description || '',
                // TIMEZONE FIX: Send date as YYYY-MM-DD string, never toISOString()
                date: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`
            };

            await axios.put(`${API_BASE_URL}/api/lessons/${lesson.id}`, payload);

            // Update local state immediately
            setLessons(prev => prev.map(l =>
                l.id === lesson.id ? { ...l, date: targetDate } : l
            ));

            // Dispatch event for other components
            window.dispatchEvent(new Event('lessons-updated'));
        } catch (err) {
            console.error('Error moving lesson:', err);
            alert('Erro ao mover aula: ' + (err.response?.data?.error || err.message));
        }
    };

    // Mobile: long press to trigger move
    const handleLongPress = (lesson, e) => {
        e.stopPropagation();
        setMovingLesson(lesson);
    };
    // ========== END DRAG AND DROP ==========

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
                .filter(l => l.date)
                .map(lesson => {
                    // TIMEZONE FIX: Always parse YYYY-MM-DD as local date
                    const dateStr = typeof lesson.date === 'string' ? lesson.date.split('T')[0] : lesson.date;
                    const parts = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if (!parts) return null;
                    const dateObj = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
                    return { ...lesson, date: dateObj };
                })
                .filter(Boolean);
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
            fetchLessons();
            fetchCourses();
        };

        window.addEventListener('lessons-updated', handleUpdates);
        return () => window.removeEventListener('lessons-updated', handleUpdates);
    }, []);

    return (
        <>
            <div className="calendar-page-container">
                {/* Moving mode banner */}
                {movingLesson && (
                    <div style={{
                        background: '#FFF3E0',
                        border: '2px solid #FF9800',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        marginBottom: '10px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E65100' }}>
                            <CalendarDays size={18} />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                Movendo: <strong>{movingLesson.turma}</strong> — Clique na data de destino
                            </span>
                        </div>
                        <button
                            onClick={() => setMovingLesson(null)}
                            className="btn-outline"
                            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                {/* Filters Section */}
                <div className="filters-section" style={{ background: 'var(--bg-primary)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: 500 }}>Filtrar por:</span>
                    <select value={filters.turma} onChange={(e) => setFilters(prev => ({ ...prev, turma: e.target.value }))} style={{ padding: '8px 12px', borderRadius: '6px', minWidth: '150px' }}>
                        <option value="">Todas as turmas</option>
                        {allClasses.map(cls => <option key={cls.id || cls._id} value={cls.name}>{cls.name}</option>)}
                    </select>
                    <select value={filters.ucId} onChange={(e) => setFilters(prev => ({ ...prev, ucId: e.target.value }))} style={{ padding: '8px 12px', borderRadius: '6px', minWidth: '150px' }}>
                        <option value="">Todas as UCs</option>
                        {allUCs.map(uc => <option key={uc.id} value={uc.id}>{uc.name}</option>)}
                    </select>

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

                {/* Calendar Section */}
                <div className="calendar-section">
                    <div style={{ background: 'var(--bg-primary)', borderRadius: '12px 12px 0 0', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)', borderBottom: 'none' }}>
                        <button className="btn-outline" onClick={prevMonth} style={{ width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}><ChevronLeft /></button>
                        <h2 style={{ fontSize: '1.5rem', textTransform: 'capitalize' }}>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                        <button className="btn-outline" onClick={nextMonth} style={{ width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}><ChevronRight /></button>
                    </div>

                    {
                        {
                            calendarViewMode === 'grid' ? (
                            <div className="calendar-grid">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                    <div key={day} className="calendar-day-header">{day}</div>
                                ))}

                                {calendarDays.map((dayItem, idx) => {
                                    const isCurrentMonth = isSameMonth(dayItem, monthStart);

                                    // Filter Lessons
                                    let dayLessons = lessons.filter(l => isSameDay(l.date, dayItem));
                                    if (filters.turma) {
                                        dayLessons = dayLessons.filter(l => l.turma === filters.turma);
                                    }
                                    if (filters.ucId) {
                                        dayLessons = dayLessons.filter(l => String(l.ucId) === String(filters.ucId));
                                    }

                                    // Filter Events
                                    const dayEvents = events.filter(e => isSameDay(e.date, dayItem));

                                    // Filter Holidays
                                    // Holiday dates are strings "YYYY-MM-DD", need to compare carefully
                                    const formattedDay = format(dayItem, 'yyyy-MM-dd');
                                    const dayHolidays = holidays.filter(h => h.date === formattedDay);

                                    const isTodayDate = isToday(dayItem);
                                    const isDragTarget = dragOverDate && isSameDay(dragOverDate, dayItem);
                                    const isMovingTarget = movingLesson !== null;

                                    return (
                                        <div
                                            key={idx}
                                            className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'calendar-day-today' : ''} ${isDragTarget ? 'calendar-day-drag-over' : ''} ${isMovingTarget ? 'calendar-day-move-target' : ''}`}
                                            onClick={() => handleDateClick(dayItem)}
                                            onDragOver={(e) => handleDragOver(e, dayItem)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, dayItem)}
                                            style={{ cursor: isMovingTarget ? 'crosshair' : 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="day-number">{format(dayItem, 'd')}</span>
                                                {dayHolidays.length > 0 && (
                                                    <span style={{ fontSize: '0.7rem', color: 'red', fontWeight: 'bold', marginRight: '4px' }} title={dayHolidays[0].name}>Feriado</span>
                                                )}
                                            </div>

                                            <div className="day-events">
                                                {/* Holidays */}
                                                {dayHolidays.map((holiday, hIdx) => (
                                                    <div key={`hol-${hIdx}`} style={{
                                                        background: '#FFEBEE', color: '#C62828',
                                                        padding: '4px', borderRadius: '4px', fontSize: '0.75rem',
                                                        border: '1px solid #FFCDD2', fontWeight: 500
                                                    }}>
                                                        🎉 {holiday.name}
                                                    </div>
                                                ))}

                                                {/* Custom Events */}
                                                {dayEvents.map((event, eIdx) => (
                                                    <div key={`evt-${eIdx}`}
                                                        onClick={(e) => handleEventSelect(event, e)}
                                                        style={{
                                                            background: event.color || '#E3F2FD',
                                                            color: '#1565C0',
                                                            padding: '4px', borderRadius: '4px', fontSize: '0.75rem',
                                                            borderLeft: `3px solid ${event.color ? '#1976D2' : '#2196F3'}`,
                                                            cursor: 'pointer',
                                                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                                                        }}>
                                                        <span style={{ fontWeight: 'bold' }}>{event.title}</span>
                                                    </div>
                                                ))}

                                                {/* Lessons */}
                                                {dayLessons.map((lesson, lIdx) => (
                                                    <LessonCard
                                                        key={`less-${lIdx}`}
                                                        lesson={lesson}
                                                        onClick={(e) => handleLessonSelect(lesson, e)}
                                                        onDragStart={(e) => handleDragStart(e, lesson)}
                                                        onDragEnd={handleDragEnd}
                                                        onLongPress={(e) => handleLongPress(lesson, e)}
                                                        isBeingDragged={draggedLesson && draggedLesson.id === lesson.id}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ border: '1px solid var(--border-color)', borderTop: 'none', background: 'var(--bg-primary)', borderRadius: '0 0 12px 12px' }}>
                                {calendarDays.filter(d => isSameMonth(d, monthStart)).map((dayItem, idx) => {
                                    // Helper filters
                                    let dayLessons = lessons.filter(l => isSameDay(l.date, dayItem));
                                    if (filters.turma) dayLessons = dayLessons.filter(l => l.turma === filters.turma);
                                    if (filters.ucId) dayLessons = dayLessons.filter(l => String(l.ucId) === String(filters.ucId));

                                    const dayEvents = events.filter(e => isSameDay(e.date, dayItem));
                                    const formattedDay = format(dayItem, 'yyyy-MM-dd');
                                    const dayHolidays = holidays.filter(h => h.date === formattedDay);

                                    if (dayLessons.length === 0 && dayEvents.length === 0 && dayHolidays.length === 0) return null;

                                    return (
                                        <div key={idx} className="list-view-day">
                                            <div style={{ minWidth: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{format(dayItem, 'd')}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{format(dayItem, 'EEE', { locale: ptBR })}</div>
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {/* Holidays List */}
                                                {dayHolidays.map((h, i) => (
                                                    <div key={i} style={{ padding: '10px', background: '#FFEBEE', color: '#C62828', borderRadius: '8px', border: '1px solid #FFCDD2' }}>
                                                        🎉 <strong>Feriado:</strong> {h.name}
                                                    </div>
                                                ))}
                                                {/* Events List */}
                                                {dayEvents.map((e, i) => (
                                                    <div key={i} onClick={(evt) => handleEventSelect(e, evt)} style={{
                                                        padding: '10px', background: e.color || '#E3F2FD', borderRadius: '8px', cursor: 'pointer',
                                                        borderLeft: `4px solid ${e.color ? '#1565C0' : '#2196F3'}`
                                                    }}>
                                                        <strong>{e.title}</strong> - {e.description}
                                                    </div>
                                                ))}
                                                {/* Lessons List */}
                                                {dayLessons.map((lesson, lIdx) => (
                                                    <LessonCard key={lIdx} lesson={lesson} horizontal onClick={(e) => handleLessonSelect(lesson, e)} />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                                {lessons.filter(l => isSameMonth(l.date, monthStart)).length === 0 && events.filter(e => isSameMonth(e.date, monthStart)).length === 0 && holidays.filter(h => h.date.startsWith(format(monthStart, 'yyyy-MM'))).length === 0 && (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Nenhuma atividade agendada para este mês.</div>
                                )}
                            </div>
                        )
                    }
                    }
                </div>

                {/* Shortcut Cards */}
                <div className="shortcuts-section">
                    <ShortcutCard icon={<GraduationCap color="#5E35B1" size={20} />} label="Curso" color="#EDE7F6" onClick={() => openQuickAdd('courses')} />
                    <ShortcutCard icon={<Users color="#3949AB" size={20} />} label="Turma" color="#E8EAF6" onClick={() => openQuickAdd('classes')} />
                    <ShortcutCard icon={<BookOpen color="#00897B" size={20} />} label="UC" color="#E0F2F1" onClick={() => openQuickAdd('ucs')} />
                    <ShortcutCard icon={<Monitor color="#0277BD" size={20} />} label="Lab" color="#E1F5FE" onClick={() => openQuickAdd('labs')} />
                </div>
            </div>

            import EventModal from './EventModal';

            // ... (existing imports)

            // (Inside CalendarPage function)
            // ...

            return (
            <>
                {/* Date Action Menu (Simple Overlay) */}
                {dateMenu.isOpen && (
                    <div className="modal-overlay" onClick={() => setDateMenu({ isOpen: false, date: null })} style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.4)', zIndex: 1200,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{
                            background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px',
                            minWidth: '300px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
                                {dateMenu.date && format(dateMenu.date, "d 'de' MMMM", { locale: ptBR })}
                            </h3>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                <button className="btn-primary" onClick={() => {
                                    setDateMenu({ isOpen: false, date: null });
                                    setSelectedDateForModal(dateMenu.date);
                                    setSelectedLesson(null);
                                    setIsNewLessonModalOpen(true);
                                }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}>
                                    <BookOpen size={20} /> Nova Aula
                                </button>
                                <button className="btn-outline" onClick={() => {
                                    setDateMenu({ isOpen: false, date: null });
                                    setSelectedDateForModal(dateMenu.date);
                                    setSelectedEvent(null);
                                    setIsEventModalOpen(true);
                                }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#E3F2FD', color: '#1565C0', border: 'none' }}>
                                    <CalendarDays size={20} /> Novo Evento
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="calendar-page-container">
                    {/* ... (existing content) ... */}
                </div>

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
                <EventModal
                    isOpen={isEventModalOpen}
                    date={selectedDateForModal}
                    eventToEdit={selectedEvent}
                    onClose={() => setIsEventModalOpen(false)}
                    onSaveSuccess={() => {
                        fetchEvents(); // Refresh events
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
                    onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    type={confirmModal.type}
                    confirmText={confirmModal.confirmText || 'Confirmar'}
                    onConfirm={confirmModal.onConfirm}
                />

                <style>{`
                .calendar-page-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .filters-section { order: 1; }
                .calendar-section { order: 2; }

                .shortcuts-section {
                    order: 3;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                }

                /* Calendar Grid */
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    border: 1px solid var(--border-color);
                    border-top: none;
                    background: var(--bg-primary);
                    border-radius: 0 0 12px 12px;
                    overflow: hidden;
                }

                .calendar-day {
                    min-height: 120px;
                    padding: 8px;
                    border-right: 1px solid var(--border-color);
                    border-bottom: 1px solid var(--border-color);
                    position: relative;
                    overflow-y: auto;
                    transition: background-color 0.15s;
                }

                .calendar-day:nth-child(7n) { border-right: none; }

                .calendar-day-header {
                    font-weight: 600;
                    text-align: center;
                    padding: 12px;
                    background: var(--bg-secondary);
                    border-right: 1px solid var(--border-color);
                    border-bottom: 1px solid var(--border-color);
                    color: var(--text-primary);
                }

                .calendar-day-header:nth-child(7n) { border-right: none; }

                .calendar-day-today {
                    background: #E3F2FD !important;
                    border: 2px solid #2196F3 !important;
                }

                /* Drag & Drop target highlight */
                .calendar-day-drag-over {
                    background: rgba(33, 150, 243, 0.15) !important;
                    outline: 2px dashed #2196F3 !important;
                    outline-offset: -2px;
                }

                .calendar-day-move-target:hover {
                    background: rgba(255, 152, 0, 0.1) !important;
                    outline: 2px dashed #FF9800 !important;
                    outline-offset: -2px;
                }

                .day-number {
                    font-weight: 600;
                    font-size: 0.95rem;
                    display: inline-block;
                    min-width: 24px;
                    text-align: center;
                }

                .day-events {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    margin-top: 6px;
                }

                .list-view-day {
                    padding: 15px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    gap: 20px;
                }

                /* Drag handle for lesson cards */
                .lesson-drag-handle {
                    cursor: grab;
                    opacity: 0.4;
                    transition: opacity 0.2s;
                }

                .event-card:hover .lesson-drag-handle {
                    opacity: 1;
                }

                .event-card[draggable="true"] {
                    cursor: grab;
                }

                .event-card[draggable="true"]:active {
                    cursor: grabbing;
                }

                /* Mobile move button */
                .move-btn {
                    background: none;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-size: 0.65rem;
                    cursor: pointer;
                    color: var(--text-tertiary);
                    display: none;
                }

                /* Mobile Responsive */
                @media (max-width: 640px) {
                    .calendar-section { order: 2; }

                    .shortcuts-section {
                        order: 3;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                        margin-bottom: 20px;
                    }

                    .calendar-day {
                        min-height: 90px;
                        padding: 4px;
                        overflow-y: auto;
                        overflow-x: hidden;
                    }

                    .day-number {
                        font-size: 0.8rem;
                    }

                    .event-card {
                        padding: 4px !important;
                        font-size: 0.7rem !important;
                    }

                    .event-card strong {
                        font-size: 0.65rem !important;
                    }

                    .event-card div {
                        line-height: 1.1 !important;
                    }

                    .day-events {
                        gap: 3px;
                    }

                    .move-btn {
                        display: inline-block;
                    }

                    .list-view-day {
                        flex-direction: column;
                        gap: 10px;
                    }
                }

                /* Desktop order */
                @media (min-width: 641px) {
                    .shortcuts-section { order: 2; }
                    .calendar-section { order: 3; }
                }
            `}</style>
            </>
            )
            {/* ... */}
        </>
    );
}

function LessonCard({ lesson, horizontal, onClick, onDragStart, onDragEnd, onLongPress, isBeingDragged }) {
    const longPressTimeout = useRef(null);

    const handleTouchStart = (e) => {
        longPressTimeout.current = setTimeout(() => {
            if (onLongPress) onLongPress(e);
        }, 600);
    };

    const handleTouchEnd = () => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
        }
    };

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
                <div style={{ flex: 1, minWidth: '150px', fontWeight: '500', color: 'var(--text-secondary)' }}>{lesson.uc || lesson.ucName || lesson.ucname}</div>
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
            draggable="true"
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
            className={`event-card ${getPeriodClass(lesson.period)}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                padding: '6px',
                borderRadius: '6px',
                minHeight: '80px',
                opacity: isBeingDragged ? 0.4 : 1,
                transition: 'opacity 0.2s'
            }}
        >
            {/* Period */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                {lesson.period === 'Noite' ? <span style={{ fontSize: '0.8rem' }}>🌙</span> : <span style={{ fontSize: '0.8rem' }}>☀️</span>}
                <strong style={{ fontSize: '0.75rem' }}>{lesson.period}</strong>
                <button
                    className="move-btn"
                    onClick={(e) => { e.stopPropagation(); if (onLongPress) onLongPress(e); }}
                    title="Mover aula"
                >
                    ⇄
                </button>
            </div>

            {/* Lab */}
            <div style={{ fontSize: '0.7rem', opacity: 0.9, fontWeight: '600' }}>{lesson.lab}</div>

            {/* Turma */}
            <div style={{ fontWeight: '700', fontSize: '0.85rem', lineHeight: '1.2' }}>{lesson.turma}</div>

            {/* UC */}
            <div style={{ fontSize: '0.75rem', lineHeight: '1.2', margin: '2px 0', fontWeight: '500' }}>{lesson.uc || lesson.ucName || lesson.ucname}</div>

            {/* Description */}
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
            className="shortcut-card"
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

            <style>{`
                @media (max-width: 640px) {
                    .shortcut-card {
                        padding: 12px !important;
                        gap: 8px !important;
                        min-height: 60px;
                    }

                    .shortcut-card > div:first-child {
                        padding: 8px !important;
                    }

                    .shortcut-card span {
                        font-size: 0.9rem !important;
                    }
                }
            `}</style>
        </div>
    )
} whiteSpace: 'nowrap',
    overflow: 'hidden',
        textOverflow: 'ellipsis',
            borderTop: '1px solid var(--border-color)',
                marginTop: '2px',
                    paddingTop: '2px'
                    }}>
    { lesson.description }
                    </div >
                )}
            </div >
            )
}

function ShortcutCard({ icon, label, color, onClick }) {
    return (
        <div
            onClick={onClick}
            className="shortcut-card"
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

            <style>{`
                @media (max-width: 640px) {
                    .shortcut-card {
                        padding: 12px !important;
                        gap: 8px !important;
                        min-height: 60px;
                    }

                    .shortcut-card > div:first-child {
                        padding: 8px !important;
                    }

                    .shortcut-card span {
                        font-size: 0.9rem !important;
                    }
                }
            `}</style>
        </div>
    )
}
