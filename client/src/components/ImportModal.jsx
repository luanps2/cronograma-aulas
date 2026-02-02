import React, { useState, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function ImportModal({ isOpen, onClose, onImportSuccess }) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const handlePaste = (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const blob = items[i].getAsFile();
                    handleFile(blob);
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        // Validate file type
        if (!file.type.match('image.*')) {
            setError('Por favor, envie uma imagem (PNG, JPEG, WEBP).');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('O arquivo deve ter no máximo 10MB.');
            return;
        }

        setFile(file);
        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            // Replace with your actual API endpoint
            const response = await axios.post('http://localhost:5000/api/upload-excel', formData);

            setSuccess(true);
            setTimeout(() => {
                if (onImportSuccess) onImportSuccess();
                onClose();
                setSuccess(false);
                setFile(null);
                setPreview(null);
            }, 1500);

        } catch (err) {
            setError('Falha ao processar a imagem. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div style={{ padding: '20px', borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', color: '#004587' }}>Importar Planilha</h2>
                    <button onClick={onClose}><X size={20} color="#666" /></button>
                </div>

                <div style={{ padding: '30px' }}>
                    <p style={{ color: '#666', marginBottom: '20px' }}>Envie uma imagem da sua planilha Excel para importação automática</p>

                    <div
                        className={`drop-zone ${dragActive ? 'active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        style={{
                            border: '2px dashed #E0E0E0',
                            borderRadius: '12px',
                            padding: '40px',
                            textAlign: 'center',
                            backgroundColor: dragActive ? '#F5F9FF' : '#FAFAFA',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                        onClick={() => document.getElementById('file-upload').click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleChange}
                        />

                        {preview ? (
                            <div style={{ position: 'relative', height: '200px', display: 'flex', justifyContent: 'center' }}>
                                <img src={preview} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                                    style={{ position: 'absolute', top: -10, right: -10, background: 'white', border: '1px solid #ddd', borderRadius: '50%', padding: '5px' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload size={48} color="#999" style={{ marginBottom: '15px' }} />
                                <h3 style={{ fontSize: '1rem', marginBottom: '5px', color: '#444' }}>Clique para enviar ou arraste e solte</h3>
                                <p style={{ fontSize: '0.85rem', color: '#888' }}>PNG, JPEG ou WEBP (máx. 10MB)</p>
                            </>
                        )}
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', background: '#FFF3E0', borderRadius: '8px', border: '1px solid #FFCC80', display: 'flex', gap: '10px' }}>
                        <div style={{ color: '#F57C00' }}>💡</div>
                        <div>
                            <strong style={{ color: '#E65100', display: 'block', marginBottom: '4px' }}>Dica: Pressione Ctrl+V para colar uma imagem</strong>
                            <span style={{ fontSize: '0.9rem', color: '#555' }}>Tire um print da planilha e cole aqui diretamente!</span>
                        </div>
                    </div>

                    {error && (
                        <div style={{ marginTop: '20px', padding: '10px', background: '#FFEBEE', color: '#C62828', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ marginTop: '20px', padding: '10px', background: '#E8F5E9', color: '#2E7D32', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CheckCircle size={18} /> Importação concluída com sucesso!
                        </div>
                    )}

                    <div style={{ marginTop: '20px', padding: '15px', background: '#E1F5FE', borderRadius: '8px', border: '1px solid #B3E5FC' }}>
                        <h4 style={{ color: '#0277BD', fontSize: '0.9rem', marginBottom: '10px' }}>Formato esperado da planilha:</h4>
                        <ul style={{ fontSize: '0.85rem', color: '#01579B', paddingLeft: '20px', lineHeight: '1.5' }}>
                            <li>Coluna 1: Data (DD/MM/YYYY)</li>
                            <li>Coluna 2: Dia da semana</li>
                            <li>Coluna 3 (TARDE): Aulas do período da tarde</li>
                            <li>Coluna 4 (NOITE): Aulas do período da noite</li>
                            <li>Células: TURMA – UC – LABORATÓRIO (ex: TI 27 – UC13 – LAB43)</li>
                        </ul>
                    </div>
                </div>

                {file && !success && (
                    <div style={{ padding: '20px', borderTop: '1px solid #E0E0E0', display: 'flex', justifySelf: 'flex-end', justifyContent: 'flex-end', gap: '10px' }}>
                        <button className="btn-outline" onClick={onClose}>Cancelar</button>
                        <button className="btn-primary" onClick={handleUpload} disabled={loading}>
                            {loading ? <><Loader2 className="animate-spin" size={18} /> Processando...</> : 'Importar Aulas'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
