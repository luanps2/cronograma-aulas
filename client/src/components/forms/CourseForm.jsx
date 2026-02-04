import React, { useState, useEffect } from 'react';
import { Plus, Save, X } from 'lucide-react';

export default function CourseForm({ onSubmit, initialData, onCancel, isModal }) {
    const [acronym, setAcronym] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        if (initialData) {
            setAcronym(initialData.acronym || '');
            setName(initialData.name || '');
        } else {
            setAcronym('');
            setName('');
        }
    }, [initialData]);

    const handleSubmit = () => {
        if (!acronym.trim() || !name.trim()) {
            alert('Preencha sigla e nome do curso');
            return;
        }
        onSubmit({ acronym: acronym.trim().toUpperCase(), name: name.trim() });
        if (!initialData) {
            setAcronym('');
            setName('');
        }
    };

    const containerStyle = isModal ? {} : {
        marginBottom: '0',
        padding: '15px',
        background: initialData ? '#E3F2FD' : '#FAFAFA',
        borderRadius: '8px',
        border: initialData ? '1px solid #2196F3' : '1px solid #EEE'
    };

    return (
        <div style={containerStyle}>
            {!isModal && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#004587' }}>{initialData ? 'Editando Curso' : 'Novo Curso'}</h4>
                    {initialData && <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={16} /></button>}
                </div>
            )}

            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: '#555' }}>Sigla do Curso *</label>
                <input
                    style={{ width: '100%', padding: '8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '0.9rem' }}
                    placeholder="Ex: TI, TIPI"
                    value={acronym}
                    onChange={e => setAcronym(e.target.value)}
                />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: '#555' }}>Nome Completo *</label>
                <input
                    style={{ width: '100%', padding: '8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '0.9rem' }}
                    placeholder="Ex: Técnico em Informática"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                {isModal && <button className="btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>}
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', backgroundColor: initialData ? '#1976D2' : '' }} onClick={handleSubmit}>
                    {initialData ? <><Save size={16} /> Salvar</> : <><Plus size={16} /> Criar Curso</>}
                </button>
            </div>
        </div>
    );
}

