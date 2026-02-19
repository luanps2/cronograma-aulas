# Guia de Configuração: Microsoft OAuth (Azure Entra ID)

Para habilitar o login com contas Microsoft (Outlook, Office 365, contas corporativas ou de estudante), você precisa registrar uma aplicação no **Microsoft Azure Portal**. Siga os passos abaixo:

## Passo 1: Acessar o Portal do Azure
1. Acesse o [Azure Portal](https://portal.azure.com/).
2. Faça login com sua conta Microsoft.
3. Na barra de pesquisa superior, digite **"App registrations"** (Registros de aplicativo) e selecione essa opção.

## Passo 2: Registrar uma Nova Aplicação
1. Clique no botão **+ New registration** (Novo registro) no topo esquerdo.
2. Preencha as informações:
   - **Name**: Nome da sua aplicação (ex: `Planejamento Acadêmico`).
   - **Supported account types**:
     - Escolha **"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"** se quiser permitir qualquer conta Microsoft.
     - Escolha **"Accounts in this organizational directory only"** se for apenas para sua organização específica.
   - **Redirect URI (optional)**:
     - Selecione **Single-page application (SPA)** no dropdown de plataforma.
     - Adicione a URL do seu frontend: `http://localhost:5173` (ou a porta que estiver usando).
3. Clique em **Register** (Registrar).

## Passo 3: Configurar Autenticação e Redirect URIs
1. No menu lateral da sua aplicação recém-criada, vá em **Authentication** (Autenticação).
2. Verifique se a URI `http://localhost:5173` está listada em **Single-page application**.
3. Adicione outras URIs se necessário (ex: `http://localhost:5174` ou sua URL de produção na Vercel).
4. Em **Implicit grant and hybrid flows**, marque as opções:
   - **Access tokens (used for implicit flows)**
   - **ID tokens (used for implicit and hybrid flows)**
5. Clique em **Save** (Salvar) no topo.

## Passo 4: Criar um Segredo (Client Secret) - *Opcional para SPA, necessário para Backend*
*Nota: Para Single Page Apps (React) usando MSAL, geralmente apenas o Client ID é necessário no frontend. Se o backend for validar o token ou fazer trocas, você pode precisar disso.*
1. Vá em **Certificates & secrets** no menu lateral.
2. Em **Client secrets**, clique em **+ New client secret**.
3. Dê uma descrição e defina uma validade.
4. Clique em **Add**.
5. **Copie o "Value" imediatamente** (ele não será mostrado novamente).

## Passo 5: Copiar os Identificadores
1. Vá em **Overview** (Visão Geral) no menu lateral.
2. Copie os seguintes valores:
   - **Application (client) ID**: Este é o seu `Client ID`.
   - **Directory (tenant) ID**: Necessário para algumas configurações.

## Passo 6: Adicionar ao Projeto
1. Abra ou crie o arquivo `.env` na pasta `client`.
2. Adicione as seguintes linhas:
   ```env
   VITE_MICROSOFT_CLIENT_ID=seu_application_client_id_aqui
   VITE_MICROSOFT_TENANT_ID=common
   # Use 'common' para multitenant/pessoal, ou o ID do tenant específico se selecionou essa opção.
   ```
3. Reinicie o terminal do cliente (`npm run dev`).

---
> **IMPORTANTE**: Após configurar essas chaves, avise o desenvolvedor para integrar a biblioteca de autenticação (`@azure/msal-react` ou similar) no código!
