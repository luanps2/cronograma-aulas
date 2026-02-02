import React, { useState, useEffect } from 'react';
import { Plus, Save, X } from 'lucide-react';

export default function UCForm({ courses, onSubmit, initialData, onCancel }) {
    const [courseId, setCourseId] = useState('');
    const [code, setCode] = useState('');
    const [desc, setDesc] = useState('');
    const [hours, setHours] = useState('');

    useEffect(() => {
        if (initialData) {
            setCourseId(initialData.courseId || initialData.course?.id || '');
            setCode(initialData.name || '');
            setDesc(initialData.desc || '');
            setHours(initialData.hours || '');
        } else {
            setCourseId('');
            setCode('');
            setDesc('');
            setHours('');
        }
    }, [initialData]);

    const handleSubmit = () => {
        if (!courseId || !code.trim() || !desc.trim() || !hours.trim()) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }
        onSubmit({ course: courseId, name: code.trim(), desc: desc.trim(), hours: hours.trim() });
        if (!initialData) {
            setCourseId('');
            setCode('');
            setDesc('');
            setHours('');
        }
    };

    return (
        <div style={{ marginBottom: '0', padding: '15px', background: initialData ? '#E1F5FE' : '#FAFAFA', borderRadius: '8px', border: initialData ? '1px solid #03A9F4' : '1px solid #EEE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#01579B' }}>{initialData ? 'Editando UC' : 'Nova UC'}</h4>
                {initialData && <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={16} /></button>}
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: '#555' }}>Curso *</label>
                <select
                    style={{ width: '100%', padding: '8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '0.9rem', background: 'white' }}
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                >
                    <option value="">Selecione um curso</option>
                    {courses.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.acronym} - {c.name}</option>)}
                </select>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: '#555' }}>Código da UC *</label>
                <input
                    style={{ width: '100%', padding: '8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '0.9rem' }}
                    placeholder="Ex: UC1, UC2"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: '#555' }}>Descrição *</label>
                <input
                    style={{ width: '100%', padding: '8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '0.9rem' }}
                    placeholder="Ex: Fundamentos de Programação"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: '#555' }}>Carga Horária *</label>
                <input
                    style={{ width: '100%', padding: '8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '0.9rem' }}
                    placeholder="Ex: 60h, 120h"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                />
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', backgroundColor: initialData ? '#0277BD' : '' }} onClick={handleSubmit}>
                {initialData ? <><Save size={16} /> Salvar Alterações</> : <><Plus size={16} /> Adicionar UC</>}
            </button>
        </div>
    );
}

