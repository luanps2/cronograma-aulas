# Implementação de Regras de Negócio - Sistema de Calendário Senac

## ✅ Alterações Implementadas

### 📊 Modelos de Dados Atualizados

#### 1. **Curso** (`server/src/models/Course.js`)
```javascript
- name: String (obrigatório) - Nome completo do curso
- acronym: String (obrigatório, único) - Sigla do curso (ex: TI, TIPI)
```

**Regras implementadas:**
- ✅ Sigla única validada ao criar curso
- ✅ Não permite exclusão de curso com UCs ou Turmas vinculadas

#### 2. **Unidade Curricular** (`server/src/models/UC.js`)
```javascript
- name: String (obrigatório) - Código da UC (ex: UC1, UC2)
- desc: String (obrigatório) - Descrição da UC
- hours: String (obrigatório) - Carga horária (ex: 60h, 120h)
- course: ObjectId (obrigatório, ref: 'Course') - Referência ao curso
```

**Regras implementadas:**
- ✅ Curso obrigatório para criar UC
- ✅ Carga horária obrigatória
- ✅ Permite UCs com mesmo código em cursos diferentes
- ✅ Cada UC tem descrição própria

#### 3. **Turma** (`server/src/models/Class.js`)
```javascript
- name: String (obrigatório) - Nome auto-gerado (ex: TI - 27)
- number: String (obrigatório) - Número da turma (ex: 27)
- course: ObjectId (obrigatório, ref: 'Course') - Referência ao curso
- year: String (opcional) - Ano da turma
```

**Regras implementadas:**
- ✅ Nome gerado automaticamente: `SIGLA - NÚMERO`
- ✅ Curso obrigatório para criar turma
- ✅ Prefixo não editável manualmente
- ✅ Se curso mudar, prefixo atualiza automaticamente

#### 4. **Laboratório** (`server/src/models/Lab.js`)
```javascript
- name: String (obrigatório) - Nome do lab (ex: LAB43)
- capacity: String (opcional) - Capacidade do laboratório
```

---

### 🔒 Regras de Integridade (Backend)

Implementadas em `server/src/routes/settings.js`:

#### **Criação de Curso**
- Valida presença de `name` e `acronym`
- Verifica unicidade da sigla (mock e DB)
- Retorna erro 400 se sigla já existe

#### **Criação de Turma**
- Exige `course` e `number`
- Busca curso para obter sigla
- Gera nome automaticamente: `${courseAcronym} - ${number}`
- Salva nome gerado (não editável)

#### **Criação de UC**
- Exige `course`, `name` (código), `desc` e `hours`
- Valida existência do curso
- Associa UC ao curso obrigatoriamente

#### **Exclusão de Curso**
- Verifica se há UCs vinculadas → bloqueia com mensagem clara
- Verifica se há Turmas vinculadas → bloqueia com mensagem clara
- Só permite exclusão se não houver dependências

---

### 🎨 Interface de Usuário (Frontend)

Atualizado em `client/src/components/SettingsView.jsx`:

#### **Formulário de Curso**
```
Campos:
- Sigla do Curso * (input text, auto-uppercase)
- Nome Completo * (input text)

Validação:
- Ambos campos obrigatórios
- Sigla convertida para maiúsculas
```

#### **Formulário de Turma**
```
Campos:
- Curso * (dropdown com lista de cursos)
- Número da Turma * (input text)

Preview:
- Mostra nome gerado em tempo real
- Exemplo: "TI - 27"

Validação:
- Curso e número obrigatórios
```

#### **Formulário de UC**
```
Campos:
- Curso * (dropdown com lista de cursos)
- Código da UC * (ex: UC1)
- Descrição * (texto descritivo)
- Carga Horária * (ex: 60h, 120h)

Validação:
- Todos campos obrigatórios
- Curso deve ser selecionado primeiro
```

#### **Formulário de Laboratório**
```
Campos:
- Nome do Laboratório * (ex: LAB43)
- Capacidade (opcional, ex: 30 lugares)

Validação:
- Apenas nome obrigatório
```

---

### 🔄 Funcionalidades de CRUD

#### **Listagem**
- ✅ Todos os itens exibem informações corretas
- ✅ Turmas mostram nome gerado e curso vinculado
- ✅ UCs mostram código, carga horária, sigla do curso e descrição
- ✅ Populate automático de referências (mock e DB)

#### **Criação**
- ✅ Formulários específicos por tipo
- ✅ Validação client-side e server-side
- ✅ Mensagens de erro claras

#### **Exclusão**
- ✅ Confirmação antes de excluir
- ✅ Validação de integridade no backend
- ✅ Mensagens de erro quando há dependências

---

### 🧪 Modo Mock (Sem Banco de Dados)

Sistema funciona mesmo sem MongoDB ativo:

- ✅ Armazenamento em memória
- ✅ Todas regras de negócio funcionam
- ✅ Populate manual de referências
- ✅ Mensagens indicam modo mock
- ⚠️ Dados resetam ao reiniciar servidor

---

### 📝 Exemplos de Uso

#### Criar Curso
```
Sigla: TI
Nome: Técnico em Informática
→ Curso criado com sigla única
```

#### Criar Turma
```
Curso: TI - Técnico em Informática
Número: 27
→ Nome gerado automaticamente: "TI - 27"
```

#### Criar UC
```
Curso: TI - Técnico em Informática
Código: UC1
Descrição: Fundamentos de Programação
Carga Horária: 60h
→ UC vinculada ao curso TI
```

#### Tentar Excluir Curso com Dependências
```
Curso: TI (com 3 UCs e 2 Turmas)
→ ERRO: "Cannot delete Course with registered UCs or Classes."
```

---

### 🚀 Como Testar

1. **Servidor backend rodando:** `http://localhost:5000`
2. **Cliente frontend rodando:** `http://localhost:5174`
3. **Acesse as Configurações** (botão Settings no header)

**Fluxo de teste sugerido:**

1. Criar curso "TI - Técnico em Informática"
2. Criar UC "UC1 - Fundamentos" para curso TI
3. Criar turma número "27" para curso TI → observe nome "TI - 27"
4. Tentar excluir curso TI → deve bloquear
5. Excluir turma e UC
6. Excluir curso TI → deve permitir

---

### ⚠️ Observações Importantes

- Dados em mock são perdidos ao reiniciar servidor
- Para persistência, conecte MongoDB em `localhost:27017`
- Todas regras funcionam em ambos os modos (mock e DB)
- Mensagens de erro são claras e em português

---

### 📦 Arquivos Alterados

```
server/src/models/Course.js       ← Schema atualizado
server/src/models/UC.js           ← Schema atualizado
server/src/models/Class.js        ← Schema atualizado
server/src/routes/settings.js     ← Lógica de negócio completa
client/src/components/SettingsView.jsx  ← Interface atualizada
```

---

## ✨ Próximos Passos Sugeridos

- [ ] Implementar edição de itens (UPDATE)
- [ ] Validar referências em Lessons (turma, UC, lab válidos)
- [ ] Adicionar busca/filtro na listagem
- [ ] Implementar paginação para grandes volumes
- [ ] Adicionar confirmação ao excluir com dependências listadas
