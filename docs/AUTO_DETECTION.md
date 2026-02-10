# Detecção Automática de Agentes

## O Problema

Em sistemas multi-agente tradicionais, o usuário precisa constantemente especificar qual agente usar:

```
❌ "@Frontend por favor crie um botão"
❌ "/backend adicione validação de email"
❌ "@Database crie uma tabela de usuários"
```

Isso quebra o fluxo natural de trabalho e adiciona fricção desnecessária.

## A Solução

O **Kit de Agentes Antigravity** implementa detecção automática baseada em contexto. O usuário simplesmente descreve o que precisa, e o sistema ativa o agente certo automaticamente.

```
✅ "Crie um botão de login"
   → Frontend_UI_UX ativado automaticamente

✅ "Adicione validação de email"  
   → Backend_Core ativado automaticamente

✅ "Preciso armazenar histórico de pedidos"
   → Database_Architect ativado automaticamente
```

## Como Usar

### 1. Fale Naturalmente

Simplesmente descreva o que você precisa:

```
Usuário: "O modal de confirmação está cortado no mobile"
```

O sistema analisará automaticamente:
- Palavras-chave: "modal", "mobile"
- Contexto: Problema de UI
- Agente apropriado: Frontend_UI_UX

### 2. Sistema Transparente

Você será informado qual agente foi ativado:

```
✅ Contexto detectado: Frontend UI
🤖 Ativando: Frontend_UI_UX

[Frontend_UI_UX]: Analisando o componente Modal...
Identifiquei que o problema está no overflow do container...
```

### 3. Trabalho Automático

O agente certo trabalha na solução sem necessidade de mais comandos.

## Indicadores de Contexto

O sistema usa vários sinais para detectar qual agente ativar:

### 📝 Palavras-Chave

```
"componente", "botão", "página" → Frontend_UI_UX
"API", "endpoint", "validação" → Backend_Core  
"tabela", "query", "migration" → Database_Architect
"deploy", "produção", "erro em prod" → DevOps_Deploy
"bug", "erro", "não funciona" → Debugger_QA
```

### 📂 Arquivos Abertos

```
LoginButton.tsx → Frontend_UI_UX
auth.service.ts → Backend_Core
schema.prisma → Database_Architect
vercel.json → DevOps_Deploy
auth.test.ts → Debugger_QA
```

### 🎯 Tipo de Operação

```
"criar componente" → Frontend_UI_UX
"adicionar lógica" → Backend_Core
"otimizar query" → Database_Architect
"configurar CI/CD" → DevOps_Deploy  
"testar" → Debugger_QA
```

## Exemplos Práticos

### Exemplo 1: Problema de UI

```
Usuário: "O botão de submit está muito pequeno no iPhone"

Detecção automática:
- Palavra-chave: "botão" ✓
- Arquivo aberto: Button.tsx ✓
- Domínio: Frontend

🤖 Frontend_UI_UX ativado

Solução:
- Analisa componente Button
- Identifica problema de responsividade
- Aplica skill: review_ui_accessibility
- Corrige dimensões para touch targets
```

### Exemplo 2: Problema de API

```
Usuário: "O login retorna erro 401 mesmo com credenciais corretas"

Detecção automática:
- Palavra-chave: "erro", "login" ✓
- Tipo: Bug de autenticação ✓
- Domínio: Backend

🤖 Debugger_QA investiga, Backend_Core corrige

Solução:
- QA analisa logs
- Identifica problema em validação de token
- Backend corrige lógica de auth
- QA verifica correção
```

### Exemplo 3: Feature Completa

```
Usuário: "Preciso criar um sistema de comentários nos posts"

Detecção automática:
- Múltiplos domínios detectados ✓
- Feature end-to-end ✓

🤖 Orchestrator assume coordenação

Coordenação:
1. Database_Architect cria tabela comments
2. Backend_Core cria API de comentários
3. Frontend_UI_UX cria componente de comentários
4. Debugger_QA testa tudo
5. DevOps_Deploy faz deploy
```

