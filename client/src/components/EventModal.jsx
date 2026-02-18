import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const EVENT_TYPES = [
    { value: 'reuniao', label: 'Reunião', color: '#2196F3' }, // Azul
    { value: 'parada', label: 'Parada Pedagógica', color: '#FF9800' }, // Laranja
    { value: 'suspensao', label: 'Suspensão de Aula', color: '#F44336' }, // Vermelho
    { value: 'evento', label: 'Evento Escolar', color: '#4CAF50' }, // Verde
    { value: 'outro', label: 'Outro', color: '#9E9E9E' } // Cinza
];

const EventModal = ({ isOpen, onClose, date, eventToEdit, onSaveSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'reuniao',
        color: '#2196F3',
        period: 'integral'
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (eventToEdit) {
                setFormData({
                    title: eventToEdit.title,
                    description: eventToEdit.description || '',
                    type: eventToEdit.type,
                    color: eventToEdit.color,
                    period: eventToEdit.period || 'integral'
                });
            } else {
                setFormData({
                    title: '',
                    description: '',
                    type: 'reuniao',
                    color: '#2196F3', // Default blue
                    period: 'integral'
                });
            }
        }
    }, [isOpen, eventToEdit]);

    const handleTypeChange = (e) => {
        const selectedType = EVENT_TYPES.find(t => t.value === e.target.value);
        setFormData(prev => ({
            ...prev,
            type: e.target.value,
            color: selectedType ? selectedType.color : prev.color
        }));
    };

    const confirmDelete = async () => {
        if (!eventToEdit) return;
        if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;

        setIsLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/api/events/${eventToEdit.id}`);
            onSaveSuccess();
            onClose();
        } catch (error) {
            alert('Erro ao excluir evento: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            ...formData,
            date: date // Current date context or event date
        };

        try {
            if (eventToEdit) {
                await axios.put(`${API_BASE_URL}/api/events/${eventToEdit.id}`, payload);
            } else {
                await axios.post(`${API_BASE_URL}/api/events`, payload);
            }
            onSaveSuccess();
            onClose();
        } catch (error) {
            alert('Erro ao salvar evento: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="modal" style={{
                background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px',
                width: '100%', maxWidth: '400px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
                    {eventToEdit ? 'Editar Evento' : 'Novo Evento'}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Título</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Tipo</label>
                        <select
                            value={formData.type}
                            onChange={handleTypeChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                        >
                            {EVENT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Período</label>
                            <select
                                value={formData.period}
                                onChange={e => setFormData({ ...formData, period: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            >
                                <option value="integral">Dia Inteiro</option>
                                <option value="manha">Manhã</option>
                                <option value="tarde">Tarde</option>
                                <option value="noite">Noite</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Cor</label>
                            <input
                                type="color"
                                value={formData.color}
                                onChange={e => setFormData({ ...formData, color: e.target.value })}
                                style={{ height: '42px', width: '60px', padding: 0, border: 'none', background: 'none' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Descrição (Opcional)</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        {eventToEdit && (
                            <button
                                type="button"
                                onClick={confirmDelete}
                                style={{ background: '#FFEBEE', color: '#D32F2F', border: 'none', padding: '10px 15px', borderRadius: '6px' }}
                            >
                                Excluir
                            </button>
                        )}
                        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: '6px' }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary"
                                style={{ padding: '10px 20px', borderRadius: '6px' }}
                            >
                                {isLoading ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
