import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Plus, ExternalLink, Link as LinkIcon } from 'lucide-react';
import SettingsFormModal from './SettingsFormModal';
import API_BASE_URL from '../config/api';

const CATEGORIES = [
    'Ferramentas',
    'Documentos',
    'Links Úteis',
    'Atividades - Lógica de Programação',
    'Atividades - C#'
];

export default function LinkManagerModal({ isOpen, onClose }) {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);

    useEffect(() => {
        if (isOpen) {
            fetchLinks();
        }
    }, [isOpen]);

    const fetchLinks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/links`);
            setLinks(res.data);
        } catch (error) {
            console.error('Failed to fetch links', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!title.trim() || !url.trim()) return alert('Preencha título e URL');

        try {
            await axios.post(`${API_BASE_URL}/api/links`, { title, url, category });
            setTitle('');
            setUrl('');
            fetchLinks(); // Refresh list
        } catch (error) {
            alert('Erro ao salvar link');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Excluir este link?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/links/${id}`);
            fetchLinks();
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    return (
        <SettingsFormModal isOpen={isOpen} onClose={onClose} title="Gerenciar Atalhos do Cabeçalho">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Add Form */}
                <div style={{ background: 'var(--bg-secondary)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Adicionar Novo Link</h4>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        <input
                            placeholder="Nome do Link (ex: Google Classroom)"
                            className="input-field"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                        <input
                            placeholder="URL (https://...)"
                            className="input-field"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                        />
                        <select
                            className="input-field"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                        >
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <button onClick={handleAdd} className="btn-primary" style={{ marginTop: '5px' }}>
                            <Plus size={16} /> Adicionar Atalho
                        </button>
                    </div>
                </div>

                {/* List */}
                <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Seus Atalhos</h4>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>Carregando...</div>
                    ) : links.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-tertiary)' }}>
                            Nenhum link configurado.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {links.map(link => (
                                <div key={link.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ padding: '6px', background: 'var(--bg-secondary)', borderRadius: '4px' }}><LinkIcon size={14} color="var(--text-secondary)" /></div>
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{link.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{link.category}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(link.id)} style={{ color: '#D32F2F', padding: '5px', cursor: 'pointer', background: 'none', border: 'none' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
            <style>{`
                .input-field {
                    padding: 8px;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    width: 100%;
                }
            `}</style>
        </SettingsFormModal>
    );
}
