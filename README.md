# SenacTech - Sistema de Gestão Acadêmica

## 1. Visão Geral

### Objetivo
O **SenacTech** é uma aplicação web desenvolvida para otimizar a gestão acadêmica do SENAC, com foco na organização estruturada de Cursos, Unidades Curriculares (UCs), Turmas e Laboratórios, além de facilitar o planejamento de aulas.

### Público-Alvo
- **Gestores (Managers)**: Responsáveis pelo cadastro de dados mestres (Cursos, UCs, Turmas, Labs) e visão geral.
- **Operadores/Docentes**: Responsáveis pelo uso diário, consulta de cronogramas e gestão de aulas.

### Principais Funcionalidades
- **Gestão Hierárquica**: Cadastro de Cursos e suas respectivas Unidades Curriculares.
- **Gestão de Recursos**: Administração de Turmas e Laboratórios.
- **Calendário de Aulas**: Visualização mensal/semanal de alocações (em desenvolvimento).
- **Importação Inteligente**: Capacidade de importar cronogramas via imagem (OCR/LLM).
- **Configurações Centralizadas**: Interface unificada para gestão de todas as entidades do sistema.

---

## 2. Arquitetura

O projeto segue uma arquitetura moderna de **Single Page Application (SPA)** desacoplada:

- **Frontend**: React.js (Vite), focado em performance, componentes funcionais e estilização modular (CSS puro/Modules).
- **Backend**: Node.js (Express), focado em fornecer uma API RESTful robusta.
- **Banco de Dados**: SQLite (via `sqlite3`), garantindo simplicidade e portabilidade local, mas escalável para outros SQLs se necessário.

### Decisões Arquiteturais
- **Camadas (Backend)**:
  - `Routes`: Definição de endpoints.
  - `Controllers`: Lógica de entrada/saída HTTP.
  - `Models`: Acesso a dados (Data Access Layer).
  - `Services`: Regras de negócio complexas.
- **Componentização (Frontend)**:
  - Componentes reutilizáveis (`SettingsFormModal`, forms genéricos).
  - Páginas principais como orquestradores de estado (`SettingsView`, `CalendarView`).

---

## 3. Modelo de Dados

### Entidades Principais

- **Users (`users`)**
  - Gestão de acesso e perfis (Manager/Operator).
  - Integração com Google OAuth (`google_id`, `avatar_url`).

- **Cursos (`courses`)**
  - Entidade raiz da estrutura acadêmica.
  - Ex: "Técnico em Informática".

- **Unidades Curriculares (`ucs`)**
  - Disciplinas vinculadas obrigatoriamente a um Curso.
  - Atributos: Nome, Carga Horária (`hours`), Descrição.
  - **Regra**: Uma UC não pode existir sem um Curso pai.

- **Turmas (`classes`)**
  - Grupos de alunos vinculados a um Curso.
  - Identificados por número/código (ex: "Turma 27").

- **Laboratórios (`labs`)**
  - Recursos físicos disponíveis.
  - Atributos: Nome, Capacidade.

- **Aulas (`lessons`)**
  - A unidade de agendamento.
  - Relaciona: Turma + UC + Data + Horário.

---

## 4. Autenticação

### Fluxo de Login
1. **Google OAuth 2.0**: O usuário clica em "Entrar com Google".
2. **Frontend**: Solicita token de acesso ao Google.
3. **Backend**: Recebe o token, valida junto ao Google, e cria/atualiza o usuário no banco local.
4. **Sessão**: O backend retorna os dados do usuário (incluindo avatar e role). O frontend persiste estado de autenticação (simulado/local).

### Proteção
- Rotas protegidas no Frontend (redirecionam para Login se não autenticado).
- Validação de sessão no Backend (Middleware de Auth).

---

## 5. Funcionalidades Detalhadas

### Tela de Configurações (`SettingsView`)
Centraliza o CRUD (Create, Read, Update, Delete) do sistema.
- **Layout de 3 Colunas**:
  1. **Estrutura Acadêmica**: Accordion de Cursos. Ao expandir, exibe as UCs e o total de horas calculado.
  2. **Turmas**: Lista simples de turmas.
  3. **Laboratórios**: Lista de labs disponíveis.
- **Modais**: Edição e criação feitas em janelas sobrepostas para manter o contexto.

### Importação de Aulas
(Em desenvolvimento) Permite envio de print de tabelas/horários, processado por LLM para gerar registros de `lessons` automaticamente.

---

## 6. Configuração e Execução

### 🔧 Configuração do Ambiente

Siga este guia passo a passo para configurar o projeto localmente em menos de 5 minutos.

#### 1. Pré-requisitos
- **Node.js** (v18 ou superior)
- **NPM** (Gerenciador de pacotes)
- Conta no **Supabase** (para Banco de Dados PostgreSQL)
- Conta no **Google Cloud** (para Credenciais OAuth)

#### 2. Configuração Inicial
O projeto utiliza variáveis de ambiente para segurança. NUNCA commite arquivos `.env`.

**Passo 1: Clonar e Instalar**
```bash
git clone <url-do-repositorio>
cd senactech
```

**Passo 2: Configurar Backend**
```bash
cd server
npm install
cp .env.example .env    # Linux/Mac
# copy .env.example .env  # Windows
```
Edite o arquivo `.env` gerado na pasta `server` e preencha:
- `DATABASE_URL`: Sua string de conexão do Supabase (Transaction Pooler).
- `JWT_SECRET`: Crie uma senha forte.
- `GOOGLE_CLIENT_ID`: ID do cliente OAuth do Google.

**Passo 3: Configurar Frontend**
```bash
cd ../client
npm install
cp .env.example .env    # Linux/Mac
# copy .env.example .env  # Windows
```
Edite o arquivo `.env` gerado na pasta `client` e preencha:
- `VITE_GOOGLE_CLIENT_ID`: O mesmo ID utilizado no backend.

#### 3. Executando o Projeto

**Backend:**
```bash
cd server
npm start
```
*O servidor rodará em http://localhost:5000*

**Frontend:**
```bash
cd client
npm run dev
```
*Acesse a aplicação em http://localhost:5173*

### 🛡️ Boas Práticas de Segurança

- **Arquivos .env**: NUNCA devem ser versionados (estão no `.gitignore`). Eles contém segredos.
- **Segredos em Repositórios Privados**: Mesmo em repositórios privados, não commite segredos. Desenvolvedores podem ter níveis de acesso diferentes ou o código pode vazar.
- **Produção**: Em ambientes como Vercel ou Render, configure as variáveis diretamente no painel do provedor, não use arquivos `.env` em produção.
- **Supabase**: Utilize o Supabase como fonte da verdade para o banco de dados.

---

## 7. Boas Práticas e Observações Técnicas

- **Hierarquia de Dados**: O sistema impõe rigidez na relação Curso -> UC. Não delete um Curso sem considerar suas UCs.
- **Hooks Reacts**: O desenvolvimento segue regras estritas (`SKILL.md`) para evitar bugs de renderização (hooks sempre no topo, sem condicionais).
- **Tratamento de Erros**: O Backend deve sempre retornar JSON com campo `error` em caso de falha.
- **UI/UX**: Prioridade para feedback visual imediato (loading states, modais, toasts).

---
*Documentação gerada em Fev/2026 - Versão 1.0*