## Quando o Sistema Escolhe Cada Agente

### Frontend_UI_UX

```
✅ "O menu dropdown não fecha ao clicar fora"
✅ "Adicionar animação de fade-in na galeria"
✅ "Tornar o formulário responsivo"
✅ "Melhorar acessibilidade do header"
```

### Backend_Core

```
✅ "Validar CPF antes de salvar usuário"
✅ "Adicionar rate limiting na API de login"
✅ "Integrar com API de pagamento do Stripe"
✅ "Implementar refresh token JWT"
```

### Database_Architect

```
✅ "Armazenar histórico de preços dos produtos"
✅ "A busca de produtos está muito lenta"
✅ "Criar relacionamento entre pedidos e itens"
✅ "Preciso de uma migration para adicionar coluna deleted_at"
```

### DevOps_Deploy

```
✅ "Como configurar variável de ambiente no Vercel?"
✅ "O build está falhando no GitHub Actions"
✅ "Configurar domínio customizado"
✅ "Monitorar taxa de erro em produção"
```

### Debugger_QA

```
✅ "Upload de imagem está retornando erro 500"
✅ "Como testar o fluxo de checkout?"
✅ "Debugar por que o email não está sendo enviado"
✅ "Investigar erro no console do navegador"
```

## Casos Especiais

### Solicitações Ambíguas

Se a solicitação não deixa claro qual agente usar:

```
Usuário: "Melhorar a performance da listagem"

Orchestrator analisa:
- Pode ser frontend (renderização)
- Pode ser backend (API)
- Pode ser database (query)

🤖 Orchestrator pergunta:
"A lentidão está no carregamento inicial (backend/database) 
ou na renderização da lista (frontend)?"
```

### Override Manual

Você sempre pode especificar manualmente:

```
@Frontend_UI_UX por favor analise o componente
```

Isso sobrescreve a detecção automática.

## Configuração

### Habilitar Auto-Detecção

A auto-detecção está **habilitada por padrão** no Kit de Agentes Antigravity.

Para confirmar, verifique que `config/auto_agent_detection.md` existe no seu projeto.

### Ajustar Sensibilidade

Se a detecção estiver ativando o agente errado frequentemente, você pode:

1. Revisar `config/auto_agent_detection.md`
2. Ajustar palavras-chave para seu domínio específico
3. Adicionar padrões de arquivo específicos do projeto

### Desabilitar (Não Recomendado)

Se preferir modo manual:

1. Remova `config/auto_agent_detection.md`
2. Sempre use @ ou / para especificar agentes

## Benefícios

### ⚡ Produtividade

Sem fricção — você fala, o sistema age.

### 🧠 Inteligência

O sistema aprende com contexto de arquivos, histórico e padrões.

### 🎯 Precisão

Múltiplos sinais garantem seleção correta do agente.

### 🔄 Flexibilidade

Você sempre pode sobrescrever manualmente quando necessário.

## Limitações

### Múltiplos Agentes Plausíveis

Se a solicitação genuinamente envolve vários agentes:

```
"O formulário de cadastro não salva no banco"

Pode ser:
- Frontend: formulário não envia dados
- Backend: API não processa
- Database: constraint bloqueia insert

Orchestrator coordenará investigação com múltiplos agentes.
```

### Contexto Insuficiente

Se você apenas diz "corrija isso" sem contexto:

```
Usuário: "corrija isso"

Sistema: "Preciso de mais contexto. O que exatamente precisa ser corrigido?"
```

## Resumo

Com detecção automática de agentes:

✅ **Fale naturalmente** — sem comandos especiais  
✅ **Sistema inteligente** — escolhe agente certo  
✅ **Transparente** — você sabe quem está trabalhando  
✅ **Produtivo** — sem fricção no workflow  

O Kit de Agentes Antigravity trabalha **para você**, não o contrário.
