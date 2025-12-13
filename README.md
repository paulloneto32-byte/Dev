# FinanceApp - Plataforma de Gestão Financeira Pessoal

Uma plataforma web completa e moderna para controle de finanças pessoais, desenvolvida com Next.js 14, TypeScript e Tailwind CSS.

## 🚀 Funcionalidades Implementadas

### ✅ Autenticação
- Login com email/senha
- Suporte para login com Google OAuth
- Registro de novos usuários
- Proteção de rotas autenticadas
- Sessões seguras com NextAuth.js

### ✅ Gestão de Contas Bancárias
- Criar, editar e excluir contas
- Tipos de conta: Banco, Dinheiro, Cartão de Crédito, Investimento, Poupança
- Personalização de cores e ícones
- Saldo atualizado automaticamente
- Visualização de saldo total

### ✅ Categorias e Subcategorias
- Categorias separadas para Receitas e Despesas
- Criação de subcategorias (ex: Alimentação > Restaurantes)
- Categorias padrão pré-definidas
- Personalização de cores
- Interface visual hierárquica

**Categorias Padrão:**
- **Despesas:** Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Vestuário
- **Receitas:** Salário, Freelance, Investimentos

### ✅ Transações Completas
- Registro de receitas e despesas
- Transações parceladas (cria automaticamente múltiplas transações)
- Associação com contas e categorias
- Filtros avançados:
  - Por mês
  - Por conta
  - Por categoria
  - Por tipo (receita/despesa)
- Resumo visual do período
- Atualização automática de saldo
- Indicadores visuais de parcelas

### 🎨 Interface
- Design moderno e responsivo
- Sidebar com navegação
- Cards informativos
- Formulários modais
- Tema claro/escuro (suporte nativo do Tailwind)
- Componentes UI reutilizáveis (shadcn/ui style)

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Componentes:** Radix UI, Lucide Icons
- **Backend:** API Routes do Next.js
- **Banco de Dados:** PostgreSQL com Prisma ORM
- **Autenticação:** NextAuth.js v5 (beta)
- **Validação:** Zod (preparado)

## 📁 Estrutura do Projeto

```
├── app/
│   ├── (auth)/
│   │   ├── login/          # Página de login
│   │   └── register/       # Página de registro
│   ├── (dashboard)/
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── transactions/   # Gestão de transações
│   │   ├── accounts/       # Gestão de contas
│   │   ├── categories/     # Gestão de categorias
│   │   ├── goals/          # Metas (TODO)
│   │   ├── budgets/        # Orçamentos (TODO)
│   │   ├── reports/        # Relatórios (TODO)
│   │   └── settings/       # Configurações (TODO)
│   ├── api/
│   │   ├── auth/           # Autenticação
│   │   ├── accounts/       # API de contas
│   │   ├── categories/     # API de categorias
│   │   └── transactions/   # API de transações
│   └── layout.tsx          # Layout raiz
├── components/
│   ├── ui/                 # Componentes UI base
│   ├── layout/             # Sidebar e Header
│   └── providers/          # Providers do app
├── lib/
│   ├── auth.ts             # Configuração NextAuth
│   ├── prisma.ts           # Cliente Prisma
│   └── utils.ts            # Funções utilitárias
├── prisma/
│   └── schema.prisma       # Schema do banco
└── types/                  # TypeScript types
```

## 🗄️ Modelo de Dados

### Principais Entidades

- **User** - Usuários do sistema
- **BankAccount** - Contas bancárias
- **Category** - Categorias e subcategorias
- **Transaction** - Transações financeiras
- **Goal** - Metas de poupança (TODO)
- **Budget** - Orçamentos mensais (TODO)
- **CreditCard** - Cartões de crédito (TODO)

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- PostgreSQL
- npm ou yarn

### Instalação

1. Clone o repositório
```bash
git clone <url>
cd Dev
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/finance"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="seu-google-client-id" # Opcional
GOOGLE_CLIENT_SECRET="seu-google-client-secret" # Opcional
```

4. Execute as migrations do Prisma
```bash
npx prisma migrate dev
```

5. Gere o Prisma Client
```bash
npx prisma generate
```

6. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

7. Acesse http://localhost:3000

## 📝 Uso da Aplicação

### Primeiro Acesso

1. Crie uma conta em `/register`
2. Faça login em `/login`
3. Acesse `/categories` e clique em "Criar Padrões" para gerar categorias padrão
4. Crie suas contas bancárias em `/accounts`
5. Comece a registrar transações em `/transactions`

### Criar Categorias Padrão

A aplicação oferece um botão "Criar Padrões" na página de categorias que cria automaticamente:
- 8 categorias de despesas com subcategorias
- 4 categorias de receitas com subcategorias

### Transações Parceladas

Ao criar uma transação, defina o número de parcelas (ex: 12x). O sistema criará automaticamente 12 transações mensais com indicador de parcela (1/12, 2/12, etc.).

## 🎯 Próximas Funcionalidades

### Planejadas

- [ ] Dashboard com gráficos (Recharts)
- [ ] Sistema de Metas de Poupança
- [ ] Orçamento Mensal
- [ ] Relatórios e Análises
- [ ] Gestão de Cartões de Crédito
- [ ] PWA (Progressive Web App)
- [ ] Refinamentos UI/UX

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Validação de dados no backend
- Proteção CSRF nativa do Next.js
- Autenticação baseada em tokens JWT
- Todas as rotas de API verificam autenticação

---

**Desenvolvido com ❤️ usando Next.js 14 e TypeScript**
