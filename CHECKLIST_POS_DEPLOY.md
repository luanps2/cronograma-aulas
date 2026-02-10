# ✅ CHECKLIST PÓS-DEPLOY - AUTENTICAÇÃO

## 📋 VALIDAÇÃO OBRIGATÓRIA ANTES DO DEPLOY

### 1. Variáveis de Ambiente (Render)

Acesse: https://dashboard.render.com → Seu Serviço → Environment

Verifique se estão configuradas corretamente:

- [ ] `PORT` = 5000 (ou deixe vazio, Render define automaticamente)
- [ ] `NODE_ENV` = production
- [ ] `JWT_SECRET` = [sua chave secreta - mínimo 32 caracteres]
- [ ] `GOOGLE_CLIENT_ID` = [seu client ID do Google Console]
- [ ] `GOOGLE_API_KEY` = [sua API key do Google Console]
- [ ] `DATABASE_URL` = **postgresql://postgres:[SENHA]@db.pbdqdshwvifunfdgsefs.supabase.co:6543/postgres**

**CRÍTICO:** A `DATABASE_URL` DEVE usar:
- ✅ Porta **6543** (Session Pooler)
- ✅ Formato **postgresql://user:password@host:port/database**
- ❌ NÃO usar porta 5432 (Direct Connection)
- ❌ NÃO ter `@` duplicado

### 2. String de Conexão Supabase

Para obter a string CORRETA:

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. **Settings** → **Database**
4. Role até **Connection String**
5. Selecione **Session Pooler** (Transaction mode)
6. Copie a string (ela já usa porta 6543)
7. Substitua `[YOUR-PASSWORD]` pela senha do banco

A string deve ser algo como:
```
postgresql://postgres.xyzproject:suasenha@db.xyzproject.supabase.co:6543/postgres
```

---

## 🚀 APÓS DEPLOY NO RENDER

### 1. Verificar Logs de Startup

Acesse: Render Dashboard → Seu Serviço → Logs

Procure por estas mensagens de SUCESSO:

```
✅ PostgreSQL conectado:
   Timestamp: 2026-02-09T...
   Database: postgres

✅ Servidor HTTP listening on port 10000
```

#### ❌ Se aparecer ERRO:

```
❌ Falha ao conectar PostgreSQL: ...
   Verifique DATABASE_URL e conectividade de rede
```

**Solução:**
- Verifique se a `DATABASE_URL` está correta (porta 6543)
- Verifique se a senha do banco está correta
- Verifique se o IP do Render está autorizado no Supabase (normalmente é automático)

---

### 2. Testar Health Check

**Endpoint:** `GET https://seu-backend.onrender.com/`

**Resultado esperado:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-09T23:00:00.000Z"
}
```

#### ❌ Se retornar status 503:

```json
{
  "status": "degraded",
  "database": "disconnected",
  "error": "...",
  "timestamp": "..."
}
```

**Solução:**
- Problema de conexão com banco
- Volte para o passo 1 e corrija a `DATABASE_URL`

---

### 3. Testar Registro de Usuário

**Endpoint:** `POST https://seu-backend.onrender.com/api/auth/register`

**Body (JSON):**
```json
{
  "email": "teste@exemplo.com",
  "password": "teste123",
  "name": "Usuário Teste"
}
```

**Resultado esperado (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "teste@exemplo.com",
    "name": "Usuário Teste"
  }
}
```

#### ✅ Status HTTP corretos:

- `201` Created → Usuário criado com sucesso
- `400` Bad Request → Falta email ou senha
- `409` Conflict → Usuário já existe
- `500` Internal Server Error → Problema no servidor

#### ❌ Se retornar 500:

Verifique os logs do Render. Procure por:
```
❌ Database Error (Register): ...
```

---

### 4. Testar Login Local

**Endpoint:** `POST https://seu-backend.onrender.com/api/auth/login`

**Body (JSON):**
```json
{
  "email": "teste@exemplo.com",
  "password": "teste123"
}
```

