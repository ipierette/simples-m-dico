# 🏥 Sistema de Agendamento Médico - Dra. Roberta Silva

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

Sistema completo de agendamento de consultas médicas com design moderno dark, integração WhatsApp e IA para dicas de saúde.

## ✨ Features

- 🎨 **Design Dark Moderno**: Interface elegante com gradientes e animações suaves
- 📱 **Totalmente Responsivo**: Funciona perfeitamente em mobile, tablet e desktop
- 💬 **WhatsApp Integrado**: Confirmações automáticas via WhatsApp
- 🤖 **IA para Dicas**: Orientações de saúde baseadas em estudos científicos
- 🔄 **Sincronização Bidirecional**: Campos sincronizados em tempo real
- 📊 **Dashboard Completo**: Consulte agendamentos facilmente
- 🔒 **Seguro**: RLS no Supabase, headers de segurança configurados
- ⚡ **Rápido**: Otimizado para performance máxima

## 🛠️ Tecnologias

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Design moderno com gradientes e animações
- **JavaScript ES6+** - Lógica e interatividade
- **Google Fonts** - Tipografia (Inter + Playfair Display)

### Backend & Infraestrutura
- **N8n** - Automação de workflows
- **Supabase** - Banco de dados PostgreSQL
- **Netlify** - Hosting e Functions serverless
- **OpenAI GPT-4** - IA para dicas de saúde
- **Evolution API** - Integração WhatsApp

## 📋 Pré-requisitos

- Node.js 18+
- Conta Supabase (gratuita)
- Conta N8n Cloud ou self-hosted
- Conta Netlify (gratuita)
- API Key OpenAI
- Instância Evolution API

## 🚀 Instalação Rápida

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/agendamento-medico.git
cd agendamento-medico
```

### 2. Instale Dependências

```bash
npm install
```

### 3. Configure Variáveis de Ambiente

Crie um arquivo `.env`:

```env
OPENAI_API_KEY=sk-proj-xxx...
```

### 4. Configure o Supabase

Execute o SQL do arquivo `supabase-sql-schema.sql` no SQL Editor do Supabase.

### 5. Configure o N8n

1. Importe o workflow do arquivo `n8n-workflow.json`
2. Configure as credenciais (Postgres, Evolution API)
3. Ative o workflow

### 6. Atualize as URLs

No arquivo `script.js`, atualize:

```javascript
const CONFIG = {
    webhookN8N: 'https://seu-n8n.app.n8n.cloud/webhook/agendamento-consulta',
    netlifyFunction: '/.netlify/functions/dicas-ia'
};
```

### 7. Deploy no Netlify

```bash
netlify login
netlify init
netlify deploy --prod
```

## 📁 Estrutura do Projeto

```
agendamento-medico/
├── index.html              # Página principal
├── styles.css              # Estilos globais
├── script.js               # Lógica JavaScript
├── package.json            # Dependências
├── netlify.toml           # Configuração Netlify
├── README.md              # Este arquivo
├── .gitignore             # Arquivos ignorados pelo Git
├── netlify/
│   └── functions/
│       └── dicas-ia.js    # Function serverless para IA
└── docs/
    ├── guia-instalacao.md # Guia completo
    ├── supabase-sql.sql   # Schema SQL
    └── n8n-workflow.json  # Workflow N8n
```

## 🎨 Paleta de Cores

```css
/* Background */
--bg-primary: #0a0e27     /* Azul escuro profundo */
--bg-secondary: #1a1f3a   /* Azul médio */
--bg-tertiary: #252b4a    /* Azul claro */

/* Acentos */
--accent-cyan: #00d4aa    /* Verde-água médico */
--accent-purple: #6c5ce7  /* Roxo suave */

/* Texto */
--text-primary: #ffffff   /* Branco */
--text-secondary: #b8b9c7 /* Cinza claro */
```

## 📱 Responsividade

O sistema é totalmente responsivo com breakpoints:

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px

## 🔐 Segurança

- **RLS (Row Level Security)** no Supabase
- **Headers de segurança** configurados
- **HTTPS** obrigatório via Netlify
- **Sanitização** de inputs
- **API Keys** via variáveis de ambiente

## 🧪 Testes

### Teste Local

```bash
# Servidor local
netlify dev

# Acesse
http://localhost:8888
```

### Teste de Agendamento

1. Preencha o formulário
2. Verifique WhatsApp
3. Consulte no banco Supabase

### Teste de IA

1. Digite sintomas
2. Clique em "Obter Dicas"
3. Verifique resposta com referências

## 📊 Monitoramento

### Métricas Disponíveis

- **Agendamentos**: Total por dia/semana/mês
- **Taxa de conversão**: Visitantes → Agendamentos
- **Tempo de resposta**: Performance da IA
- **Erros**: Logs de erros no N8n e Netlify

### Onde Monitorar

- **N8n**: Executions → Ver histórico
- **Supabase**: Logs Explorer
- **Netlify**: Functions logs
- **OpenAI**: Usage dashboard

## 🔧 Manutenção

### Backup do Banco

```bash
# Via Supabase Dashboard
Configurações → Backups → Schedule Backups
```

### Atualizar Dependencies

```bash
npm update
npm audit fix
```

### Limpar Cache

```bash
# Netlify
netlify deploy --prod --clear-cache
```

## 📈 Melhorias Futuras

- [ ] Sistema de lembretes automáticos
- [ ] Calendário interativo
- [ ] Dashboard administrativo
- [ ] Integração Google Calendar
- [ ] Sistema de avaliações
- [ ] Chat em tempo real
- [ ] Pagamento online
- [ ] Notificações push

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Desenvolvedor** - [Seu Nome](https://github.com/seu-usuario)
- **Cliente** - Dra. Roberta Silva

## 🙏 Agradecimentos

- [N8n](https://n8n.io) - Automação de workflows
- [Supabase](https://supabase.com) - Backend as a Service
- [Netlify](https://netlify.com) - Hosting
- [OpenAI](https://openai.com) - IA
- [Evolution API](https://github.com/EvolutionAPI/evolution-api) - WhatsApp

## 📞 Suporte

- **Email**: contato@drarobertasilva.com.br
- **WhatsApp**: (11) 3456-7890
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/agendamento-medico/issues)

---

**Feito com ❤️ para revolucionar o agendamento médico**