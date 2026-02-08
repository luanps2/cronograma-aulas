const Tesseract = require('tesseract.js');
const fs = require('fs');

async function processExcelImage(filePath) {
    try {
        console.log('Starting local OCR processing...');
        const imageBuffer = fs.readFileSync(filePath);

        // 1. Run Tesseract OCR (Portuguese)
        const { data: { text } } = await Tesseract.recognize(imageBuffer, 'por', {
            logger: m => console.log(`OCR Progress: ${m.status} (${(m.progress * 100).toFixed(0)}%)`)
        });

        console.log('OCR Output Raw:', text);

        // 2. Parse Text
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const lessons = [];
        let currentMonthYear = '';

        // Helper: Extract Date DD/MM/YYYY
        // Regex for DD/MM or DD/MM/YYYY
        // If only DD/MM found, we need a year. The user requirement says:
        // "Procure por cabeçalho de Mês/Ano (ex: Março/2026). Se encontrar, use para compor as datas."
        const monthYearRegex = /(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\/?\s*(\d{4})/i;

        // Try to find global month/year in the first few lines
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
            const match = lines[i].match(monthYearRegex);
            if (match) {
                // Map month name to number
                const months = { 'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04', 'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12' };
                currentMonthYear = `${months[match[1].toLowerCase()]}/${match[2]}`; // MM/YYYY
                console.log('Found Header Date:', currentMonthYear);
                break;
            }
        }

        // 3. Process Rows (Fixed Schema: Date | Weekday | Afternoon | Night)
        // We assume the table structure is roughly maintained in lines. 
        // Tesseract usually outputs text line by line.
        // If the table is complex, text might be jumbled. 
        // STRATEGY: Look for lines starting with a Date (DD/MM or DD/MM/YYYY).

        for (const line of lines) {
            // Regex for Date at start of line: ^(\d{2})[/.](\d{2})([/.]\d{4})?
            const dateMatch = line.match(/^(\d{1,2})[\/\.](\d{2})([\/\.]\d{4})?/);

            if (dateMatch) {
                let fullDate = '';
                const day = dateMatch[1].padStart(2, '0');
                const month = dateMatch[2].padStart(2, '0');
                const year = dateMatch[3] ? dateMatch[3].substring(1) : (currentMonthYear ? currentMonthYear.split('/')[1] : new Date().getFullYear().toString());

                fullDate = `${year}-${month}-${day}`;

                // Sanity check: is valid date?
                if (isNaN(new Date(fullDate).getTime())) continue;

                // After date, we look for content.
                // The line structure after date: Weekday | Afternoon Content | Night Content
                // Tesseract might merge columns with spaces.
                // "02/03 Segunda TI 27 - UC12 - LAB43 TI 28 - UC13 - LAB44"

                // We need to identify the blocks "TURMA - UC - LAB".
                // Regex: ([A-Z0-9\s]+)\s-\s([A-Z0-9\s]+)\s-\s([A-Z0-9\s]+)
                // This might be tricky if afternoon and night are on same line.
                // We can assume the order: First match is Afternoon, Second is Night? 
                // OR we check the text position. But we only have raw text here.

                // Let's try to find all occurrences of the pattern in the line.
                const lessonRegex = /([A-Z0-9\s]+?)\s-\s([A-Z0-9\s]+?)\s-\s([A-Z0-9]+)/gi;
                const matches = [...line.matchAll(lessonRegex)];

                // If matches found:
                // Assign first timestamp to Afternoon? Or check keywords "Tarde"/"Noite" in header?
                // The requirement: "Coluna 3: Aulas do período TARDE", "Coluna 4: Aulas do período NOITE"
                // If we have 2 matches, assume 1=Tarde, 2=Noite.
                // If we have 1 match, it's ambiguous without column position.
                // HOWEVER, usually "Noite" might be empty or "Tarde" empty.
                // Simple Heuristic: If there are 2 matches, strict assignment.
                // If 1 match: Check if it looks like Tarde or Noite based on previous lines or just assume Tarde?
                // BETTER: The prompt says "Coluna 3... Coluna 4".
                // In text, if Tesseract preserves order:
                // "Date Weekday Match1 Match2" -> Match1=Tarde, Match2=Noite
                // "Date Weekday Match1" -> Match1=Tarde (Assume). 
                // Unless there is a placeholder like contents "---" or "Feriado".

                // Let's iterate matches.
                if (matches.length > 0) {
                    // First match = TARDE
                    const match1 = matches[0];
                    lessons.push({
                        data: fullDate,
                        diaSemana: '', // Not strictly needed for DB, can be derived
                        periodo: 'Tarde',
                        turma: match1[1].trim(),
                        uc: match1[2].trim(),
                        laboratorio: match1[3].trim()
                    });

                    // Second match = NOITE
                    if (matches.length > 1) {
                        const match2 = matches[1];
                        lessons.push({
                            data: fullDate,
                            diaSemana: '',
                            periodo: 'Noite',
                            turma: match2[1].trim(),
                            uc: match2[2].trim(),
                            laboratorio: match2[3].trim()
                        });
                    }
                }
            }
        }

        return lessons;

    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Falha no processamento local da imagem.');
    }
}

module.exports = { processExcelImage };
