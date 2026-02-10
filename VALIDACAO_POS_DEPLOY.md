# ✅ GUIA RÁPIDO - Pós Deploy

Execute estes comandos **APÓS** o deploy completar no Render:

## 1. Verificar se Logs Mostram Código Novo

**Procure por:**
```
✅ PostgreSQL conectado:
   Timestamp: ...
   Database: postgres
```

**NÃO deve aparecer:**
```
❌ Resolvendo "db.pbdqdshwvifunfdgsefs.supabase.co" com DNS público
```

---

## 2. Testar Health Check

```bash
curl https://seu-backend.onrender.com/
```

**Esperado:**
```json
{"status":"ok","database":"connected","timestamp":"..."}
```

---

## 3. Testar Google Login

1. Acesse seu frontend em produção
2. Clique em "Continuar com Google"
3. Faça login com sua conta Google
4. **Deve redirecionar para o dashboard** ✅

---

## 4. Se Ainda Falhar

Capture e compartilhe:
1. **Logs do Render** (últimas 30 linhas)
2. **Erro exato** que aparece no frontend
3. **Resultado do health check** (passo 2 acima)

---

**Pronto!** Aguarde o deploy completar e execute estes testes.
