# 🔧 CORREÇÃO URGENTE - Database URL

## ⚠️ PROBLEMA IDENTIFICADO

A string de conexão `DATABASE_URL` no arquivo `.env` está **malformada** e causando erro 500 nos endpoints de autenticação.

## ❌ FORMATO ATUAL (INCORRETO)

```
DATABASE_URL=postgresql://postgres:42080@Supabase@db.pbdqdshwvifunfdgsefs.supabase.co:5432/postgres
```

**Problemas:**
- `@` duplicado
- Formato inválido de URI PostgreSQL
- Porta incorreta (5432 é Direct Connection, não Session Pooler)

## ✅ FORMATO CORRETO

### Para Produção (Render + Supabase):

```
DATABASE_URL=postgresql://postgres:[SUA_SENHA_REAL]@db.pbdqdshwvifunfdgsefs.supabase.co:6543/postgres
```

**Observações importantes:**
- Porta **6543** (Session Pooler - Transaction mode)
- Apenas **um** `@` separando credenciais do host
- Formato: `postgresql://[user]:[password]@[host]:[port]/[database]`

### Como encontrar a string correta:

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá em **Settings** > **Database**
3. Role até **Connection String**
4. Copie a string do **Session Pooler** (Transaction mode)
5. Substitua `[YOUR-PASSWORD]` pela senha real do banco

## 🚀 AÇÃO NECESSÁRIA

### 1. Corrigir `.env` LOCAL (não commitado):

Edite manualmente o arquivo:
```
server\.env
```

E substitua a linha `DATABASE_URL` pelo formato correto acima.

### 2. Configurar Variáveis de Ambiente no RENDER:

1. Acesse o [Dashboard do Render](https://dashboard.render.com)
2. Selecione seu serviço de backend
3. Vá em **Environment**
4. Edite a variável `DATABASE_URL`
5. Cole a string **Session Pooler** do Supabase (porta 6543)
6. Salve (auto-deploy será disparado)

## ✅ CHECKLIST PÓS-CORREÇÃO

Após corrigir a `DATABASE_URL` no Render:

- [ ] Deploy completou com sucesso
- [ ] Logs do Render mostram "✅ PostgreSQL conectado"
- [ ] Endpoint `GET /` (health check) retorna `{"status":"ok","database":"connected"}`
- [ ] Login local funciona (POST `/api/auth/login`)
- [ ] Registro funciona (POST `/api/auth/register`)
- [ ] Login Google funciona (POST `/api/auth/google`)

## 🛠️ CORREÇÕES APLICADAS NO CÓDIGO

1. **db.js**: Removida toda lógica de resolução DNS IPv4 manual (desnecessária)
2. **db.js**: Pool simplificado e resiliente a falhas temporárias
3. **db.js**: Retry inteligente que não trava conexão
4. **index.js**: Removida configuração DNS `ipv4first` (redundante)
5. **.env.example**: Documentação clara sobre Session Pooler

## 🐛 DEBUG (se ainda houver problemas)

### Verificar logs do Render:

```
# Durante startup, procure por:
✅ PostgreSQL conectado:
   Timestamp: ...
   Database: postgres

# Se aparecer erro:
❌ Falha ao conectar PostgreSQL: ...
   Verifique DATABASE_URL e conectividade de rede
```

### Testar conexão localmente:

Execute no terminal local:
```bash
cd server
node -e "require('dotenv').config(); const db = require('./src/db'); db.testConnection().then(r => console.log(r));"
```

Deve retornar:
```json
{
  "connected": true,
  "ok": true,
  "poolSize": 1,
  "idleCount": 1,
  "waitingCount": 0
}
```

## 📝 COMMIT MESSAGE SUGERIDO

```
fix: corrigir conexão PostgreSQL e endpoints de autenticação

- Simplificar db.js removendo resolução DNS manual
- Usar Supabase Session Pooler (porta 6543) para IPv4
- Implementar retry robusto que não trava servidor
- Adicionar graceful shutdown de pool
- Remover configuração DNS redundante de index.js
- Documentar formato correto de DATABASE_URL

Resolve: erro 500 em /api/auth/login, /register, /google
```

## ⚡ DEPLOY RÁPIDO

Após fazer commit e push:

```bash
git add .
git commit -m "fix: corrigir conexão PostgreSQL e auth endpoints"
git push origin main
```

O Render fará deploy automático. Aguarde ~2 minutos e teste os endpoints.
