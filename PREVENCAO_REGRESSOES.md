# 🛡️ PREVENÇÃO DE REGRESSÕES - GUIA

## 🎯 O QUE CAUSOU A REGRESSÃO?

A última regressão foi causada por:

1. **DATABASE_URL malformada** - Formato inválido com `@` duplicado
2. **Complexidade desnecessária** - Resolução DNS manual que falhava
3. **Falta de validações** - Valores inválidos chegando ao bcrypt
4. **Tratamento de erro genérico** - Todo erro virava 500

---

## ✅ PRÁTICAS PARA EVITAR REGRESSÕES

### 1. SEMPRE testar localmente antes de fazer deploy

**Antes de fazer commit/push:**

```bash
# Teste de conexão
npm run test:db  # ou: node test_db_connection.js

# Inicie o servidor local
npm start

# Teste os endpoints críticos
curl http://localhost:5000/api/auth/register -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}'
```

Se **QUALQUER** desses testes falhar, **NÃO FAÇA DEPLOY**.

---

### 2. VALIDAR variáveis de ambiente

Sempre que adicionar/modificar variáveis de ambiente:

1. ✅ Atualize `.env` local
2. ✅ Atualize `.env.example` com documentação
3. ✅ Atualize variáveis no Render
4. ✅ Verifique se o formato está correto (especialmente URLs)

**Exemplo de validação de DATABASE_URL:**

```javascript
// No início de db.js ou index.js
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurado');
}

try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`✅ DATABASE_URL válida: ${url.hostname}:${url.port}`);
} catch (error) {
    throw new Error(`DATABASE_URL inválida: ${error.message}`);
}
```

---

### 3. NUNCA assumir que valores existem

**❌ ERRADO:**

```javascript
const password = user.password;
const isMatch = await bcrypt.compare(inputPassword, password); // PODE CRASHAR
```

**✅ CORRETO:**

```javascript
if (!user.password || typeof user.password !== 'string') {
    return res.status(403).json({ error: 'Conta sem senha local' });
}

const isMatch = await bcrypt.compare(inputPassword, user.password);
```

---

### 4. ISOLAR operações críticas com try/catch

**❌ ERRADO:**

```javascript
router.post('/endpoint', async (req, res) => {
    const result = await db.query(...); // SE FALHAR, VIRA 500 GENÉRICO
    res.json(result.rows);
});
```

**✅ CORRETO:**

```javascript
router.post('/endpoint', async (req, res) => {
    try {
        const result = await db.query(...);
        res.json(result.rows);
    } catch (dbError) {
        console.error('❌ Database Error:', dbError);
        
        // Tratar erros específicos
        if (dbError.code === '23505') {
            return res.status(409).json({ error: 'Duplicata' });
        }
        
        res.status(500).json({ error: 'Erro no banco' });
    }
});
```

---

### 5. USAR status HTTP corretos

| Status | Quando usar |
|--------|-------------|
| 200 | Sucesso (GET, PUT, DELETE) |
| 201 | Recurso criado (POST) |
| 400 | Entrada inválida (validação falhou) |
| 401 | Não autenticado (sem token ou token inválido) |
| 403 | Proibido (autenticado mas sem permissão) |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: email já existe) |
| 500 | Erro INTERNO do servidor (DB, FS, etc) |

**Regra:** Se o erro é culpa do **usuário** → 4xx  
Se o erro é culpa do **servidor** → 5xx

---

### 6. LOGS úteis, não genéricos

**❌ ERRADO:**

```javascript
catch (error) {
    console.log('Erro');
    res.status(500).json({ error: 'Erro' });
}
```

**✅ CORRETO:**

```javascript
catch (error) {
    console.error('❌ Database Error (Register):', error.message);
    console.error('   Code:', error.code);
    console.error('   Detail:', error.detail);
    
    res.status(500).json({
        error: 'Erro ao criar usuário',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
}
```

---

### 7. VALIDAR entrada ANTES de processar

**Ordem correta:**

1. ✅ Validar presença de campos obrigatórios
2. ✅ Validar tipo dos campos
3. ✅ Validar formato (email, URL, etc)
4. ✅ Validar regras de negócio (senha >= 6 chars)
5. ✅ Processar (hash, query, etc)

