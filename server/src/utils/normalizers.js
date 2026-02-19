/**
 * Normaliza o nome da turma para um formato padrão.
 * Regras:
 * - Remove espaços extras.
 * - Converte para Uppercase.
 * - Padroniza hífen sem espaços (ex: "TI - 27" -> "TI-27").
 * - Remove espaços internos extras.
 * 
 * @param {string} name - Nome da turma
 * @returns {string} - Nome normalizado
 */
function normalizeClassName(name) {
    if (!name) return '';
    return name
        .toUpperCase()
        .trim()
        .replace(/\s*-\s*/g, '-') // "TI - 27" -> "TI-27"
        .replace(/\s+/g, '');     // "TI  27" -> "TI27" (Opcional, mas pedido no prompt "replace(/\s+/g, '')") 
    // OBS: O prompt pediu .replace(/\s+/g, ''), o que transformaria "TI - 27" em "TI-27" (se rodar depois do hifen) ou "TI27" se rodar antes?
    // O prompt deu exemplo: "Exemplo final: TI-27".
    // Se eu fizer replace \s+ por vazio, "TI 27" vira "TI27".
    // Se "TI - 27" -> replace - -> "TI-27" -> remove space -> "TI-27".
    // Vamos seguir a logica safe:
}

// Implementação estrita do prompt:
// return name
// .toUpperCase()
// .trim()
// .replace(/\s*-\s*/g, '-')
// .replace(/\s+/g, '');

const normalize = (name) => {
    if (!name) return '';

    // 1. Uppercase e Trim
    let normalized = name.toUpperCase().trim();

    // 2. Padronizar Hífen (TI - 27 -> TI-27)
    normalized = normalized.replace(/\s*-\s*/g, '-');

    // 3. Remover espaços restantes (TI 27 -> TI27, mas TI-27 mantem hifen)
    // O prompt diz: .replace(/\s+/g, '')
    // Isso vai remover espaços entre palavras se não tiver hifen.
    // Ex: "Técnico em Informática" -> "TÉCNICOEMINFORMÁTICA" - Cuidado!
    // Mas o contexto é "Turma". Turmas geralmente são códigos "TI-27".
    // Se for "TI 27", vira "TI27".
    // O objetivo é "TI-27".
    // Se a entrada for "TI 27", o regex de hifen não pega.
    // Vamos assumir que se não tem hifen, a gente não insere magicamente, só limpa.

    normalized = normalized.replace(/\s+/g, '');

    return normalized;
};

module.exports = { normalizeClassName: normalize };
