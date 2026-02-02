import React, { useState, useEffect } from 'react';
import { Plus, Save, X } from 'lucide-react';

export default function LabForm({ onSubmit, initialData, onCancel }) {
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setCapacity(initialData.capacity || '');
        } else {
            setName('');
            setCapacity('');
        }
    }, [initialData]);

    const handleSubmit = () => {
        if (!name.trim()) {
            alert('Informe o nome do laboratório');
            return;
        }
        onSubmit({ name: name.trim(), capacity: capacity.trim() || 'Não especificado' });
        if (!initialData) {
            setName('');
            setCapacity('');
        }
    };

    return (
        <div style={{ marginBottom: '0', padding: '15px', background: initialData ? '#ECEFF1' : '#FAFAFA', borderRadius: '8px', border: initialData ? '1px solid #607D8B' : '1px solid #EEE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#37474F' }}>{initialData ? 'Editando Lab' : 'Novo Lab'}</h4>
                {initialData && <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={16} /></button>}
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: '#555' }}>Nome do Laboratório *</label>
                <input
                    style={{ width: '100%', padding: '8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '0.9rem' }}
                    placeholder="Ex: LAB43"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: '#555' }}>Capacidade</label>
                <input
                    style={{ width: '100%', padding: '8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '0.9rem' }}
                    placeholder="Ex: 30 lugares"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                />
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', backgroundColor: initialData ? '#455A64' : '' }} onClick={handleSubmit}>
                {initialData ? <><Save size={16} /> Salvar Alterações</> : <><Plus size={16} /> Adicionar Lab</>}
            </button>
        </div>
    );
}