**Resultado esperado (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "teste@exemplo.com",
    "name": "Usuário Teste",
    "avatar_url": null
  }
}
```

#### ✅ Status HTTP corretos:

- `200` OK → Login bem-sucedido
- `400` Bad Request → Falta email ou senha
- `401` Unauthorized → Credenciais inválidas
- `403` Forbidden → Conta usa login social (Google)
- `500` Internal Server Error → Problema no servidor

---

### 5. Testar Login Google

**Importante:** Este teste deve ser feito **através do frontend**, pois requer o token do Google.

1. Acesse o frontend em produção (Vercel)
2. Clique no botão "Login com Google"
3. Faça login na sua conta Google
4. Deve redirecionar para o dashboard

#### ❌ Se falhar:

Verifique os logs do Render. Procure por:

```
❌ Google Token Verification Failed: ...
```

**Possíveis causas:**
- `GOOGLE_CLIENT_ID` incorreto ou ausente
- Client ID do frontend diferente do backend
- Token expirado (peça ao usuário para tentar novamente)

---

### 6. Testar Endpoint Protegido

**Endpoint:** `GET https://seu-backend.onrender.com/api/lessons`

**Headers:**
```
Authorization: Bearer <token-obtido-no-login>
```

**Resultado esperado (200 OK):**
```json
[
  {
    "id": 1,
    "courseId": 1,
    "ucId": 2,
    "date": "2026-02-10",
    ...
  }
]
```

#### ✅ Status HTTP corretos:

- `200` OK → Dados retornados com sucesso
- `401` Unauthorized → Token ausente ou inválido
- `500` Internal Server Error → Erro no servidor

---

## 🛡️ TESTES DE RESILIÊNCIA

### 1. Testar Retry de Conexão

Simule falha temporária do banco:

1. No Supabase Dashboard, pause o banco por 30 segundos (Settings → Pause Project)
2. Tente fazer login no frontend
3. Reative o banco
4. Tente novamente

**Resultado esperado:**
- Primeira tentativa: Pode falhar com 500
- Após reativar: Deve funcionar normalmente
- Logs do Render devem mostrar retry:
  ```
  ❌ Query falhou (tentativa 1/2): ...
     Reconectando em 200ms...
  ✅ PostgreSQL conectado: ...
  ```

### 2. Testar Erro de Credenciais

Tente fazer login com senha incorreta:

**Resultado esperado:**
- Status: `401 Unauthorized`
- Body: `{ "error": "Credenciais inválidas." }`
- **NÃO** deve retornar 500

---

## 📊 MONITORAMENTO CONTÍNUO

### Métricas para acompanhar:

1. **Logs do Render:**
   - Procure por `❌` (erros)
   - Verifique se não há retry excessivo (sign de problema de pool)

2. **Vercel Analytics (Frontend):**
   - Taxa de erro em `/api/auth/*`
   - Deve estar < 1%

3. **Supabase Dashboard:**
   - **Database** → **Reports**
   - Verifique conexões ativas (não deve ultrapassar o limite do pool)

---

## 🐛 TROUBLESHOOTING RÁPIDO

| Sintoma | Causa Provável | Solução |
|---------|----------------|---------|
| Erro 500 em todos os endpoints de auth | `DATABASE_URL` incorreta | Corrigir no Render e redeploy |
| "Token Google Inválido" | `GOOGLE_CLIENT_ID` incorreto | Verificar e corrigir no Render |
| Conexões lentas | Porta 5432 em vez de 6543 | Usar Session Pooler (6543) |
| Pool esgotado | `max: 20` muito alto para plano Supabase Free | Reduzir para `max: 10` |
| Erro CORS | Frontend usando URL incorreta | Verificar `api.js` no frontend |

---

## ✅ VALIDAÇÃO FINAL

Quando TUDO estiver funcionando, você deve conseguir:

- [ ] Criar novo usuário (register)
- [ ] Fazer login com email/senha
- [ ] Fazer login com Google
- [ ] Acessar endpoints protegidos (dashboard, settings)
- [ ] Logs do Render sem erros `❌`
- [ ] Resposta do health check com `"database": "connected"`

---

## 🎯 COMMIT & PUSH

Depois de validar tudo localmente:

```bash
git add .
git commit -m "fix: corrigir conexão PostgreSQL e robustez em auth endpoints

- Simplificar pool PostgreSQL removendo DNS manual
- Adicionar validações robustas em login/register/google
- Implementar retry inteligente que não trava servidor
- Melhorar logs para debugging
- Adicionar graceful shutdown de pool
- Documentar formato correto de DATABASE_URL (Session Pooler porta 6543)

Resolve: erro 500 em /api/auth/login, /register, /google"

git push origin main
```

Render fará deploy automático em ~2-3 minutos.

---

## 📞 SUPORTE

Se após seguir todos os passos ainda houver problemas:

1. Capture screenshot dos logs do Render (últimas 50 linhas)
2. Capture resposta do endpoint que está falhando
3. Verifique se todas as variáveis de ambiente estão configuradas
4. Confirme que a string `DATABASE_URL` está usando porta 6543
