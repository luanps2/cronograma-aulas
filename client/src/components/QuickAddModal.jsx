import React from 'react';
import Modal from './Modal';
import CourseForm from './forms/CourseForm';
import ClassForm from './forms/ClassForm';
import UCForm from './forms/UCForm';
import LabForm from './forms/LabForm';

export default function QuickAddModal({ isOpen, onClose, type, data, onSave }) {
    const titles = {
        courses: 'Adicionar Novo Curso',
        classes: 'Adicionar Nova Turma',
        ucs: 'Adicionar Unidade Curricular',
        labs: 'Adicionar Laboratório'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={titles[type]} maxWidth="500px">
            <div style={{ padding: '24px' }}>
                {type === 'courses' && <CourseForm onSubmit={(payload) => onSave('courses', payload)} />}
                {type === 'classes' && <ClassForm courses={data.courses || []} onSubmit={(payload) => onSave('classes', payload)} />}
                {type === 'ucs' && <UCForm courses={data.courses || []} onSubmit={(payload) => onSave('ucs', payload)} />}
                {type === 'labs' && <LabForm onSubmit={(payload) => onSave('labs', payload)} />}

                <p style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    * Campos obrigatórios
                </p>
            </div>
        </Modal>
    );
}
