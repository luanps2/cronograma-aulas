import React, { useState, useEffect, useCallback } from 'react';
import { Upload, X, Lightbulb, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';
import Modal from './Modal';
import API_BASE_URL from '../config/api';

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
        // Validate MIME type or extension
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel.sheet.macroEnabled.12'];
        const validExts = ['.xlsx', '.xlsm'];

        const isTypeValid = validTypes.includes(file.type);
        const isExtValid = validExts.some(ext => file.name.endsWith(ext));

        if (!isTypeValid && !isExtValid) {
            setError('Por favor, envie apenas arquivos Excel (.xlsx ou .xlsm).');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', file); // Field name MUST match multer config ('image')

        try {
            const res = await axios.post(`${API_BASE_URL}/api/upload-excel`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setImportResult(res.data);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.error || 'Falha ao processar o arquivo.';
            const details = err.response?.data?.details || [];

            let detailText = '';
            if (details.length > 0) {
                detailText = details.map(d => `• ${d.error}`).join('\n');
            }

            setError(`${errorMessage}\n${detailText}`);
        } finally {
            setLoading(false);
        }
    };

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
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="800px">
            <div style={{ padding: '0 24px 24px 24px' }}>

                {/* Header */}
                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2E7D32', marginBottom: '5px' }}>
                        Importar Planilha Excel
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                        Faça upload do arquivo <code>.xlsx</code> contendo a aba <strong>EXPORT_APP</strong>.
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
                                border: `2px dashed ${dragActive ? '#2E7D32' : 'var(--border-color)'}`,
                                borderRadius: '12px',
                                backgroundColor: dragActive ? 'rgba(46, 125, 50, 0.05)' : 'var(--bg-tertiary)',
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
                                accept=".xlsx, .xlsm"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFiles(e.target.files)}
                            />

                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #E0E0E0', borderTopColor: '#2E7D32', borderRadius: '50%' }}></div>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Processando arquivo Excel...</span>
                                </div>
                            ) : (
                                <>
                                    <FileSpreadsheet size={48} color="#2E7D32" style={{ marginBottom: '15px' }} />
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                                        Clique para selecionar <span style={{ fontWeight: 400 }}>ou arraste o arquivo aqui</span>
                                    </h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                        Arquivos .xlsx ou .xlsm
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '8px', padding: '15px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <AlertCircle size={20} color="#D32F2F" style={{ marginTop: '2px' }} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#C62828', fontSize: '0.9rem' }}>Erro na Importação</h4>
                                    <pre style={{ margin: 0, color: '#B71C1C', fontSize: '0.8rem', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{error}</pre>
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        <div style={{ backgroundColor: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: '8px', padding: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#1B5E20', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Lightbulb size={16} /> Estrutura Obrigatória da Aba "EXPORT_APP"
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#2E7D32', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <li><strong>Col A:</strong> Data (DD/MM/YYYY)</li>
                                    <li><strong>Col B:</strong> Dia da Semana (Ignorado)</li>
                                    <li><strong>Col C:</strong> Aulas TARDE</li>
                                    <li><strong>Col D:</strong> Aulas NOITE</li>
                                </ul>
                                <div>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#1B5E20', fontWeight: 600 }}>Formato da Célula:</p>
                                    <code style={{ background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #A5D6A7', color: '#2E7D32', fontSize: '0.8rem', display: 'block' }}>
                                        TURMA - UC - LABORATÓRIO<br />
                                        Ex: TI 27 - UC12 - LAB43
                                    </code>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Success State */
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                            <StatBox label="Detectadas" value={importResult.stats?.processed} color="#1976D2" />
                            <StatBox label="Criadas" value={importResult.stats?.created} color="#2E7D32" />
                            <StatBox label="Ignoradas" value={importResult.stats?.ignored} color="#757575" sub="(Duplicadas)" />
                            <StatBox label="Erros" value={importResult.stats?.errors} color="#D32F2F" />
                        </div>

                        {importResult.stats?.errors > 0 && importResult.details?.length > 0 && (
                            <div style={{ marginBottom: '20px', maxHeight: '150px', overflowY: 'auto', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '8px', padding: '10px' }}>
                                <h4 style={{ margin: '0 0 5px 0', color: '#C62828', fontSize: '0.85rem' }}>Erros Encontrados:</h4>
                                {importResult.details.map((d, i) => (
                                    <div key={i} style={{ fontSize: '0.8rem', color: '#B71C1C', marginBottom: '4px', borderBottom: '1px dashed #EF9A9A', paddingBottom: '2px' }}>
                                        <strong>Linha {d.row} {d.col ? `(Col ${d.col})` : ''}:</strong> {d.error} <span style={{ opacity: 0.7 }}>{d.raw ? `[${d.raw}]` : ''}</span>
                                    </div>
                                ))}
                            </div>
                        )}

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
                                Aulas Criadas ({importResult.lessons?.length || 0})
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
                                {importResult.lessons?.length === 0 && (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>
                                        Nenhuma aula foi criada nesta importação.
                                    </div>
                                )}
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

function StatBox({ label, value, color, sub }) {
    return (
        <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: color }}>{value || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
            {sub && <div style={{ fontSize: '0.7rem', color: '#999' }}>{sub}</div>}
        </div>
    )
}
