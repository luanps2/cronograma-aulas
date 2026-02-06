const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

async function processExcelImage(filePath) {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY is missing in environment variables.');
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        // Use Gemini 1.5 Flash as requested
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');

        const prompt = `
        Analise esta imagem de um cronograma de aulas.
        Extraia os dados ESTRITAMENTE seguindo este formato JSON:
        {
          "aulas": [
            {
              "data": "YYYY-MM-DD",
              "diaSemana": "String (ex: Segunda)",
              "periodo": "String (ex: Noite, Tarde)",
              "turma": "String (ex: TI-27)",
              "uc": "String (ex: UC12)",
              "laboratorio": "String (ex: LAB43)",
              "descricao": null
            }
          ]
        }
        
        REGRAS:
        1. Procure por cabeçalho de Mês/Ano (ex: Março/2026). Se encontrar, use para compor as datas.
        2. Se houver apenas o dia (ex: 02, 03), combine com o mês/ano identificado.
        3. Formate a data no padrão ISO 8601 (YYYY-MM-DD).
        4. Identifique Turma, UC, Laboratório e Período.
        5. Retorne APENAS o JSON. Sem markdown (\`\`\`json), sem textos adicionais.
        6. Se não encontrar dados ou a imagem estiver ilegível, retorne { "aulas": [] }.
        `;

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/jpeg", // Assuming JPEG/PNG upload, generic mimetype usually works or detect from file ext
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown if Gemini decides to add it despite instructions
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(cleanText);
            return data.aulas || []; // Ensure we return the array
        } catch (e) {
            console.error("Failed to parse Gemini response:", text);
            throw new Error("Falha ao interpretar resposta da IA: JSON inválido");
        }

    } catch (error) {
        console.error("Gemini Processing Error:", error);
        throw error;
    }
}

module.exports = { processExcelImage };
