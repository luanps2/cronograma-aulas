const db = require('../src/database');

const courseId = 1; // Técnico em Informática

const ucs = [
    { name: 'UC1', desc: 'Planejar e executar a montagem de computadores.', hours: '84h' },
    { name: 'UC2', desc: 'Planejar e executar a instalação de hardware e software para computadores.', hours: '96h' },
    { name: 'UC3', desc: 'Planejar e executar a manutenção de computadores.', hours: '72h' },
    { name: 'UC4', desc: 'Projeto Integrador Assistente de Suporte e Manutenção de Computadores', hours: '20h' },
    { name: 'UC5', desc: 'Planejar e executar a instalação de redes locais de computadores.', hours: '96h' },
    { name: 'UC6', desc: 'Planejar e executar a manutenção de redes locais de computadores.', hours: '96h' },
    { name: 'UC7', desc: 'Planejar e executar a instalação, a configuração e o monitoramento de sistemas operacionais de redes locais (servidores).', hours: '96h' },
    { name: 'UC8', desc: 'Projeto Integrador Assistente de Operação de Redes de Computadores', hours: '20h' },
    { name: 'UC9', desc: 'Desenvolver Algoritmos.', hours: '108h' },
    { name: 'UC10', desc: 'Desenvolver banco de dados.', hours: '72h' },
    { name: 'UC11', desc: 'Executar teste e implantação de aplicativos computacionais.', hours: '60h' },
    { name: 'UC12', desc: 'Executar os processos de codificação, manutenção e documentação de aplicativos computacionais para desktop.', hours: '96h' },
    { name: 'UC13', desc: 'Executar os processos de codificação, manutenção e documentação de aplicativos computacionais para internet.', hours: '96h' },
    { name: 'UC14', desc: 'Manipular e otimizar imagens vetoriais, bitmaps gráficos e elementos visuais de navegação para web.', hours: '48h' },
    { name: 'UC15', desc: 'Desenvolver e organizar elementos estruturais de sites.', hours: '108h' },
    { name: 'UC16', desc: 'Projeto Integrador Assistente de Desenvolvimento de Aplicativos Computacionais', hours: '32h' }
];

console.log(`Iniciando inserção de ${ucs.length} UCs para o curso ID ${courseId}...`);

const insert = db.prepare('INSERT INTO ucs (name, desc, hours, courseId) VALUES (?, ?, ?, ?)');

const transaction = db.transaction((data) => {
    for (const uc of data) {
        insert.run(uc.name, uc.desc, uc.hours, courseId);
    }
});

try {
    transaction(ucs);
    console.log('Todas as UCs foram inseridas com sucesso!');
} catch (error) {
    console.error('Erro ao inserir UCs:', error);
}
