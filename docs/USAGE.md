# Guia de Uso

## Visão Geral

Este guia mostra como usar efetivamente o Kit de Agentes Antigravity em seus projetos.

## Trabalhando com Agentes

### Entendendo os Papéis dos Agentes

Cada agente tem um papel e responsabilidade específicos:

| Agente | O Que Fazem | O Que NÃO Fazem |
|--------|-------------|-----------------|
| **Frontend_UI_UX** | Componentes UI, design, acessibilidade | Lógica de negócio, APIs, banco de dados |
| **Backend_Core** | Lógica de negócio, APIs, autenticação | Design de UI, schema de banco de dados |
| **Database_Architect** | Design de schema, migrations | APIs, UI, deployment |
| **DevOps_Deploy** | Deployment, infraestrutura | Alterações no código da aplicação |
| **Debugger_QA** | Testes, identificação de bugs | Implementar correções |
| **Orchestrator** | Coordenação, delegação | Implementação direta |

### Invocando um Agente

Para trabalhar com um agente, leia seu arquivo de definição:

```bash
# Visualize a definição do agente Frontend_UI_UX
cat .agent/agents/frontend_ui_ux/AGENT.md
```

Isso mostra:
- Responsabilidades do agente
- Skills que pode usar
- Protocolos de comunicação
- Padrões de qualidade

## Usando Skills

### Encontrando a Skill Certa

As skills são organizadas por categoria:

- **Frontend**: `create_component`, `review_ui_accessibility`
- **Backend**: `create_api_endpoint`, `validate_auth_flow`, `review_security`
- **Database**: `design_database_schema`, `run_migration`
- **DevOps**: `setup_deploy`
- **QA**: `analyze_error_logs`, `propose_fix`

### Aplicando uma Skill

```bash
# Leia a documentação da skill
cat .agent/skills/create_component/SKILL.md
```

Siga o processo passo a passo na documentação da skill.

### Exemplo: Criando um Componente

```markdown
Usando skill: create_component

1. Definir API do componente (props, variantes)
2. Criar estrutura do componente
3. Implementar lógica
4. Estilizar com CSS
5. Garantir acessibilidade
6. Adicionar documentação
7. Escrever testes
```

## Seguindo Workflows

### Workflows Padrão

O kit fornece três workflows padrão:

1. **Criar Feature** (`create_feature.md`) - Desenvolvimento completo de feature
2. **Corrigir Bug** (`fix_bug.md`) - Processo de resolução de bugs
3. **Deploy de Release** (`deploy_release.md`) - Deployment em produção

### Usando um Workflow

```bash
# Leia o workflow
cat .agent/workflows/create_feature.md
```

Siga os passos numerados, coordenando com os agentes apropriados.

### Exemplo: Workflow de Criar Feature

```
Solicitação: "Adicionar perfil de usuário com upload de avatar"

Passo 1 (Orchestrator):
- Dividir em tarefas de database, backend, frontend, infra
- Identificar dependências

Passo 2 (Database_Architect):
- Criar tabela de perfis (user_id FK, bio, avatar_url)
- Scripts de migration

Passo 3 (Backend_Core):
- POST /api/profile (criar/atualizar perfil)
- POST /api/profile/avatar (upload de avatar para S3)
- GET /api/profile/:userId

Passo 4 (DevOps_Deploy, paralelo):
- Configurar bucket S3 para avatares
- Configurar CDN

Passo 5 (Frontend_UI_UX):
- Página de edição de perfil com textarea de bio
- Componente de upload de avatar com preview
- Componente de exibição de perfil

Passo 6 (Debugger_QA):
- Testar criação de perfil
- Testar upload de avatar (vários tipos e tamanhos)
- Testar tratamento de erros
- Verificar acessibilidade

Passo 7 (DevOps_Deploy):
- Deploy para staging → testar → deploy para produção

Passo 8 (Orchestrator):
- Verificar todos os critérios atendidos
- Reportar ao usuário: "Feature de perfil de usuário implantada ✅"
```

## Padrões de Comunicação

### Comunicação de Agente para Agente

