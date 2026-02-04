import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import Modal from './Modal';

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
        if (!file.type.match('image/png') && !file.type.match('image/jpeg') && !file.type.match('image/jpg')) {
            setError('Por favor, envie apenas imagens (PNG, JPG, JPEG)');
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
            setError('Falha aoprocessar a imagem. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        setPreview(null);
        setError(null);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Cronograma" maxWidth="600px">
            <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    <p style={{ marginBottom: '10px' }}>
                         Cole (Ctrl+V) ou arraste uma imagem do cronograma Excel para importar automaticamente.
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                        Formatos aceitos: PNG, JPG, JPEG
                    </p>
                </div>

                {!file && (
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        style={{
                            border: `2px dashed ${dragActive ? '#0277BD' : 'var(--border-color)'}`,
                            borderRadius: '12px',
                            padding: '40px 20px',
                            textAlign: 'center',
                            background: dragActive ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                            transition: 'all 0.3s',
                            cursor: 'pointer'
                        }}
                        onClick={() => document.getElementById('fileInput').click()}
                    >
                        <Upload size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 15px' }} />
                        <p style={{ margin: '10px 0', color: 'var(--text-primary)', fontWeight: 500 }}>
                            Arraste a imagem ou clique para selecionar
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                            Ou use Ctrl+V para colar da área de transferência
                        </p>
                        <input
                            id="fileInput"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                )}

                {preview && (
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <img src={preview} alt="Preview" style={{ width: '100%', display: 'block' }} />
                        </div>
                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <FileSpreadsheet size={20} color="var(--text-tertiary)" />
                            <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{file.name}</span>
                            <button onClick={removeFile} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                Remover
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ marginTop: '15px', padding: '12px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <AlertCircle size={20} color="#D32F2F" />
                        <span style={{ color: '#D32F2F', fontSize: '0.9rem' }}>{error}</span>
                    </div>
                )}

                {success && (
                    <div style={{ marginTop: '15px', padding: '12px', background: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <CheckCircle size={20} color="#4CAF50" />
                        <span style={{ color: '#4CAF50', fontSize: '0.9rem' }}>Importação concluída com sucesso!</span>
                    </div>
                )}

                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} className="btn-outline" disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        onClick={handleUpload}
                        className="btn-primary"
                        disabled={!file || loading || success}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? 'Processando...' : 'Importar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
