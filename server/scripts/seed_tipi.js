const db = require('../src/database');

const courseId = 2; // Técnico em Informática para Internet (TIPI)

const ucs = [
    { name: 'UC1', desc: 'Elaborar projetos de aplicações para web*.', hours: '36h' },
    { name: 'UC2', desc: 'Desenvolver aplicações para websites.', hours: '72h' },
    { name: 'UC3', desc: 'Codificar front-end de aplicações web.', hours: '96h' },
    { name: 'UC4', desc: 'Publicar aplicações web**.', hours: '36h' },
    { name: 'UC5', desc: 'Projeto Integrador Desenvolvedor Front-End', hours: '24h' },
    { name: 'UC6', desc: 'Desenvolver algoritmos.', hours: '96h' },
    { name: 'UC7', desc: 'Codificar back-end de aplicações web', hours: '120h' },
    { name: 'UC8', desc: 'Implementar banco de dados para web.', hours: '84h' },
    { name: 'UC9', desc: 'Desenvolver serviços web.', hours: '48h' },
    { name: 'UC10', desc: 'Organizar o processo de trabalho no desenvolvimento de aplicações***.', hours: '48h' },
    { name: 'UC11', desc: 'Projeto Integrador Desenvolvedor Back-End', hours: '32h' },
    { name: 'UC12', desc: 'Desenvolver interface gráfica para dispositivos móveis.', hours: '60h' },
    { name: 'UC13', desc: 'Codificar aplicações para dispositivos móveis.', hours: '120h' },
    { name: 'UC14', desc: 'Codificar acesso à web services e recursos de sistemas móveis.', hours: '60h' },
    { name: 'UC15', desc: 'Publicar aplicações para dispositivos móveis.', hours: '36h' },
    { name: 'UC16', desc: 'Projeto Integrador Desenvolvedor Mobile', hours: '32h' }
];

console.log(`Iniciando inserção de ${ucs.length} UCs para o curso ID ${courseId} (TIPI)...`);

const insert = db.prepare('INSERT INTO ucs (name, desc, hours, courseId) VALUES (?, ?, ?, ?)');

const transaction = db.transaction((data) => {
    for (const uc of data) {
        insert.run(uc.name, uc.desc, uc.hours, courseId);
    }
});

try {
    transaction(ucs);
    console.log('Todas as UCs do TIPI foram inseridas com sucesso!');
} catch (error) {
    console.error('Erro ao inserir UCs do TIPI:', error);
}
