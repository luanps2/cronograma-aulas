# 🚀 Manual de Deploy com Atualização Automática (CI/CD)

Este guia descreve o processo completo para colocar o **Sistema de Planejamento Acadêmico** em produção, garantindo atualizações automáticas sempre que houver mudanças no repositório GitHub.

---

## 1️⃣ Visão Geral da Arquitetura

O sistema opera com duas aplicações distintas que devem ser hospedadas separadamente para garantir escalabilidade e manutenção simplificada.

```mermaid
graph TD
    User((Usuário))
    GitHub[GitHub Repo]
    
    subgraph FrontendHost ["Frontend Hosting (Vercel/Netlify)"]
        Frontend[React App]
    end
    
    subgraph BackendHost ["Backend Hosting (Render/Railway)"]
        Backend[Node.js API]
    end
    
    subgraph DBHost ["Database Hosting"]
        Supabase[(Supabase PostgreSQL)]
    end

    User -->|Acessa via Browser| Frontend
    Frontend -->|Requisita Dados HTTPS| Backend
    Backend -->|Lê/Grava Dados| Supabase
    
    GitHub -->|Push na Main - Auto Deploy| Frontend
    GitHub -->|Push na Main - Auto Deploy| Backend
```

---

## 2️⃣ Pré-requisitos

Antes de iniciar, certifique-se de ter:
1.  **Conta no GitHub**: Com o código do projeto em um repositório (privado recomendado).
2.  **Conta no Supabase**: Projeto criado e String de Conexão obtida.
3.  **Contas de Hospedagem**:
    *   **Frontend**: Recomendado **Vercel** ou **Netlify** (Grátis para projetos pequenos).
    *   **Backend**: Recomendado **Render**, **Railway** ou **Fly.io** (Planos gratuitos ou de baixo custo).

---

## 3️⃣ Estratégia de Deploy

| Componente | Serviço Recomendado | Por que? |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** | Otimizado para Vite/React, CDN global, deploy instantâneo, SSL automático. |
| **Backend** | **Render** | Suporte nativo a Node.js, fácil configuração de variáveis, plano gratuito disponível. |

⚠️ **Importante**: Nunca commite arquivos `.env` no GitHub. As variáveis de ambiente serão configuradas diretamente nos painéis da Vercel e Render.

---

## 4️⃣ Configuração do Backend (Render)

Siga estes passos para configurar a API:

