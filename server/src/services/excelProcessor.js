const OpenAI = require('openai');
const fs = require('fs');

async function processExcelImage(filePath) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API Key not configured. Please add OPENAI_API_KEY to your environment variables.');
    }

    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');

        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this image of a class schedule. Extract lessons with: Date (YYYY-MM-DD), Turma, UC, Period (Manhã/Tarde/Noite), Lab. Return JSON only: { lessons: [] }" },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return data.lessons || [];
        }
        throw new Error('Could not parse AI response');

    } catch (error) {
        console.error('AI Processing Error:', error);
        throw error;
    }
}

module.exports = { processExcelImage };

