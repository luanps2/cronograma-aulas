# 🧠 SKILL — SAFE ACADEMIC PLANNING SYSTEM

## Propósito Geral
Garantir que o desenvolvimento da aplicação **Planejamento Acadêmico** seja:
- Estável
- Previsível
- Livre de regressões
- Baseado em dados estruturados
- Sustentável para evolução futura

Esta skill é **obrigatória** para qualquer alteração no projeto, tanto frontend quanto backend.

---

## 1. Princípios Fundamentais

- O sistema é **data-driven**.
- Dados acadêmicos são **estruturados** e **determinísticos**.
- Soluções mágicas, heurísticas frágeis ou dependência excessiva de IA são proibidas para dados críticos.
- O código deve ser **simples, explícito e auditável**.
- Tudo o que já foi corrigido **não pode quebrar novamente**.

---

## 2. Arquitetura Geral

### 2.1 Frontend
- React
- Componentização clara
- Layout único (Header / Main / Footer)
- Nenhuma tela pode renderizar headers duplicados
- Estados globais bem definidos (auth, tema, usuário)

### 2.2 Backend
- Node.js
- Express
- PostgreSQL (via Pool)
- Transações explícitas para operações críticas
- Nenhuma dependência de serviços Python, IA ou OCR

---

## 3. Banco de Dados (PostgreSQL / Supabase)

### 3.1 Fonte de Verdade
- O banco PostgreSQL é a **única fonte de verdade**
- SQLite, arquivos locais ou bancos embarcados são proibidos

### 3.2 Transações
- Operações críticas (importação, exclusão em massa, edição de aulas):
  - Devem usar `BEGIN / COMMIT / ROLLBACK`
- Em erro:
  - Nenhum dado parcial pode permanecer

### 3.3 Regras de Duplicidade
Uma aula é considerada duplicada se existir combinação idêntica de:
- Data
- Período
- Turma
- UC
- Laboratório

Duplicatas devem ser:
- Ignoradas
- Contabilizadas no relatório
- Nunca causar erro fatal

---

## 4. Importação de Dados (Excel) — REGRA CRÍTICA

### 4.1 Fonte Oficial
- A importação funciona **exclusivamente via Excel**
- Formatos aceitos:
  - `.xlsx`
  - `.xlsm`
- Importação por imagem, OCR ou IA é **proibida**

### 4.2 Aba Obrigatória
O arquivo deve conter **exatamente uma aba chamada**:

EXPORT_APP


Sem essa aba, a importação deve falhar com mensagem clara.

### 4.3 Estrutura da Aba `EXPORT_APP`

| Coluna | Conteúdo |
|------|---------|
| A | Data (DD/MM/YYYY) |
| B | Dia da semana (ignorado) |
| C | Aulas – Período TARDE |
| D | Aulas – Período NOITE |

- Fórmulas são permitidas
- O backend deve ler **apenas os valores finais**

### 4.4 Formato das Células de Aula
Aceitar variações como:

- `TI 27 - UC12 - LAB43`
- `TI-27 UC12 LAB43`
- `TI27 - UC 12 - LAB 43`

### 4.5 Normalização Obrigatória (ANTI-ERRO)
Antes de qualquer validação:

- Turma → `TI-27`
- UC → `UC12`
- Laboratório → `LAB43`

Espaços, hífens e variações devem ser **normalizados automaticamente**.

---

## 5. Processo de Importação

### 5.1 Fluxo Correto
1. Ler arquivo Excel
2. Validar aba `EXPORT_APP`
3. Normalizar dados
4. Validar existência (turma, UC, lab)
5. Iniciar transação
6. Inserir aulas válidas
7. Ignorar duplicadas
8. Commit ou rollback

### 5.2 Relatório ao Usuário (Obrigatório)

Após a importação, retornar:

- Total de linhas processadas
- Total de aulas criadas
- Total de duplicadas ignoradas
- Lista resumida das aulas criadas

Exemplo:

3 aulas importadas com sucesso:
1 - 06/02/2026 - Sexta - Noite - TI-27 - UC12 - LAB43
2 - 09/02/2026 - Segunda - Tarde - TI-28 - UC16 - LAB44
3 - 10/02/2026 - Terça - Noite - TI-27 - UC12 - LAB43


### 5.3 Erros
Em caso de erro, informar:
- Linha do Excel
- Coluna
- Motivo exato (turma inexistente, UC inválida, data inválida, etc.)

---

## 6. UX / UI (Importação)

- Aceitar:
  - Upload
  - Arrastar e soltar
- Não aceitar imagens
- Não mencionar IA ou OCR
- Mensagens sempre em português
- Feedback claro e humano

---

## 7. Autenticação

### 7.1 OAuth
- Google Identity Services (GIS)
- Microsoft OAuth

### 7.2 Regras
- Audience deve bater exatamente com o Client ID
- Redirect URI deve ser explícito
- Erros já resolvidos (redirect_uri_mismatch, wrong audience):
  - **Nunca podem reaparecer**

---

## 8. Layout e UI Geral

- Um único header global
- Nenhuma duplicação de layout
- Inputs sempre dentro dos cards
- Ícones sempre visíveis (não apenas no hover)
- Dark mode consistente em toda a página

---

## 9. Limpeza de Código (Obrigatória)

- Código de IA, OCR, Python-service:
  - Deve ser removido completamente
- Pastas órfãs são proibidas
- Rotas não usadas devem ser excluídas
- Nenhuma feature removida pode continuar referenciada

---

## 10. Regra de Não-Regressão (CRÍTICA)

- Se algo já foi corrigido:
  - Não se discute novamente
  - Não se quebra novamente
- Antes de alterar:
  - Verificar histórico do projeto
  - Preservar contratos existentes

---

## 11. Comunicação

- Toda comunicação com o usuário: **Português**
- Logs técnicos podem ser técnicos
- UI deve ser clara, objetiva e humana

---

## Regra Final

> Dados estruturados exigem soluções estruturadas.  
> Funcionalidade crítica exige previsibilidade.  
> Se já foi resolvido uma vez, não pode voltar a falhar.

Esta skill é **obrigatória** para qualquer alteração futura no projeto.
