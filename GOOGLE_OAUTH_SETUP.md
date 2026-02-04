# Guia de Configuração: Google OAuth

Para habilitar o login com Google na sua aplicação, você precisa obter um **Client ID** no Google Cloud Console. Siga os passos abaixo:

## Passo 1: Criar um Projeto no Google Cloud
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Faça login com sua conta Google.
3. Clique no seletor de projetos no topo esquerdo (ao lado do logo "Google Cloud").
4. Clique em **New Project** (Novo Projeto).
5. Dê um nome ao projeto (ex: `Planejamento Academico`) e clique em **Create**.

## Passo 2: Configurar a Tela de Consentimento (OAuth Consent Screen)
1. No menu lateral esquerdo, vá para **APIs & Services** > **OAuth consent screen**.
2. Selecione **External** (Externo) e clique em **Create**.
3. Preencha as informações obrigatórias:
   - **App name**: Nome da sua aplicação.
   - **User support email**: Seu email.
   - **Developer contact information**: Seu email novamente.
4. Clique em **Save and Continue** nas próximas telas (Scopes e Test Users pode deixar como está por enquanto).
5. (Opcional) Em **Test Users**, adicione seu próprio email para garantir que você consiga testar enquanto o app não for verificado.

## Passo 3: Criar Credenciais (Client ID)
1. No menu lateral, vá para **APIs & Services** > **Credentials**.
2. Clique em **+ CREATE CREDENTIALS** no topo e selecione **OAuth client ID**.
3. Em **Application type**, selecione **Web application**.
4. Em **Name**, coloque algo como `Web Client`.
5. Em **Authorized JavaScript origins**, clique em **ADD URI** e adicione:
   - `http://localhost:5174` (Seu app está rodando na porta 5174 agora)
   - `http://localhost:5173` (Adicione também caso volte para a porta padrão)
6. Em **Authorized redirect URIs**, também adicione as mesmas URIs.
7. Clique em **Create**.

chave: 568890397434-11tclbnc49gb6up1uvj69rnli5h0rist.apps.googleusercontent.com

## Passo 4: Copiar o Client ID
1. Uma janela popup aparecerá com suas credenciais.
2. Copie o código listado em **Your Client ID**.
   - Ele deve parecer com algo assim: `123456789-abcdefghijk.apps.googleusercontent.com`.

## Passo 5: Adicionar ao Projeto
1. Crie um arquivo chamado `.env` na pasta `client` (se não existir).
2. Adicione a seguinte linha:
   ```
   VITE_GOOGLE_CLIENT_ID=seu_client_id_aqui
   ```
3. Reinicie o terminal do cliente (`npm run dev`).

---
> **IMPORTANTE**: Assim que você tiver o Client ID configurado, avise no chat para que a integração técnica (`@react-oauth/google`) seja instalada e ativada no código!

