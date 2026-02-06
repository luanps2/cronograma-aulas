import React, { useState, useEffect, useCallback } from 'react';
import { Upload, X, Lightbulb, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';
import Modal from './Modal';

export default function ImportModal({ isOpen, onClose, onSuccess }) {
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [importResult, setImportResult] = useState(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setImportResult(null);
            setError(null);
            setLoading(false);
        }
    }, [isOpen]);

    const handleFiles = async (files) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            setError('Por favor, envie apenas arquivos de imagem (PNG, JPEG, WEBP).');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await axios.post('http://localhost:5000/api/upload-excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setImportResult(res.data);
            if (onSuccess) onSuccess(); // Trigger calendar refresh
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.error || 'Falha ao processar a imagem.';
            const details = err.response?.data?.details || [];

            let detailText = '';
            if (details.length > 0) {
                detailText = details.map(d => `${d.error}`).join('\n');
            }

            setError(`${errorMessage}\n${detailText}`);
        } finally {
            setLoading(false);
        }
    };

    // Paste Handler
    useEffect(() => {
        const handlePaste = (e) => {
            if (!isOpen) return;
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    handleFiles([blob]);
                    break;
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen]);

    // Drag & Drop
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        // Fix potential timezone issues by submitting pure YYYY-MM-DD
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('pt-BR');
    };

    const getWeekday = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
        return dayName.charAt(0).toUpperCase() + dayName.slice(1);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="700px">
            <div style={{ padding: '0 24px 24px 24px' }}>

                {/* Header */}
                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#004587', marginBottom: '5px' }}>
                        Importar Planilha
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                        Envie uma imagem da sua planilha Excel para importação automática
                    </p>
                </div>

                {!importResult ? (
                    <>
                        {/* Drag & Drop Zone */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('fileInput').click()}
                            style={{
                                border: `2px dashed ${dragActive ? '#004587' : 'var(--border-color)'}`,
                                borderRadius: '12px',
                                backgroundColor: dragActive ? 'rgba(0, 69, 135, 0.05)' : 'var(--bg-tertiary)',
                                padding: '40px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                minHeight: '200px',
                                marginBottom: '20px'
                            }}
                        >
                            <input
                                id="fileInput"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFiles(e.target.files)}
                            />

                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #E0E0E0', borderTopColor: '#004587', borderRadius: '50%' }}></div>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Processando sua imagem com IA...</span>
                                </div>
                            ) : (
                                <>
                                    <Upload size={48} color="#9E9E9E" style={{ marginBottom: '15px' }} />
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                                        Clique para enviar <span style={{ fontWeight: 400 }}>ou arraste e solte</span>
                                    </h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                        PNG, JPEG ou WEBP (máx. 10MB)
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '8px', padding: '15px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <AlertCircle size={20} color="#D32F2F" style={{ marginTop: '2px' }} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#C62828', fontSize: '0.9rem' }}>Falha na importação</h4>
                                    <pre style={{ margin: 0, color: '#B71C1C', fontSize: '0.8rem', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{error}</pre>
                                </div>
                            </div>
                        )}

                        {/* Tip Box */}
                        <div style={{
                            backgroundColor: '#FFF8E1',
                            border: '1px solid #FFE082',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                <Lightbulb size={20} color="#F57F17" />
                                <span style={{ color: '#F57F17', fontWeight: 700, fontSize: '0.95rem' }}>
                                    Dica: Pressione Ctrl+V para colar uma imagem
                                </span>
                            </div>
                            <span style={{ color: '#666', fontSize: '0.85rem' }}>
                                Tire um print da planilha e cole aqui diretamente!
                            </span>
                        </div>

                        {/* Format Info */}
                        <div style={{ backgroundColor: '#E3F2FD', border: '1px solid #BBDEFB', borderRadius: '8px', padding: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#0D47A1', fontSize: '0.95rem' }}>
                                Formato esperado da planilha:
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#1565C0', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <li>Coluna 1: Data (DD/MM/YYYY)</li>
                                <li>Coluna 2: Dia da semana</li>
                                <li>Coluna 3 (TARDE): Aulas do período da tarde</li>
                                <li>Coluna 4 (NOITE): Aulas do período da noite</li>
                                <li>Células: TURMA – UC – LABORATÓRIO (ex: TI 27 – UC13 – LAB43)</li>
                            </ul>
                        </div>
                    </>
                ) : (
                    /* Success State */
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{
                            backgroundColor: '#E8F5E9',
                            border: '1px solid #C8E6C9',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <CheckCircle size={32} color="#2E7D32" />
                            <div>
                                <h3 style={{ margin: 0, color: '#2E7D32', fontSize: '1.1rem' }}>
                                    {importResult.stats?.created} aulas importadas com sucesso
                                </h3>
                                <span style={{ color: '#388E3C', fontSize: '0.9rem' }}>
                                    O calendário foi atualizado automaticamente.
                                </span>
                            </div>
                        </div>

                        <div style={{
                            flex: 1,
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-primary)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                                Resumo das Aulas Criadas
                            </div>
                            <div style={{ overflowY: 'auto', maxHeight: '300px', padding: '10px' }}>
                                {importResult.lessons && importResult.lessons.map((lesson, index) => (
                                    <div key={index} style={{
                                        padding: '8px 12px',
                                        borderBottom: '1px solid var(--border-color)',
                                        display: 'flex',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-primary)',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ color: 'var(--text-tertiary)', minWidth: '20px' }}>{index + 1}</span>
                                        <span style={{ fontWeight: 600, minWidth: '90px' }}>{formatDate(lesson.date)}</span>
                                        <span style={{ color: 'var(--text-secondary)', minWidth: '80px' }}>{getWeekday(lesson.date)}</span>
                                        <span style={{
                                            backgroundColor: lesson.period === 'Noite' ? '#EDE7F6' : '#FFF3E0',
                                            color: lesson.period === 'Noite' ? '#673AB7' : '#E65100',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            minWidth: '60px',
                                            textAlign: 'center'
                                        }}>
                                            {lesson.period}
                                        </span>
                                        <div style={{ display: 'flex', gap: '5px', flex: 1, flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 600 }}>{lesson.turma}</span>
                                            <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                                            <span>{lesson.uc}</span>
                                            <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{lesson.lab}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={onClose} className="btn-primary">
                                Concluir
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
