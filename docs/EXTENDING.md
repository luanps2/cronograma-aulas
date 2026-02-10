# Estendendo o Kit de Agentes

## Visão Geral

O Kit de Agentes Antigravity é projetado para ser extensível. Você pode adicionar agentes, skills e workflows customizados para atender às necessidades específicas do seu projeto.

## Adicionando um Agente Customizado

### 1. Criar Diretório do Agente

```bash
mkdir -p .agent/agents/seu_nome_de_agente
```

### 2. Criar AGENT.md

```bash
touch .agent/agents/seu_nome_de_agente/AGENT.md
```

### 3. Definir Estrutura do Agente

Use este template para `AGENT.md`:

```markdown
---
name: Seu_Nome_De_Agente
description: Breve descrição do que este agente faz
role: Título do papel especialista
responsibility_level: Área de domínio
---

# Nome do Seu Agente

## Identidade

Você é um **[Papel Especialista]** com expertise em [áreas de domínio].

## Responsabilidades Principais

### ✅ VOCÊ É RESPONSÁVEL POR:

- Responsabilidade 1
- Responsabilidade 2  
- Responsabilidade 3

### ❌ VOCÊ NÃO É RESPONSÁVEL POR:

- O que este agente NÃO deve fazer
- Outros limites

## Protocolo de Comunicação

### Ao Iniciar Trabalho
[Como o agente recebe atribuições]

### Ao Colaborar  
[Como o agente trabalha com outros]

### Ao Completar Trabalho
[O que o agente entrega]

## Skills Que Você Pode Usar

- `skill_nome_1`
- `skill_nome_2`

## Padrões de Qualidade

[O que define qualidade para o trabalho deste agente]

## Lembre-se

[Princípios-chave para este agente]
```

### 4. Atualizar o Orchestrator

Adicione seu agente customizado à matriz de delegação do Orchestrator em `.agent/agents/orchestrator/AGENT.md`.

## Adicionando uma Skill Customizada

### 1. Criar Diretório da Skill

```bash
mkdir -p .agent/skills/sua_skill_nome
```

### 2. Criar SKILL.md

```bash
touch .agent/skills/sua_skill_nome/SKILL.md
```

### 3. Definir Estrutura da Skill

Use este template para `SKILL.md`:

```markdown
---
name: sua_skill_nome
description: O que esta skill faz
category: frontend|backend|database|devops|qa
agent_affinity: qual_agente_usa_isto
---

# Nome da Sua Skill

## Propósito

Que problema esta skill resolve.

## Quando Usar

Situações onde esta skill é apropriada.

## Pré-requisitos

O que deve estar em vigor antes de usar esta skill.

## Processo Passo a Passo

### 1. Primeiro Passo

[Instruções detalhadas]

**Checklist:**
- [ ] Item 1
- [ ] Item 2

### 2. Segundo Passo

[Instruções detalhadas]

### 3. Terceiro Passo

[Instruções detalhadas]

## Entregas

O que esta skill produz quando completa.

## Melhores Práticas

Dicas para usar esta skill efetivamente.

## Skills Relacionadas

- `skill_relacionada_1`
- `skill_relacionada_2`
```

### 4. Adicionar Materiais de Suporte (Opcional)

Adicione exemplos, templates ou scripts:

```bash
mkdir .agent/skills/sua_skill_nome/examples
mkdir .agent/skills/sua_skill_nome/templates
mkdir .agent/skills/sua_skill_nome/scripts
```

## Adicionando um Workflow Customizado

### 1. Criar Arquivo de Workflow

```bash
touch .agent/workflows/seu_workflow.md
```

### 2. Definir Estrutura do Workflow

Use este template:

```markdown
---
description: Breve descrição do que este workflow alcança
---

# Nome do Seu Workflow

## Visão Geral

[Descrição de alto nível do workflow]

## Etapas do Workflow

### 1. Nome da Etapa (Nome do Agente)

**Responsabilidades:**
- O que este agente faz nesta etapa

**Entregas:**
- O que esta etapa produz

**Coordenação:**
- Como esta etapa interage com outras etapas

---

### 2. Próxima Etapa (Nome do Agente)

[Continue o padrão]

---

## Fluxo de Comunicação

```
[Diagrama ASCII mostrando o fluxo]
```

## Exemplo

[Exemplo do mundo real deste workflow]

## Dicas para Sucesso

[Melhores práticas para este workflow]

## Workflows Relacionados

- `workflow_relacionado_1.md`
```

## Exemplos

### Exemplo: Agente Customizado para Documentação de API

