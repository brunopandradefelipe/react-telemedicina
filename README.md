# Sistema de Telemedicina com IA

Este projeto implementa um sistema de telemedicina que utiliza a API do GPT para realizar triagem inicial de pacientes, com suporte a reconhecimento de voz.

## Funcionalidades

- Reconhecimento de voz em português
- Interação com o paciente através de IA (GPT)
- Detecção automática de encaminhamentos para especialidades
- Detecção de situações de emergência
- Geração automática de resumo da consulta
- Armazenamento de prontuários em banco de dados

## Requisitos

- Node.js (v14 ou superior)
- MongoDB (local ou remoto)
- Chave de API da OpenAI

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Configure as variáveis de ambiente no arquivo `.env.local`:
   ```
   REACT_APP_OPENAI_API_KEY=sua_chave_api_aqui
   REACT_APP_API_URL=http://localhost:5000/api
   MONGODB_URI=mongodb://localhost:27017/telemedicine
   PORT=5000
   ```

## Executando o projeto

1. Inicie o servidor MongoDB (se estiver usando localmente)

2. Inicie o servidor backend:

   ```
   npm run server
   ```

3. Em outro terminal, inicie o frontend:

   ```
   npm start
   ```

4. Acesse a aplicação em `http://localhost:3000`

## Como usar

1. Ao iniciar, o assistente virtual pedirá seu nome
2. Fale naturalmente sobre seus sintomas e responda às perguntas do assistente
3. O assistente pode:
   - Encaminhar para uma especialidade médica
   - Recomendar ida a uma unidade de saúde
   - Indicar contato com serviços de emergência (192)
4. Quando o atendimento for encerrado, um resumo será exibido e os dados serão salvos

## Estrutura do projeto

- `/src` - Código fonte do frontend
  - `/components` - Componentes React
  - `/services` - Serviços para API e análise de respostas
  - `/types` - Definições de tipos TypeScript
- `/server` - Código fonte do backend
  - `/controllers` - Controladores da API
  - `/models` - Modelos de dados (MongoDB)
  - `/routes` - Rotas da API

## Tecnologias utilizadas

- React
- TypeScript
- Material-UI
- Express
- MongoDB/Mongoose
- OpenAI API
- Web Speech API
