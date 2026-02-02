import React, { useState, useEffect } from 'react';
import { Plus, Save, X } from 'lucide-react';

export default function ClassForm({ courses, onSubmit, initialData, onCancel }) {
    const [courseId, setCourseId] = useState('');
    const [number, setNumber] = useState('');

    useEffect(() => {
        if (initialData) {
            setCourseId(initialData.courseId || initialData.course?.id || '');
            setNumber(initialData.number || '');
        } else {
            setCourseId('');
            setNumber('');
        }
    }, [initialData]);

    const selectedCourse = courses.find(c => c._id === courseId || c.id === parseInt(courseId));
    const previewName = selectedCourse && number ? `${selectedCourse.acronym} - ${number}` : '';

    const handleSubmit = () => {
        if (!courseId || !number.trim()) {
            alert('Selecione um curso e informe o número da turma');
            return;
        }
        onSubmit({
            course: courseId,
            number: number.trim(),
            year: initialData?.year || new Date().getFullYear().toString()
        });
        if (!initialData) {
            setCourseId('');
            setNumber('');
        }
    };

    return (
        <div style={{ marginBottom: '0', padding: '15px', background: initialData ? '#FFF3E0' : '#FAFAFA', borderRadius: '8px', border: initialData ? '1px solid #F57C00' : '1px solid #EEE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#E65100' }}>{initialData ? 'Editando Turma' : 'Nova Turma'}</h4>
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: '#555' }}>Número da Turma *</label>
                <input
                    style={{ width: '100%', padding: '8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '0.9rem' }}
                    placeholder="Ex: 27"
                    value={number}
                    onChange={e => setNumber(e.target.value)}
                />
            </div>
            {previewName && (
                <div style={{ background: '#E8F5E9', padding: '8px', borderRadius: '4px', marginBottom: '12px', fontSize: '0.85rem', color: '#2E7D32' }}>
                    ✓ Nome gerado: <strong>{previewName}</strong>
                </div>
            )}
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', backgroundColor: initialData ? '#F57C00' : '' }} onClick={handleSubmit}>
                {initialData ? <><Save size={16} /> Salvar Alterações</> : <><Plus size={16} /> Adicionar Turma</>}
            </button>
        </div>
    );
}
