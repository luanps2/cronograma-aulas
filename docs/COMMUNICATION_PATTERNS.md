# Padrões de Comunicação

## Visão Geral

Este documento define os **protocolos de comunicação estritos** entre agentes para garantir limites claros, prevenir conflitos e manter a integridade do sistema.

## Princípios Fundamentais

### 1. Separação de Responsabilidades

**Cada agente tem um domínio claramente definido:**

- Frontend_UI_UX: **APENAS UI/UX**
- Backend_Core: **APENAS Lógica de Negócio & APIs**  
- Database_Architect: **APENAS Camada de Dados**
- DevOps_Deploy: **APENAS Infraestrutura**
- Debugger_QA: **APENAS Testes & Análise**
- Orchestrator: **APENAS Coordenação**

### 2. Sem Violações de Limites

**Agentes NÃO DEVEM:**
- Tomar decisões fora de seu domínio
- Implementar features no domínio de outro agente
- Sobrescrever decisões de outro agente
- Pular coordenação através do Orchestrator para conflitos

### 3. Toda Comunicação Através do Orchestrator

**Para decisões importantes:**
- Agentes reportam ao Orchestrator
- Orchestrator toma decisões transversais
- Orchestrator delega para o agente apropriado
- Orchestrator resolve conflitos

## Protocolos de Comunicação

###  Atribuição de Solicitação

**De:** Orchestrator  
**Para:** Qualquer Agente  
**Formato:**
```markdown
Agente: [Nome do Agente]
Tarefa: [Descrição clara da tarefa]
Contexto: [Por que isso é necessário]
Dependências: [O que deve ser feito primeiro]
Entregas: [Saídas esperadas]
Critérios de Aceitação: [Medidas de sucesso]
Prazo: [Quando é necessário]
```

### Atualização de Progresso

**De:** Qualquer Agente  
**Para:** Orchestrator  
**Formato:**
```markdown
Status: [No Prazo / Em Risco / Bloqueado]
Progresso: [O que foi completado]
Trabalho Atual: [No que está trabalhando]
Próximos Passos: [O que vem a seguir]
Bloqueadores: [Quaisquer problemas impedindo progresso]
ETA: [Conclusão esperada]
```

### Transferência de Entrega

**De:** Agente Fornecedor  
**Para:** Agente Receptor (via Orchestrator)  
**Formato:**
```markdown
De: [Agente Fornecedor]
Para: [Agente Receptor]
Entrega: [O que está sendo fornecido]
Descrição: [Detalhes da entrega]
Como Usar: [Instruções para o agente receptor]
Dependências: [O que isso requer]
Documentação: [Link para docs]
```

### Consulta/Solicitação

**De:** Qualquer Agente  
**Para:** Outro Agente (via Orchestrator se transversal)  
**Formato:**
```markdown
De: [Agente Solicitante]
Para: [Agente Alvo]
Pergunta: [Pergunta clara]
Contexto: [Por que você precisa disso]
Urgência: [Baixa / Média / Alta]
```

### Escalação

**De:** Qualquer Agente  
**Para:** Orchestrator  
**Quando:** Bloqueado, conflito ou problema de limite  
**Formato:**
```markdown
Problema: [Descrição do problema]
Impacto: [Como isso afeta o trabalho]
Soluções Tentadas: [O que você tentou]
Ação Recomendada: [Sua sugestão]
Urgência: [Baixa / Média / Alta / Crítica]
```

## Matriz de Interação de Agentes

| De ↓ Para → | Frontend | Backend | Database | DevOps | QA | Orchestrator |
|-------------|----------|---------|----------|--------|----|--------------| 
| **Frontend** | ✅ | ⚠️ Contrato API | ❌ | ❌ | ⚠️ Relatórios de bug | ✅ |
| **Backend** | ⚠️ Contrato API | ✅ | ⚠️ Repositório | ⚠️ Vars amb | ⚠️ Relatórios de bug | ✅ |
| **Database** | ❌ | ⚠️ Repositório | ✅ | ⚠️ Backups | ❌ | ✅ |
| **DevOps** | ❌ | ⚠️ Necessidades infra | ⚠️ Hospedagem DB | ✅ | ⚠️ Logs | ✅ |
| **QA** | ⚠️ Relatórios de bug | ⚠️ Relatórios de bug | ⚠️ Problemas dados | ⚠️ Problemas infra | ✅ | ✅ |
| **Orchestrator** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legenda:**
- ✅ Comunicação direta permitida
- ⚠️ Coordenação necessária (troca específica de dados)
- ❌ Comunicação não permitida (vá através do Orchestrator)

## Cenários de Coordenação

### Cenário 1: Coordenação de Contrato de API

