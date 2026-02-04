# Planejamento Acadêmico - Senac

Este projeto é uma aplicação web para professores do Senac organizarem suas aulas, com funcionalidades de calendário, importação de planilhas via IA e gestão de turmas/UCs.

## Tecnologias Utilizadas

- **Frontend**: React (Vite), Styled Components (CSS Modules/Inline), Lucide React (Ícones), Axios.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Multer (Upload de arquivos).
- **Design**: Inspirado na identidade visual do Senac (Laranja e Azul).

## Pré-requisitos

- **Node.js**: Versão 18 ou superior.
- **MongoDB**: Banco de dados rodando localmente (porta 27017) ou uma URI de conexão válida.

## Como Rodar o Projeto

Siga os passos abaixo para iniciar a aplicação completa (Frontend + Backend).

### 1. Configuração do Backend (Servidor)

Abra um terminal na raiz do projeto e execute:

```bash
# Entre na pasta do servidor
cd server

# Instale as dependências (se ainda não fez)
npm install

# Inicie o servidor
npm start

#Buscar process rodando na porta do server
netstat -ano | findstr :5000

# Parar servidor manualmente
taskkill /PID 15220 /F
```



O servidor iniciará na porta **5000**.
Você verá a mensagem: `'Server running on http://localhost:5000'` e `'MongoDB Linked'` (se o banco estiver rodando).

### 2. Configuração do Frontend (Cliente)

Abra **outro** terminal na raiz do projeto e execute:

```bash
# Entre na pasta do cliente
cd client

# Instale as dependências (se ainda não fez)
npm install

# Inicie a aplicação
npm run dev
```

O frontend iniciará na porta **5173** (ou próxima disponível).
Acesse no navegador: `http://localhost:5173`

## Funcionalidades Disponíveis

1.  **Login**: Tela de autenticação (Simulação - clique em "Entrar" ou use Google/Microsoft).
2.  **Calendário**: Visualização mensal das aulas.
    - Navegação entre meses.
    - Visualização em Grid ou Lista.
3.  **Nova Aula**: Botão "+ Nova Aula" para adicionar (Simulação de formulário).
4.  **Importar Excel**: Botão para upload de print de planilhas (Simulação com delay).
5.  **Configurações**: Gerenciamento de Cursos, Turmas, UCs e Laboratórios.

## Estrutura de Pastas

- `/client`: Código fonte do Frontend (React).
- `/server`: Código fonte da API (Node.js).
- `/uploads`: Pasta temporária para uploads de arquivos.

## Notas Importantes

- O projeto está configurado para conectar ao MongoDB local (`mongodb://localhost:27017/senac-calendar`). Certifique-se que o serviço do Mongo está rodando.
- A funcionalidade de IA para leitura de Excel está simulada (mock) para demonstração de interface.

---
Desenvolvido por Luan (IA Assistant)
