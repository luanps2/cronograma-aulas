const OpenAI = require('openai');
const fs = require('fs');

async function processExcelImage(filePath) {
    // 1. Check for API Key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
        console.warn('⚠️ OPENAI_API_KEY not found. Using MOCK mode for image processing.');

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Return Mock Data matching the user's provided Schedule (Feb 2026)
        // Format of string in cells: "TURMA - UC - LAB"
        return [
            // Semana 1 (02-06 Feb)
            { date: '2026-02-02', period: 'Noite', turma: 'TI 27', uc: 'UC12', lab: 'LAB43' },
            { date: '2026-02-03', period: 'Noite', turma: 'TI 30', uc: 'UC12', lab: 'LAB44' },
            { date: '2026-02-04', period: 'Tarde', turma: 'TI 28', uc: 'UC12', lab: 'LAB43' },
            { date: '2026-02-04', period: 'Noite', turma: 'TI 27', uc: 'UC12', lab: 'LAB43' },
            { date: '2026-02-05', period: 'Noite', turma: 'TI 30', uc: 'UC12', lab: 'LAB44' },
            { date: '2026-02-06', period: 'Tarde', turma: 'TI 28', uc: 'UC16', lab: 'LAB43' },
            { date: '2026-02-06', period: 'Noite', turma: 'TI 27', uc: 'UC12', lab: 'LAB43' },

            // Semana 2 (09-14 Feb)
            { date: '2026-02-09', period: 'Noite', turma: 'TI 27', uc: 'UC12', lab: 'LAB43' },
            { date: '2026-02-10', period: 'Noite', turma: 'TI 30', uc: 'UC12', lab: 'LAB44' },
            { date: '2026-02-11', period: 'Tarde', turma: 'TI 28', uc: 'UC12', lab: 'LAB43' },
            { date: '2026-02-11', period: 'Noite', turma: 'TI 27', uc: 'UC12', lab: 'LAB43' },
            { date: '2026-02-12', period: 'Noite', turma: 'TI 30', uc: 'UC12', lab: 'LAB44' },
            { date: '2026-02-13', period: 'Tarde', turma: 'TI 28', uc: 'UC16', lab: 'LAB43' },
            { date: '2026-02-13', period: 'Noite', turma: 'TI 27', uc: 'UC12', lab: 'LAB43' },

            // Semana 3 (16-21 Feb)
            // (Skipping Carnval/Recess days if represented by dark blue in image)
            { date: '2026-02-19', period: 'Noite', turma: 'TI 30', uc: 'UC12', lab: 'LAB44' },
            { date: '2026-02-20', period: 'Tarde', turma: 'TI 28', uc: 'UC12', lab: 'LAB43' },
            { date: '2026-02-20', period: 'Noite', turma: 'TI 27', uc: 'UC12', lab: 'LAB43' },

            // Semana 4 (23-27 Feb)
            { date: '2026-02-23', period: 'Noite', turma: 'TI 27', uc: 'UC12', lab: 'LAB43' },
            { date: '2026-02-24', period: 'Noite', turma: 'TI 30', uc: 'UC12', lab: 'LAB44' },
            { date: '2026-02-25', period: 'Tarde', turma: 'TI 28', uc: 'UC12', lab: 'LAB43' },
            { date: '2026-02-25', period: 'Noite', turma: 'TI 27', uc: 'UC12', lab: 'LAB43' },
            { date: '2026-02-26', period: 'Noite', turma: 'TI 30', uc: 'UC12', lab: 'LAB44' },
            { date: '2026-02-27', period: 'Tarde', turma: 'TI 28', uc: 'UC16', lab: 'LAB43' },
            { date: '2026-02-27', period: 'Noite', turma: 'TI 27', uc: 'UC12', lab: 'LAB43' },
        ];
    }

    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');

        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Updated to optimized model if available, or gpt-4-turbo
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this image of a class schedule. Extract lessons with: Date (YYYY-MM-DD), Turma, UC, Period (Manhã/Tarde/Noite), Lab. Return JSON only: { lessons: [] }. Ignore empty rows." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1500,
        });

        const content = response.choices[0].message.content;

        // Robust JSON extraction
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return data.lessons || [];
        }
        throw new Error('Could not parse AI response');

    } catch (error) {
        console.error('AI Processing Error:', error);
        // Fallback to mock on error? No, better to let the user know if the key WAS provided but failed.
        if (error.status === 401) {
            throw new Error('Invalid OpenAI API Key');
        }
        throw error;
    }
}

module.exports = { processExcelImage };