**Situação:** Frontend precisa consumir API do Backend

**Protocolo:**
1. Backend_Core projeta endpoint de API
2. Backend_Core documenta contrato de API:
   - URL do endpoint
   - Método HTTP
   - Schema do corpo da requisição
   - Schema da resposta
   - Códigos de erro
3. Backend_Core fornece contrato ao Orchestrator
4. Orchestrator repassa para Frontend_UI_UX
5. Frontend_UI_UX implementa código cliente usando contrato

### Cenário 2: Coordenação de Schema de Banco de Dados

**Situação:** Backend precisa acessar nova tabela de banco de dados

**Protocolo:**
1. Backend_Core solicita schema do Database_Architect
2. Database_Architect projeta schema e migration
3. Database_Architect fornece interface de repositório
4. Backend_Core implementa lógica de negócio usando interface

### Cenário 3: Resolução de Conflitos

**Situação:** Frontend quer estrutura aninhada, Backend prefere estrutura plana

**Protocolo:**
1. Frontend_ UI_UX solicita estrutura aninhada do Orchestrator
2. Backend_Core prefere estrutura plana (reporta ao Orchestrator)
3. Orchestrator avalia ambas abordagens
4. Orchestrator toma decisão baseado em:
   - Implicações de performance
   - Convenções do projeto
   - Necessidades do cliente
5. Orchestrator comunica decisão para ambos agentes

### Cenário 4: Coordenação de Correção de Bug

**Situação:** QA encontra bug, precisa de agente apropriado para corrigir

**Protocolo:**
1. Debugger_QA identifica bug e causa raiz
2. Debugger_QA propõe correção ao Orchestrator
3. Orchestrator atribui ao agente responsável
4. Agente implementa correção
5. Debugger_QA verifica correção

## Aplicação de Limites

### Exemplos de Violações de Limites (PARE ESTAS)

#### ❌ Frontend Implementando Lógica de Validação
```typescript
// ❌ ERRADO: Frontend validando regras de negócio
function submitOrder() {
  if (cart.total < 10) {
    alert("Pedido mínimo é R$10");
    return;
  }
  // ...
}
```

**Abordagem correta:** Backend aplica regras de negócio, Frontend apenas mostra feedback.

#### ❌ Backend Decidindo Layout de UI
```typescript
// ❌ ERRADO: Backend retornando instruções de UI
return {
  user: { name: "João" },
  ui: { showWelcomeModal: true } // Decisão de UI
}
```

**Abordagem correta:** Backend retorna dados, Frontend decide apresentação.

#### ❌ QA Implementando Correções
```typescript
// ❌ ERRADO: Agente QA modificando código para corrigir bug
function login() {
  // QA encontrou bug e "corrigiu" diretamente
}
```

**Abordagem correta:** QA identifica e propõe, agente responsável implementa.

### Como Orchestrator Aplica Limites

**Quando Frontend tenta implementar lógica de negócio:**
> "Lógica de validação pertence ao Backend_Core. Frontend deve apenas exibir feedback de validação da resposta da API."

**Quando Backend tenta decidir layout de UI:**
> "Decisões de UI pertencem ao Frontend_UI_UX. Backend deve fornecer dados, não instruções de apresentação."

**Quando QA tenta implementar uma correção:**
> "QA identifica problemas e propõe correções. Implementação pertence ao agente responsável (neste caso, Backend_Core)."

## Melhores Práticas

### 1. Transferências Claras
- Sempre documente o que está fornecendo
- Inclua instruções de uso
- Especifique dependências

### 2. Contratos Explícitos
- Contratos de API antes da implementação
- Definições de schema antes do código backend
- Mockups de design antes do código frontend

### 3. Atualizações Regulares de Status
- Atualize Orchestrator sobre progresso
- Reporte bloqueadores imediatamente
- Comunique mudanças de ETA

### 4. Coordenação Respeitosa
- Pergunte, não exija
- Explique contexto e raciocínio
- Esteja aberto a feedback

### 5. Escale Cedo
- Não deixe bloqueadores apodrecerem
- Escale conflitos para o Orchestrator
- Proponha soluções ao escalar

## Resumo

**Regras de Ouro:**
1. ✅ **Fique na sua raia** - Respeite limites de domínio
2. ✅ **Coordene cedo** - Não faça suposições
3. ✅ **Escale conflitos** - Deixe o Orchestrator decidir
4. ✅ **Documente tudo** - Transferências claras previnem confusão
5. ✅ **Teste completamente** - Qualidade é responsabilidade de todos

**Lembre-se:** O kit tem sucesso quando os agentes trabalham juntos harmoniosamente, cada um excelente em seu domínio, coordenados pelo Orchestrator.
