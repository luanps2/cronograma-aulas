# Documentação do Banco de Dados

## 1. Visão Geral
O banco de dados foi migrado de **SQLite** para **PostgreSQL** para garantir escalabilidade, segurança e robustez em ambiente de produção. O serviço escolhido para hospedagem foi o **Supabase** (PostgreSQL na nuvem).

Originalmente, o projeto utilizava SQLite (`better-sqlite3`) para persistência local, o que é inadequado para uma aplicação multiusuário ou web escalável. O PostgreSQL oferece suporte nativo a tipos de dados avançados, concorrência e integridade referencial.

## 2. Acesso Externo
A conexão com o banco é gerenciada exclusivamente pelo backend via pool de conexões.

- **Tecnologia**: PostgreSQL 16+
- **Host/Provider**: Supabase
- **Porta Padrão**: 6543 (Transaction Pooler) ou 5432 (Session)
- **Segurança**: SSL é obrigatório (`rejectUnauthorized: false` configurado para compatibilidade em alguns ambientes).

## 3. Configuração de Conexão
A aplicação espera uma variável de ambiente `DATABASE_URL` no arquivo `.server/.env`.

Exemplo de formato (NUNCA commitar senhas reais):
```env
DATABASE_URL=postgres://postgres.seu-projeto:senha-secreta@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

## 4. Como Acessar o Banco

### Via Supabase Dashboard
Acesse seu painel em [supabase.com](https://supabase.com). Utilize o **Table Editor** para visualizar dados ou o **SQL Editor** para rodar scripts.

### Via Ferramentas Gráficas
Utilize softwares como **DBeaver** ou **PgAdmin**:
1. Crie uma nova conexão PostgreSQL.
2. Preencha Host, Database, User e Password (obtidos nas configurações do Supabase > Database > Connection parameters).
3. Ative SSL.

### Via Terminal
```bash
psql -h seu-host.supabase.com -p 5432 -d postgres -U postgres
```
(Requer senha quando solicitado).

## 5. Estrutura das Tabelas

### `courses` (Cursos)
- `id`: Serial PK
- `name`: Nome do curso
- `acronym`: Sigla única (ex: ADS)

### `classes` (Turmas)
- `id`: Serial PK
- `name`: Nome completo (ex: "ADS - 101")
- `number`: Número da turma
- `courseId`: FK -> `courses(id)`

### `ucs` (Unidades Curriculares)
- `id`: Serial PK
- `name`: Nome da matéria
- `desc`: Descrição
- `hours`: Carga horária
- `courseId`: FK -> `courses(id)`

### `labs` (Laboratórios)
- `id`: Serial PK
- `name`: Nome do laboratório
- `capacity`: Capacidade

### `lessons` (Aulas)
- `id`: Serial PK
- `courseId`, `ucId`: FKs loose or strict
- `turma`, `ucName`: Campos denormalizados para histórico
- `date`: Data da aula
- `period`: Manhã, Tarde, Noite

### `users` (Usuários)
- `id`: Serial PK
- `email`: Único
- `provider`: 'local', 'google', 'microsoft'

### `custom_links` (Links Personalizados)
- `id`: Serial PK
- `user_id`: FK -> `users(id)`
- `url`, `title`, `category`, `icon`

## 6. Scripts de Migração
Foi criado um script para migrar dados do SQLite legado para o PostgreSQL:
- Local: `server/scripts/migrate-sqlite-to-pg.js`
- Uso: Certifique-se de que `DATABASE_URL` está no `.env` e rode `node scripts/migrate-sqlite-to-pg.js`.

## 7. Boas Práticas
- **Credenciais**: Nunca exponha a `DATABASE_URL` no frontend.
- **Ambiente**: Use `NODE_ENV=production` para forçar validações de SSL mais estritas (ou relaxadas dependendo do pooler).
- **Backups**: O Supabase realiza backups automáticos, mas dumps manuais (`pg_dump`) são recomendados antes de grandes alterações de schema.