**Agente:** `api_documenter`

```markdown
---
name: API_Documenter
description: Especialista em criar documentação abrangente de API
role: Especialista em Documentação de API
responsibility_level: Documentação
---

# Agente Documentador de API

## Responsabilidades Principais

### ✅ VOCÊ É RESPONSÁVEL POR:

- Criar especificações OpenAPI/Swagger
- Escrever guias de uso de API
- Gerar documentação de referência de API
- Criar exemplos de requisições/respostas
- Manter changelog para versões de API

### ❌ VOCÊ NÃO É RESPONSÁVEL POR:

- Implementar endpoints de API (isso é Backend_Core)
- Testar APIs (isso é Debugger_QA)
- Fazer deploy de documentação (isso é DevOps_Deploy)

## Skills Que Você Pode Usar

- `generate_openapi_spec`
- `create_api_examples`
- `update_changelog`
```

### Exemplo: Skill Customizada para Seed de Banco de Dados

**Skill:** `seed_database`

```markdown
---
name: seed_database
description: Popular banco de dados com dados iniciais ou de teste
category: database
agent_affinity: database_architect
---

# Skill de Seed de Banco de Dados

## Propósito

Criar dados seed para desenvolvimento, testes ou configuração inicial de produção.

## Processo Passo a Passo

### 1. Definir Dados Seed

Criar arquivo de dados seed:

\`\`\`typescript
// seeds/users.ts
export const users = [
  { email: 'admin@example.com', role: 'admin' },
  { email: 'user@example.com', role: 'user' },
];
\`\`\`

### 2. Criar Script de Seed

\`\`\`typescript
// seeds/run.ts
import { users } from './users';

async function seed() {
  await db.users.createMany({ data: users });
}
\`\`\`

### 3. Executar Seed

\`\`\`bash
npm run db:seed
\`\`\`

## Melhores Práticas

- Use dados realistas
- Torne seeds idempotentes
- Não use seed de dados sensíveis em produção
```

### Exemplo: Workflow Customizado para Feature Flags

**Workflow:** `deploy_with_feature_flags.md`

```markdown
---
description: Deploy de features através de feature flags para rollout gradual
---

# Deploy com Feature Flags

## Etapas do Workflow

### 1. Implementação de Feature (Backend_Core)

Implementar feature por trás de feature flag:

\`\`\`typescript
if (featureFlags.isEnabled('new-profile')) {
  // Código da nova feature
} else {
  // Código antigo
}
\`\`\`

### 2. Implementação Frontend (Frontend_UI_UX)

Consumir feature flag:

\`\`\`typescript
const { isEnabled } = useFeatureFlag('new-profile');

{isEnabled && <NewProfileComponent />}
{!isEnabled && <OldProfileComponent />}
\`\`\`

### 3. Deploy com Flag Desabilitada (DevOps_Deploy)

Fazer deploy para produção com flag desabilitada.

### 4. Rollout Gradual (DevOps_Deploy)

- Habilitar para 5% dos usuários
- Monitorar métricas
- Aumentar para 25%, 50%, 100%

### 5. Remover Flag (Backend_Core + Frontend_UI_UX)

Após rollout completo, remover código da flag.
```

## Melhores Práticas de Integração

### 1. Siga Padrões Existentes

- Estude agentes/skills/workflows existentes
- Corresponda à estrutura e formato
- Use linguagem e tom similares

### 2. Mantenha os Limites

- Agentes customizados devem ter responsabilidades claras e sem sobreposição
- Não crie agentes que dupliquem os existentes
- Certifique-se de que as skills sejam focadas em uma única tarefa

### 3. Documente Completamente

- Documentação clara e abrangente
- Inclua exemplos
- Explique quando usar (e quando não usar)

### 4. Teste Antes de Comitar

- Valide que agentes customizados funcionam como esperado
- Teste skills customizadas de ponta a ponta
- Percorra workflows customizados

### 5. Mantenha Simples

- Não complique demais
- Um agente/skill/workflow por arquivo
- Foque em reusabilidade

## Compartilhando Suas Extensões

Se você criar agentes, skills ou workflows customizados valiosos:

1. Documente-os bem
2. Teste completamente
3. Considere contribuir de volta ao kit principal
4. Compartilhe com a comunidade

## Suporte

Para dúvidas sobre estender o kit:
1. Revise agentes/skills/workflows existentes como exemplos
2. Verifique [COMMUNICATION_PATTERNS.md](COMMUNICATION_PATTERNS.md) para integração
3. Abra uma discussão no GitHub
