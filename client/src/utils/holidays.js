/**
 * Utilitários para Feriados (Brasil + SP)
 * Inclui cálculo de Páscoa e derivados (Carnaval, Corpus Christi)
 */

const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// Algoritmo de Gauss para calcular Páscoa
const getEasterDate = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);

    // Mês e Dia
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    // Retorna string YYYY-MM-DD
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getHolidays = (year) => {
    const fixedHolidays = [
        { date: `${year}-01-01`, title: 'Confraternização Universal', type: 'holiday', color: '#EF5350' },
        { date: `${year}-04-21`, title: 'Tiradentes', type: 'holiday', color: '#EF5350' },
        { date: `${year}-05-01`, title: 'Dia do Trabalho', type: 'holiday', color: '#EF5350' },
        { date: `${year}-09-07`, title: 'Independência do Brasil', type: 'holiday', color: '#EF5350' },
        { date: `${year}-10-12`, title: 'Nossa Srª Aparecida', type: 'holiday', color: '#EF5350' },
        { date: `${year}-11-02`, title: 'Finados', type: 'holiday', color: '#EF5350' },
        { date: `${year}-11-15`, title: 'Proclamação da República', type: 'holiday', color: '#EF5350' },
        { date: `${year}-11-20`, title: 'Dia da Consciência Negra', type: 'holiday', color: '#EF5350' }, // Nacional recente
        { date: `${year}-12-25`, title: 'Natal', type: 'holiday', color: '#EF5350' },

        // Estaduais SP
        { date: `${year}-07-09`, title: 'Revolução Constitucionalista', type: 'holiday', color: '#EF5350' },
    ];

    // Móveis (Baseados na Páscoa)
    const easterStr = getEasterDate(year);
    // Para calcular os outros, precisamos converter para Date e depois voltar para string YYYY-MM-DD
    // IMPORTANTE: Tratar timezone ou usar UTC para evitar off-by-one errors

    // Parse UTC manual para evitar problemas de fuso
    const [eYear, eMonth, eDay] = easterStr.split('-').map(Number);
    const easterDate = new Date(eYear, eMonth - 1, eDay); // Local midnight é arriscado se não usar UTC consistentemente

    // Helper p/ formatar Date -> YYYY-MM-DD
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const carnavalDate = addDays(easterDate, -47);
    const sextaFeiraSantaDate = addDays(easterDate, -2);
    const corpusChristiDate = addDays(easterDate, 60);

    const mobileHolidays = [
        { date: fmt(carnavalDate), title: 'Carnaval', type: 'holiday', color: '#EF5350' },
        { date: fmt(sextaFeiraSantaDate), title: 'Sexta-feira Santa', type: 'holiday', color: '#EF5350' },
        { date: easterStr, title: 'Páscoa', type: 'holiday', color: '#EF5350' }, // Opcional
        { date: fmt(corpusChristiDate), title: 'Corpus Christi', type: 'holiday', color: '#EF5350' },
    ];

    return [...fixedHolidays, ...mobileHolidays].sort((a, b) => a.date.localeCompare(b.date));
};