Os agentes se comunicam através de protocolos bem definidos (veja [COMMUNICATION_PATTERNS.md](COMMUNICATION_PATTERNS.md)):

**Comunicação Direta (Permitida):**
- Backend → Frontend: Contratos de API
- Database → Backend: Interfaces de repositório
- QA → Qualquer Agente: Relatórios de bugs

**Via Orchestrator (Obrigatório):**
- Decisões conflitantes
- Questões transversais
- Mudanças arquiteturais importantes

### Exemplo: Backend Fornece Contrato de API para Frontend

```markdown
De: Backend_Core
Para: Frontend_UI_UX (via Orchestrator)
Entrega: Contrato de API de Perfil

GET /api/profile/:userId
Autorização: Bearer token
Resposta: { id, name, email, avatarUrl, bio }
```

O Frontend então implementa usando este contrato.

## Melhores Práticas

### 1. Comece com o Orchestrator

Sempre inicie com o agente Orchestrator para:
- Analisar requisitos
- Dividir tarefas
- Coordenar agentes

### 2. Respeite os Limites

**Nunca** faça um agente executar trabalho fora de seu domínio:
- ❌ Frontend implementando validação de negócio
- ❌ Backend decidindo layouts de UI
- ❌ QA implementando correções diretamente

### 3. Use Skills Apropriadamente

Skills são ferramentas para agentes. Use apenas skills relevantes ao domínio do agente:
- Frontend usa: `create_component`, `review_ui_accessibility`
- Backend usa: `create_api_endpoint`, `review_security`
- Database usa: `design_database_schema`, `run_migration`

### 4. Siga os Workflows

Não pule etapas nos workflows. Eles são projetados para garantir qualidade e prevenir problemas.

### 5. Documente Transferências

Ao passar trabalho entre agentes, sempre forneça:
- Descrição clara
- Instruções de uso
- Dependências
- Exemplos

## Cenários Comuns

### Cenário 1: Adicionando uma Nova Feature

```
1. Leia: workflows/create_feature.md
2. Siga passo a passo
3. Coordene agentes conforme descrito
4. Entregue a feature ✅
```

### Cenário 2: Corrigindo um Bug

```
1. Leia: workflows/fix_bug.md
2. QA investiga com analyze_error_logs
3. QA propõe correção
4. Agente responsável implementa
5. QA verifica
6. DevOps faz deploy ✅
```

### Cenário 3: Deploy em Produção

```
1. Leia: workflows/deploy_release.md
2. Todos os agentes validam prontidão
3. Deploy para staging
4. Testes completos
5. Deploy para produção
6. Monitoramento ✅
```

## Dicas para Sucesso

### Para o Orchestrator
- Divida o trabalho claramente
- Delegue para os agentes certos
- Resolva conflitos decisivamente
- Valide entregas

### Para Agentes Especialistas
- Permaneça dentro do seu domínio
- Comunique claramente
- Documente entregas
- Peça ajuda quando necessário

### Para Todos os Agentes
- Leia as definições dos agentes cuidadosamente
- Siga os protocolos de comunicação
- Use skills apropriadas
- Respeite os limites

## Solução de Problemas

### Problema: Agentes pisando nos pés uns dos outros

**Solução:** Revise [COMMUNICATION_PATTERNS.md](COMMUNICATION_PATTERNS.md) e reforce os limites.

### Problema: Responsabilidades não claras

**Solução:** Leia o arquivo AGENT.md do agente específico para responsabilidades detalhadas.

### Problema: Workflow não funcionando

**Solução:** Certifique-se de que todas as etapas pré-requisitos foram completadas antes de mover para o próximo passo.

## Próximos Passos

- Revise [COMMUNICATION_PATTERNS.md](COMMUNICATION_PATTERNS.md) para regras de interação
- Confira [EXTENDING.md](EXTENDING.md) para adicionar agentes/skills customizados
- Explore `examples/` para implementações do mundo real

## Suporte

Para dúvidas:
1. Verifique a documentação do agente/skill primeiro
2. Revise os padrões de comunicação
3. Abra uma issue no GitHub
