# Finanzza

Dashboard de gestão financeira familiar. Interface moderna com gráficos, controle de entradas/saídas, análise por familiar, calendário e anotações.

---

## Sumário

- [Acesso](#acesso)
- [Rodando localmente](#rodando-localmente)
- [Deploy em produção](#deploy-em-produção)
  - [Frontend → Vercel](#1-frontend--vercel)
  - [Backend → Railway](#2-backend--railway)
  - [Conectando os dois](#3-conectando-frontend--backend)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Stack técnica](#stack-técnica)
- [Funcionalidades](#funcionalidades)

---

## Acesso

| Campo    | Valor        |
|----------|-------------|
| Usuário  | `piazza`    |
| Senha    | `dudu2203`  |

> Sistema privado — acesso restrito à família.

---

## Rodando localmente

**Pré-requisito:** Node.js v22 ou superior (o projeto usa `node:sqlite`, built-in do Node.js 22+).

### Windows — início rápido

Dê duplo clique no arquivo `start.bat`. Ele instala as dependências, inicia os dois servidores e abre o navegador automaticamente.

### Manual (qualquer sistema operacional)

```bash
# Terminal 1 — Backend (porta 3001)
cd backend
npm install
npm run dev

# Terminal 2 — Frontend (porta 5173)
cd frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173**

O banco de dados SQLite é criado automaticamente em `backend/data/finanzza.db` na primeira execução.

---

## Deploy em produção

A arquitetura de produção separa os serviços:

```
Usuário → Vercel (frontend estático)
               ↓ chamadas /api/*
          Railway (backend Node.js + SQLite)
```

O motivo da separação: a Vercel serve arquivos estáticos com excelência e CDN global, mas não tem filesystem persistente para hospedar o SQLite. O Railway roda um servidor Node.js real com disco persistente.

---

### 1. Frontend → Vercel

**a) Faça push do repositório para o GitHub** (o `.gitignore` já ignora `node_modules`, `.env` e o banco de dados).

```bash
git add .
git commit -m "deploy: finanzza"
git push origin main
```

**b) No painel da Vercel** ([vercel.com](https://vercel.com)):

1. Clique em **"Add New Project"**
2. Importe o repositório do GitHub
3. A Vercel detecta o `vercel.json` automaticamente — não altere nada
4. Em **"Environment Variables"**, adicione:

| Variável       | Valor                                              |
|----------------|----------------------------------------------------|
| `VITE_API_URL` | `https://SEU-PROJETO.up.railway.app/api` *(preencha após criar o backend no Railway)* |

5. Clique em **"Deploy"**

> **Nota:** na primeira vez, você pode fazer o deploy sem `VITE_API_URL` para verificar se o build funciona. Adicione a variável e faça redeploy depois que o backend estiver no ar.

---

### 2. Backend → Railway

**a) Crie uma conta em** [railway.app](https://railway.app) (plano gratuito disponível).

**b) Novo projeto via GitHub:**

1. Clique em **"New Project"** → **"Deploy from GitHub repo"**
2. Selecione este repositório
3. Railway detecta o `railway.toml` automaticamente

**c) Adicione as variáveis de ambiente** no painel do Railway (aba **Variables**):

| Variável          | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| `APP_USER`        | `piazza`                                                              |
| `APP_PASSWORD`    | `dudu2203`                                                            |
| `JWT_SECRET`      | Uma string longa e aleatória (veja como gerar abaixo)                 |
| `ALLOWED_ORIGINS` | `https://SEU-PROJETO.vercel.app` *(URL exata do seu deploy na Vercel)* |
| `PORT`            | Deixe em branco — o Railway injeta automaticamente                   |

**Gerando um JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**d) Faça o deploy.** O Railway executará:
```
cd backend && npm install && npm run build
cd backend && npm start
```

O banco de dados SQLite será criado em `backend/data/finanzza.db` no disco persistente do Railway.

---

### 3. Conectando Frontend ↔ Backend

Após os dois deploys estarem no ar:

1. **Copie a URL do backend** no Railway (algo como `https://finanzza-backend-production.up.railway.app`)
2. **Na Vercel**, vá em: Project → Settings → Environment Variables
3. **Edite** `VITE_API_URL` para: `https://finanzza-backend-production.up.railway.app/api`
4. **Na Railway**, edite `ALLOWED_ORIGINS` para a URL exata da Vercel: `https://finanzza.vercel.app`
5. **Redeploy** em ambos (ou espere o próximo push automático)

---

## Variáveis de ambiente

### Backend (`backend/.env`)

Copie `backend/.env.example` para `backend/.env` e preencha:

```env
APP_USER=piazza
APP_PASSWORD=dudu2203
JWT_SECRET=troque_por_uma_chave_secreta_longa
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend

Em desenvolvimento, **nenhum arquivo `.env` é necessário** — o Vite faz proxy automático para `localhost:3001`.

Em produção, a variável `VITE_API_URL` é configurada diretamente no painel da Vercel (não em arquivo `.env` commitado).

---

## Estrutura do projeto

```
finanzza/
│
├── backend/                        # Servidor Node.js + Express
│   ├── src/
│   │   ├── db/
│   │   │   └── database.ts         # SQLite via node:sqlite (built-in Node 22+)
│   │   ├── middleware/
│   │   │   └── auth.ts             # Verificação de token JWT
│   │   ├── routes/
│   │   │   ├── auth.ts             # POST /api/auth/login
│   │   │   ├── transactions.ts     # CRUD + /summary
│   │   │   ├── family.ts           # CRUD de familiares
│   │   │   └── notes.ts            # CRUD de anotações
│   │   └── index.ts                # App Express + configuração CORS
│   ├── data/
│   │   └── finanzza.db             # Banco SQLite (gerado automaticamente, não commitado)
│   ├── .env                        # Variáveis locais (não commitado)
│   ├── .env.example                # Template de variáveis
│   └── package.json
│
├── frontend/                       # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts           # Axios com interceptors JWT
│   │   │   ├── transactions.ts
│   │   │   ├── family.ts
│   │   │   └── notes.ts
│   │   ├── components/
│   │   │   ├── Layout.tsx          # Wrapper com sidebar responsiva
│   │   │   └── Sidebar.tsx         # Navegação lateral
│   │   ├── hooks/
│   │   │   └── useAuth.ts          # Login/logout + estado de autenticação
│   │   ├── pages/
│   │   │   ├── Login.tsx           # Tela de login
│   │   │   ├── Dashboard.tsx       # Visão geral + 3 gráficos
│   │   │   ├── Transactions.tsx    # Tabela + modal de cadastro/edição
│   │   │   ├── Family.tsx          # Membros + análise por familiar
│   │   │   ├── Calendar.tsx        # Calendário mensal com transações
│   │   │   └── Notes.tsx           # Bloco de notas
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces
│   │   └── App.tsx                 # Roteamento + guard de autenticação
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── vercel.json                     # Configuração de build para a Vercel
├── railway.toml                    # Configuração de build para o Railway
├── start.bat                       # Inicialização rápida no Windows
└── README.md
```

---

## Stack técnica

| Camada    | Tecnologia                                              |
|-----------|---------------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, Recharts      |
| Backend   | Node.js v22+, Express, TypeScript, tsx                  |
| Banco     | SQLite via `node:sqlite` (módulo nativo do Node.js 22+) |
| Auth      | JWT (jsonwebtoken) — token expira em 7 dias             |
| Deploy    | Vercel (frontend) + Railway (backend)                   |

**Por que `node:sqlite` em vez de `better-sqlite3`?**
O `node:sqlite` é um módulo nativo do Node.js 22+ — sem compilação nativa, sem dependências extras, zero problemas de instalação em qualquer plataforma (Windows, Mac, Linux, Railway).

---

## Funcionalidades

**Visão Geral (Dashboard)**
- Cards com Saldo Total, Total Recebido, Total Gasto e Gastos Desnecessários
- Gráfico de área: fluxo de caixa mês a mês
- Gráfico de pizza: distribuição de gastos por categoria
- Gráfico de barras: comparativo mensal Entradas × Saídas
- Alerta automático quando há gastos marcados como desnecessários
- Ranking de categorias com barra de progresso relativa

**Transações**
- Cadastro de Entradas (salário, freelance, etc.) e Saídas (despesas)
- Campos: valor, data, categoria, descrição, familiar e flag "Gasto Desnecessário"
- Filtro por tipo (todos / entradas / saídas) e busca por texto
- Edição e exclusão inline com confirmação

**Família**
- Cadastro de membros com grau de parentesco
- Gráfico de barras comparando gastos por familiar
- Tabela de análise detalhada: entradas, saídas e total de transações por pessoa
- Cards de destaque: maior e menor gastador

**Calendário**
- Grid mensal navegável (mês anterior / próximo)
- Pontos coloridos nos dias com transações (verde = entrada, vermelho = saída)
- Painel lateral com detalhe das transações do dia selecionado
- Totais do mês visíveis no topo

**Anotações**
- Cards coloridos com título, data e conteúdo
- Expansão/colapso de notas longas
- Criação, edição e exclusão

---

> "Uma pessoa humilde é aquela que não diminui o outro para crescer." — Mario Sergio Cortella
