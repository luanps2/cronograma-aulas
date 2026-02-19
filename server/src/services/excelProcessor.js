const ExcelJS = require('exceljs');

const { normalizeClassName } = require('../utils/normalizers');

/**
 * Normaliza o texto para o formato padrão.
 * - TI27, TI-27, TI 27 -> TI-27
 * - UC12, UC 12 -> UC12
 * - LAB43, LAB 43, LAB-43 -> LAB43
 */
function normalizeText(text, type) {
    if (!text) return null;

    if (type === 'TURMA') {
        return normalizeClassName(text);
    }

    let upper = text.toString().toUpperCase().trim();
    // Remover acentos
    upper = upper.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (type === 'UC') {
        // Expectativa do Professor/Usuário: UC12
        let clean = upper.replace(/\s+/g, '').replace(/-/g, '');
        if (clean.startsWith('UC')) {
            return clean;
        }
        // Lidar com erro de digitação "UE12"
        if (clean.startsWith('UE')) {
            return clean.replace('UE', 'UC');
        }
        return clean;
    }

    if (type === 'LAB') {
        // Expectativa do Professor/Usuário: LAB43
        let clean = upper.replace(/\s+/g, '').replace(/-/g, '');
        if (clean.startsWith('LAB')) {
            return clean;
        }
        // Lidar com "LABORATORIO 43" - manter logica existente
        if (clean.includes('LAB')) {
            const num = clean.match(/\d+/);
            if (num) return `LAB${num[0]}`;
        }
        return clean;
    }

    return upper;
}

async function processExcelFile(filePath) {
    console.log(`Iniciando processamento Excel para: ${filePath}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // 1. Localizar Aba
    const sheet = workbook.getWorksheet('EXPORT_APP');
    if (!sheet) {
        throw new Error('Aba "EXPORT_APP" não encontrada no arquivo.');
    }

    const lessons = [];
    const stats = {
        totalRows: 0,
        processedRows: 0,
        detectedLessons: 0
    };

    // 2. Iterar Linhas
    // Pular Cabeçalho (Linha 1 geralmente, mas podemos verificar)
    // Assumimos que os dados começam na Linha 2
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Pular Cabeçalho

        stats.totalRows++;

        // Coluna A: Data (1)
        const dateCell = row.getCell(1).value;
        if (!dateCell) return; // Pular linhas vazias

        // Lidar com parsing de Data
        let dateObj = null;
        try {
            // ExcelJS retorna datas como objetos geralmente, ou strings
            if (dateCell instanceof Date) {
                dateObj = dateCell;
            } else if (typeof dateCell === 'string') {
                // Esperado DD/MM/YYYY
                const parts = dateCell.split('/');
                if (parts.length === 3) {
                    dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            } else if (typeof dateCell === 'object' && dateCell.result) {
                // Resultado de fórmula
                if (dateCell.result instanceof Date) dateObj = dateCell.result;
            }
        } catch (e) {
            console.warn(`Linha ${rowNumber}: Data Inválida`, dateCell);
            return;
        }

        if (!dateObj || isNaN(dateObj.getTime())) {
            // Tentar parse estrito de string se data do Excel falhou
            // Às vezes vem como número (data serial do Excel)
            // ExcelJS geralmente lida com isso, mas vamos garantir.
            // Se inválido, pular linha
            return;
        }

        // Converter para YYYY-MM-DD para o Banco
        const dateStr = dateObj.toISOString().split('T')[0];

        // Coluna C: Tarde (3)
        // Coluna D: Noite (4)
        const afternoonCell = row.getCell(3).text; // .text pega o resultado ou string visível
        const eveningCell = row.getCell(4).text;

        const parseCell = (cellText, period) => {
            if (!cellText) return;

            // Separar por quebra de linha
            const lines = cellText.split(/\r?\n/).filter(l => l.trim().length > 0);

            lines.forEach(line => {
                // Esperado: TURMA - UC - LAB
                // Permitir " - " ou " – " (en dash) ou apenas "-"
                const parts = line.split(/[-–—]+/).map(p => p.trim()).filter(p => p.length > 0);

                if (parts.length >= 2) {
                    // Precisamos pelo menos de Turma e UC
                    const rawTurma = parts[0];
                    const rawUC = parts[1];
                    const rawLab = parts[2] || 'EM SALA'; // Padrão ou vazio?

                    lessons.push({
                        row: rowNumber,
                        date: dateStr,
                        period: period,
                        raw: { turma: rawTurma, uc: rawUC, lab: rawLab },
                        normalized: {
                            turma: normalizeText(rawTurma, 'TURMA'),
                            uc: normalizeText(rawUC, 'UC'),
                            lab: normalizeText(rawLab, 'LAB')
                        }
                    });
                    stats.detectedLessons++;
                }
            });
        };

        parseCell(afternoonCell, 'Tarde');
        parseCell(eveningCell, 'Noite');

        stats.processedRows++;
    });

    return { lessons, stats };
}

module.exports = { processExcelFile };