**Exemplo:**

```javascript
// 1. Presença
if (!email || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
}

// 2. Tipo
if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Tipo inválido' });
}

// 3. Formato
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
}

// 4. Regra de negócio
if (password.length < 6) {
    return res.status(400).json({ error: 'Senha muito curta' });
}

// 5. Processar
const hashedPassword = await bcrypt.hash(password, 10);
```

---

### 8. MONITORAR logs em produção

Após cada deploy:

1. ✅ Abra logs do Render imediatamente
2. ✅ Procure por `❌` nos primeiros 2 minutos
3. ✅ Execute health check manual: `GET https://seu-backend/`
4. ✅ Teste um endpoint crítico (ex: login)

Se aparecer **QUALQUER** erro `❌`, investigue ANTES de considerar deploy concluído.

---

### 9. USAR retry apenas para erros temporários

**NÃO retente:**
- ❌ Erros de validação (23505, 23503, etc)
- ❌ Erros de sintaxe SQL (42P01, etc)
- ❌ Erros de autenticação

**Retente apenas:**
- ✅ Timeout de conexão
- ✅ Perda temporária de rede
- ✅ Pool esgotado temporariamente

**Exemplo:**

```javascript
if (error.code === '23505') {
    throw error; // NÃO RETENTE - é erro de unicidade
}

if (error.message.includes('timeout')) {
    // RETENTE - pode ser temporário
}
```

---

### 10. DOCUMENTAR mudanças críticas

Sempre que modificar:
- DATABASE_URL
- Pool configuration
- Auth logic
- Variáveis de ambiente

**Documente em:**
- `.env.example`
- README.md
- Commit message

---

## 🧪 CHECKLIST PRÉ-DEPLOY

Antes de **QUALQUER** deploy:

- [ ] Testei localmente com `.env` atualizado
- [ ] Todos os endpoints críticos funcionam local
- [ ] Variáveis de ambiente do Render estão atualizadas
- [ ] `.env.example` está documentado
- [ ] Commit message descreve o que foi mudado
- [ ] Não há `console.log` desnecessários
- [ ] Try/catch em operações críticas
- [ ] Status HTTP corretos em todas respostas
- [ ] Validações de entrada implementadas

---

## 📊 SINAIS DE ALERTA

Se você ver isso, **PARE E CORRIJA**:

🚨 **Try/catch genérico:**
```javascript
try {
    // muitas linhas
} catch (error) {
    res.status(500).json({ error: 'Erro' });
}
```

🚨 **Sem validação de tipo:**
```javascript
const password = user.password;
await bcrypt.compare(input, password); // E se password for null?
```

🚨 **Log genérico:**
```javascript
console.log('Erro'); // Qual erro? Onde? Por quê?
```

🚨 **DATABASE_URL hardcoded:**
```javascript
const pool = new Pool({
    connectionString: 'postgresql://...' // NUNCA faça isso
});
```

🚨 **Retry infinito:**
```javascript
while (true) {
    try {
        await db.query(...);
        break;
    } catch (error) {
        // retry forever - NUNCA faça isso
    }
}
```

---

## 🎯 RESUMO: REGRAS DE OURO

1. ✅ **SEMPRE valide** entrada antes de processar
2. ✅ **SEMPRE isole** operações críticas com try/catch
3. ✅ **SEMPRE use** status HTTP corretos
4. ✅ **SEMPRE teste** localmente antes de deploy
5. ✅ **SEMPRE monitore** logs após deploy
6. ✅ **SEMPRE documente** mudanças críticas
7. ✅ **NUNCA assuma** que valores existem
8. ✅ **NUNCA use** try/catch genéricos
9. ✅ **NUNCA ignore** warnings ou erros em logs
10. ✅ **NUNCA faça** deploy sem testar

---

## 📚 LEITURA COMPLEMENTAR

- [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [bcrypt Best Practices](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)
- [Node.js Error Handling](https://nodejs.org/api/errors.html)

---

**Mantenha este guia à mão e consulte antes de cada mudança crítica.**