1.  Acesse [dashboard.render.com](https://dashboard.render.com) e clique em **New +** -> **Web Service**.
2.  Conecte sua conta do GitHub e selecione o repositório do projeto.
3.  **Configurações Básicas**:
    *   **Name**: `sonic-aphelion-api` (ou nome de sua preferência)
    *   **Region**: Escolha a mais próxima (ex: Ohio, Frankfurt, SP).
    *   **Branch**: `main` (ou `master`)
    *   **Root Directory**: `server` (MUITO IMPORTANTE: Indica que o backend está na pasta `server`)
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  **Variáveis de Ambiente (Environment Variables)**:
    Clique em "Add Environment Variable" e adicione (veja `server/.env.example`):
    *   `NODE_ENV`: `production`
    *   `PORT`: `10000` (Render usa essa porta internamente, mas pode deixar que ele gerencia)
    *   `DATABASE_URL`: `postgresql://postgres:[SENHA]@db.[REF].supabase.co:5432/postgres` (Sua string do Supabase)
    *   `JWT_SECRET`: `[Sua chave secreta longa e segura]`
    *   `GOOGLE_CLIENT_ID`: `[Do Google Cloud Console]`
    *   `GOOGLE_CLIENT_SECRET`: `[Do Google Cloud Console]`
    *   `FRONTEND_URL`: `https://[SEU-APP-FRONTEND].vercel.app` (Você preencherá isso APÓS deployar o frontend)
5.  Clique em **Create Web Service**.

✅ **O deploy iniciará automaticamente.** Acompanhe os logs. Se aparecer "Listening on port...", sucesso!

---

## 5️⃣ Configuração do Frontend (Vercel)

Siga estes passos para configurar o Cliente React:

1.  Acesse [vercel.com](https://vercel.com) e faça login com GitHub.
2.  Clique em **Add New...** -> **Project**.
3.  Importe o mesmo repositório do GitHub.
4.  **Configurações de Build**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: Clique em *Edit* e selecione a pasta `client`.
    *   **Build Command**: `npm run build` (Automático)
    *   **Output Directory**: `dist` (Automático)
5.  **Variáveis de Ambiente**:
    Adicione as variáveis (veja `client/.env.example`):
    *   `VITE_API_URL`: `https://[SEU-APP-BACKEND].onrender.com` (A URL gerada no passo anterior do Render)
    *   `VITE_GOOGLE_CLIENT_ID`: `[Do Google Cloud Console]` (Mesmo do backend)
6.  Clique em **Deploy**.

✅ **A Vercel fará o build e deploy.** Em segundos você terá uma URL `https://seu-projeto.vercel.app`.

⚠️ **Pós-Deploy**: Volte no Render (Backend) e atualize a variável `FRONTEND_URL` com este novo domínio da Vercel. Isso corrige erros de CORS.

---

## 6️⃣ Deploy Automático (Atualização Contínua)

Uma vez configurado, o processo é **100% automático**:

1.  Faça alterações no código em sua máquina local.
2.  Commit e Push para a branch `main`:
    ```bash
    git add .
    git commit -m "Melhoria no login"
    git push origin main
    ```
3.  **Mágica Acontece**:
    *   O Render detecta o push e inicia o build do Backend.
    *   A Vercel detecta o push e inicia o build do Frontend.
    *   Em poucos minutos, a nova versão está no ar.

**Como Pausar**: Se precisar fazer manutenção, você pode "Pausar Deploys" nos painéis de controle de ambos os serviços.

---

## 7️⃣ Gerenciamento de Segredos (`.env`)

*   **Regra de Ouro**: O arquivo `.env` REAL fica apenas na sua máquina local e nos painéis do Render/Vercel.
*   **No GitHub**: Mantenha apenas o `.env.example` atualizado com as CHAVES das variáveis, sem os valores reais.
*   **Adicionando nova variável**:
    1.  Adicione no código local.
    2.  Adicione no `.env` local.
    3.  Adicione no `.env.example` (sem valor).
    4.  Vá no painel da Vercel/Render e adicione a variável lá.
    5.  Faça o push do código.

---

## 8️⃣ Checklist de Validação Pós-Deploy

Após o deploy, verifique:

- [ ] **Acesso**: O site carrega em `https://seu-projeto.vercel.app`?
- [ ] **API**: O frontend consegue chamar o backend? (Verifique no Network tab do navegador se não há erros CORS ou 404).
- [ ] **Login**: O botão do Google abre o popup e autentica?
- [ ] **Banco**: Os dados exibidos (dashboard/calendário) são os mesmos do Supabase?
- [ ] **Importação**: Teste o upload de um arquivo Excel pequeno.

---

## 9️⃣ Atualizações e Manutenção

Para manter sistema saudável:
*   **Logs**:
    *   Vercel: Aba "Logs" no dashboard do projeto (erros de frontend/build).
    *   Render: Aba "Logs" no serviço web (erros de backend/crash).
*   **Monitoramento**: Use serviços como **UptimeRobot** para saber se a API caiu (o Render hiberna no plano grátis após inatividade; um ping a cada 5 min resolve isso).

---

## 🔟 Rollback de Emergência

Se um deploy quebrar o site:

**Na Vercel (Frontend):**
1.  Vá em **Deployments**.
2.  Encontre o último deploy verde (funcional).
3.  Clique nos 3 pontinhos -> **Redeploy** ou **Promote to Production**.
4.  O site volta à versão anterior em segundos.

**No Render (Backend):**
1.  Vá em **Events** ou **History**.
2.  Encontre o deploy anterior bem sucedido.
3.  Clique em **Rollback to this deploy**.

**Importante**: O Rollback de código NÃO desfaz migrações de banco de dados. Se você apagou uma coluna no banco, o rollback do código não trará a coluna de volta. Tenha cuidado com migrações destrutivas.

---

## 🎉 Conclusão

Seu sistema está configurado com as melhores práticas de **CI/CD (Integração e Entrega Contínuas)**. Foque no código, e deixe que a automação cuide da infraestrutura.
