import React from 'react';
import { X } from 'lucide-react';
import CourseForm from './forms/CourseForm';
import ClassForm from './forms/ClassForm';
import UCForm from './forms/UCForm';
import LabForm from './forms/LabForm';

export default function QuickAddModal({ isOpen, onClose, type, data, onSave }) {
    if (!isOpen) return null;

    const titles = {
        courses: 'Adicionar Novo Curso',
        classes: 'Adicionar Nova Turma',
        ucs: 'Adicionar Unidade Curricular',
        labs: 'Adicionar Laboratório'
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" style={{
                background: 'white',
                padding: '30px',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ marginBottom: '20px', color: '#004587', fontSize: '1.5rem' }}>{titles[type]}</h2>

                {type === 'courses' && <CourseForm onSubmit={(payload) => onSave('courses', payload)} />}
                {type === 'classes' && <ClassForm courses={data.courses || []} onSubmit={(payload) => onSave('classes', payload)} />}
                {type === 'ucs' && <UCForm courses={data.courses || []} onSubmit={(payload) => onSave('ucs', payload)} />}
                {type === 'labs' && <LabForm onSubmit={(payload) => onSave('labs', payload)} />}

                <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
                    * Campos obrigatórios
                </p>
            </div>
        </div>
    );
}
