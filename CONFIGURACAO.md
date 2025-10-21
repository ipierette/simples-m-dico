# 📋 Guia de Configuração do Sistema

Este guia explica como customizar o sistema para diferentes clínicas e regiões.

## 🌍 Detecção Automática de Timezone

O sistema **detecta automaticamente** o timezone do navegador do usuário. Isso significa que funciona em **qualquer região do Brasil** (ou do mundo) sem necessidade de alteração de código!

### Como funciona:

1. **Detecção automática**: Sistema detecta timezone do navegador via `Intl.DateTimeFormat().resolvedOptions().timeZone`
2. **Fallback configurável**: Se falhar, usa o timezone definido em `config.js`
3. **Override manual**: Você pode forçar um timezone específico se desejar

## ⚙️ Arquivo de Configuração

Todas as configurações estão centralizadas em: **`js/config.js`**

### Configurações Disponíveis:

```javascript
const CLINIC_CONFIG = {
  // Informações da clínica
  nome: 'Clínica Dra. Roberta Silva',
  endereco: 'Av. Paulista, 1000 - São Paulo',
  telefone: '(11) 3456-7890',
  whatsappMedico: '+5567984098786',

  // Timezone
  timezone: null,  // null = detecção automática ✅
  timezoneFallback: 'America/Campo_Grande',

  // Horários de atendimento
  horarios: [
    '08:00', '09:00', '10:00', '11:00',
    '14:00', '15:00', '16:00', '17:00'
  ],

  // Webhooks N8N
  n8n: {
    baseUrl: 'https://seu-n8n.com/webhook',
    endpoints: {
      agendar: '/agendar-consulta',
      consultar: '/consultar-agendamento',
      horariosOcupados: '/consultar-horarios-ocupados',
      dicas: '/dicas-saude'
    }
  }
}
```

## 🇧🇷 Timezones do Brasil

Se você quiser **forçar** um timezone específico ao invés de usar detecção automática, use um destes:

| Estado/Região | Timezone IANA |
|---------------|---------------|
| São Paulo, Rio, MG, PR, SC, RS | `America/Sao_Paulo` (UTC-3) |
| Mato Grosso do Sul, MT | `America/Campo_Grande` (UTC-4) |
| Bahia, Goiás, DF, TO | `America/Sao_Paulo` (UTC-3) |
| Acre | `America/Rio_Branco` (UTC-5) |
| Amazonas, RR, RO | `America/Manaus` (UTC-4) |
| Pernambuco, AL, SE, PB, RN, CE, PI, MA | `America/Fortaleza` (UTC-3) |
| Fernando de Noronha | `America/Noronha` (UTC-2) |

## 📝 Como Customizar para Outra Região

### 1. **Detecção Automática (RECOMENDADO)**

Deixe `timezone: null` e o sistema detecta automaticamente:

```javascript
timezone: null,  // ✅ Funciona em qualquer lugar!
timezoneFallback: 'America/Sao_Paulo',  // Caso falhe
```

### 2. **Timezone Forçado**

Se quiser forçar um timezone específico:

```javascript
timezone: 'America/Sao_Paulo',  // Força SP sempre
```

### 3. **Horários de Atendimento**

Edite os horários conforme a clínica:

```javascript
horarios: [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]
```

### 4. **Webhooks N8N**

Atualize a URL do seu servidor N8N:

```javascript
n8n: {
  baseUrl: 'https://seu-servidor-n8n.com/webhook',
  // endpoints ficam iguais, a menos que você mude
}
```

## 🚀 Deploy

Após editar `config.js`:

1. **Commit** as mudanças no Git
2. **Push** para o repositório
3. **Netlify** faz deploy automaticamente

Ou se preferir testar localmente:
```bash
# Abra index.html no navegador
open index.html
```

## 🧪 Testando Timezone

Abra o console do navegador (F12) e procure:

```
🌍 Timezone detectado: America/Sao_Paulo
⏰ Hora atual (America/Sao_Paulo): 14:30
```

Isso confirma que o timezone foi detectado corretamente!

## 💡 Vantagens da Detecção Automática

✅ **Funciona em qualquer região** sem alteração de código
✅ **Usuários em trânsito** veem horários corretos para onde estão
✅ **Menos manutenção** ao vender para outras clínicas
✅ **Fallback seguro** caso detecção falhe

## ⚠️ Importante

- **Não altere** os outros arquivos `.js` a menos que saiba o que está fazendo
- **Sempre teste** após alterar configurações
- **Mantenha backup** das configurações antes de modificar

## 📞 Suporte

Para dúvidas sobre configuração, consulte a documentação completa em `/readme-projeto.md`
