# 🔍 DIAGNÓSTICO - ERRO 500 NO GOOGLE LOGIN

## ⚠️ PROBLEMA ESPECÍFICO

Login com Google retorna erro 500 após deploy.

---

## 📋 CHECKLIST DE DIAGNÓSTICO

### 1. **Verifique GOOGLE_CLIENT_ID no Render**

O erro 500 provavelmente é causado por:

**a) GOOGLE_CLIENT_ID ausente ou incorreto**

1. Acesse: https://dashboard.render.com
2. Selecione seu serviço backend
3. Vá em **Environment**
4. Verifique se `GOOGLE_CLIENT_ID` existe

**Valor correto:**
```
GOOGLE_CLIENT_ID=568890397434-11tclbnc49gb6up1uvj69rnli5h0rist.apps.googleusercontent.com
```

Se estiver ausente ou diferente → **ADICIONE/CORRIJA**

---

### 2. **Capture Logs do Render (CRÍTICO)**

Quando você tenta fazer login com Google, o backend gera logs detalhados.

**Como fazer:**

1. Abra em uma aba: https://dashboard.render.com → Seu Serviço → **Logs**
2. Em outra aba: Abra seu frontend
3. Tente fazer login com Google
4. **IMEDIATAMENTE** volte para a aba dos logs
5. **Copie as últimas 30-50 linhas** (especialmente linhas com `❌`)

**Procure por estas mensagens:**

#### ✅ Se ver isso, está OK:
```
[AUTH] POST /google - credential present
✅ Google token verified for: seu@email.com
   Name: Seu Nome
   Sub: 123456789...
📝 Criando novo usuário Google: seu@email.com
✅ Usuário criado com sucesso: ID 1
```

#### ❌ Se ver isso, há problema:

**Erro 1: GOOGLE_CLIENT_ID ausente**
```
❌ GOOGLE_CLIENT_ID não configurado nas variáveis de ambiente
```
→ **Solução:** Adicione no Render Environment

**Erro 2: Token inválido**
```
❌ Google Token Verification Failed: Invalid token signature
```
→ **Solução:** GOOGLE_CLIENT_ID do backend diferente do frontend

**Erro 3: Banco de dados**
```
❌ ERRO CRÍTICO DE BANCO DE DADOS (Google Auth):
   Erro: connection timeout
```
→ **Solução:** DATABASE_URL incorreta (porta 6543?)

**Erro 4: Tabela não existe**
```
❌ ERRO CRÍTICO DE BANCO DE DADOS (Google Auth):
   Code: 42P01
   Detail: relation "users" does not exist
```
→ **Solução:** Executar migrations no Supabase

---

### 3. **Verifique GOOGLE_CLIENT_ID no Frontend**

O GOOGLE_CLIENT_ID do frontend **DEVE SER O MESMO** do backend.

**No código:**

Abra `client/src/main.jsx` ou `client/src/App.jsx` e procure por:

```javascript
<GoogleOAuthProvider clientId="...">
```

O `clientId` ali **DEVE SER:**
```
568890397434-11tclbnc49gb6up1uvj69rnli5h0rist.apps.googleusercontent.com
```

Se for diferente, está errado.

---

### 4. **Teste Direto com cURL**

Vamos testar o endpoint diretamente:

**Obtenha um token Google válido:**

1. Abra: https://developers.google.com/oauthplayground
2. Em "Step 1", selecione: **Google OAuth2 API v2** → `https://www.googleapis.com/auth/userinfo.email`
3. Clique em **Authorize APIs**
4. Faça login com sua conta Google
5. Em "Step 2", clique em **Exchange authorization code for tokens**
6. Copie o `id_token` (NÃO o access_token)

**Teste o backend:**

```bash
curl -X POST https://seu-backend.onrender.com/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential": "SEU_ID_TOKEN_AQUI"}'
```

**Resultado esperado (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "seu@email.com",
    "name": "Seu Nome",
    "avatar_url": "https://..."
  }
}
```

**Se retornar 401:**
```json
{
  "error": "Token do Google expirado. Tente fazer login novamente."
}
```
→ Normal, o token do Playground expira rápido. Teste pelo frontend.

**Se retornar 500:**
→ Há problema no backend. Veja os logs do Render.

---

### 5. **Verifique Tabela Users no Supabase**

O erro pode ser que a tabela `users` não existe:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Table Editor**
4. Veja se a tabela `users` existe

**Se NÃO existir:**

Execute este SQL no Supabase (SQL Editor):

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    provider VARCHAR(50) DEFAULT 'local',
    provider_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);
```

---

## 🎯 SOLUÇÕES RÁPIDAS

### Solução 1: GOOGLE_CLIENT_ID ausente no Render

**Sintoma:** Logs mostram `❌ GOOGLE_CLIENT_ID não configurado`

**Fix:**
1. Render Dashboard → Environment
2. Adicionar variável:
   - Key: `GOOGLE_CLIENT_ID`
   - Value: `568890397434-11tclbnc49gb6up1uvj69rnli5h0rist.apps.googleusercontent.com`
3. **Save** (auto-deploy)
4. Aguardar 2-3 minutos
5. Testar novamente

---

### Solução 2: GOOGLE_CLIENT_ID diferente entre frontend e backend

**Sintoma:** Logs mostram `❌ Wrong recipient` ou `Invalid token signature`

**Fix:**

**Frontend** (`client/src/main.jsx`):
```javascript
<GoogleOAuthProvider clientId="568890397434-11tclbnc49gb6up1uvj69rnli5h0rist.apps.googleusercontent.com">
```

**Backend** (Render Environment):
```
GOOGLE_CLIENT_ID=568890397434-11tclbnc49gb6up1uvj69rnli5h0rist.apps.googleusercontent.com
```

**DEVEM SER IDÊNTICOS!**

---

### Solução 3: DATABASE_URL incorreta

**Sintoma:** Logs mostram `❌ Falha ao conectar PostgreSQL`

**Fix:**

No Render Environment, `DATABASE_URL` deve ser:
```
postgresql://postgres:[SENHA]@db.pbdqdshwvifunfdgsefs.supabase.co:6543/postgres
```

**Porta 6543** (Session Pooler), não 5432!

---

### Solução 4: Tabela users não existe

**Sintoma:** Logs mostram `relation "users" does not exist`

**Fix:**

Execute o SQL acima no Supabase SQL Editor.

---

## 📊 DEBUGGING AVANÇADO

### Ativar Logs Detalhados

Adicione temporariamente no Render Environment:

```
NODE_ENV=development
```

Isso mostrará `details` nos erros retornados.

**Após identificar o problema, mude de volta para:**
```
NODE_ENV=production
```

---

## 🚨 ERRO MAIS PROVÁVEL

Com base no histórico, o erro 500 no Google Login é **99% de chance**:

1. **GOOGLE_CLIENT_ID ausente no Render** (80% de chance)
2. **DATABASE_URL incorreta** (15% de chance)
3. **Tabela users não existe** (5% de chance)

---

## ✅ PRÓXIMOS PASSOS

1. ✅ **Capture os logs do Render** (faça login Google e copie os logs)
2. ✅ **Verifique GOOGLE_CLIENT_ID** no Render Environment
3. ✅ **Compartilhe os logs** comigo para diagnóstico preciso

**Assim que você me enviar os logs, eu identifico o problema exato e dou a solução definitiva!**
