# 🔗 Sistema de Confirmação e Cancelamento de Consultas

Este guia implementa links de confirmação e cancelamento nas mensagens de lembrete do WhatsApp.

---

## 📋 **Visão Geral**

### **Fluxo Completo:**

1. **Agendamento** → Gera token único de segurança
2. **Lembrete (2h antes)** → Inclui links de Confirmar/Cancelar
3. **Usuário clica no link** → N8N valida e processa
4. **Resposta automática** → Confirma ação por WhatsApp

---

## 🗄️ **PASSO 1: Atualizar Tabela no Supabase**

Execute no **SQL Editor** do Supabase:

```sql
-- Adicionar coluna para token de confirmação
ALTER TABLE agendamentos
ADD COLUMN IF NOT EXISTS token_confirmacao VARCHAR(100);

-- Adicionar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_agendamentos_token
ON agendamentos(token_confirmacao);
```

---

## ⚙️ **PASSO 2: Modificar Workflow de Agendamento**

### **Adicione um novo node "Gerar Token" ANTES do Supabase Insert:**

**Node: Code - "Gerar Token"**
```javascript
// Gerar token único para confirmação/cancelamento
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');

const input = $input.first().json;

return [{
  json: {
    ...input,
    token_confirmacao: token
  }
}];
```

**Conecte:**
```
Webhook Agendamento → Verificar Duplicatas → IF → Gerar Token → Supabase Insert
```

**Modifique o Supabase Insert** para incluir o novo campo:

No node **Supabase - Inserir Agendamento**, adicione:
- Field: `token_confirmacao`
- Value: `{{ $json.token_confirmacao }}`

---

## 🆕 **PASSO 3: Criar Workflow de CONFIRMAÇÃO**

### **Nome:** `Confirmar Consulta`
### **Webhook URL:** `/confirmar-consulta`

**Estrutura:**
```
Webhook → Validar Token → Buscar Agendamento → IF (Existe?)
  → SIM: Atualizar Status → Enviar WhatsApp Confirmação → Response
  → NÃO: Response Erro
```

### **JSON Completo do Workflow:**

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "path": "confirmar-consulta",
        "responseMode": "lastNode",
        "options": {}
      },
      "id": "webhook-confirmar",
      "name": "Webhook - Confirmar",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "webhookId": "confirmar-consulta"
    },
    {
      "parameters": {
        "jsCode": "// Extrair parâmetros da URL\nconst query = $input.first().json.query;\nconst id = query.id;\nconst token = query.token;\n\nif (!id || !token) {\n  throw new Error('Parâmetros inválidos');\n}\n\nreturn [{\n  json: {\n    id: parseInt(id),\n    token: token\n  }\n}];"
      },
      "id": "validar-token",
      "name": "Validar Token",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "operation": "get",
        "tableId": "agendamentos",
        "filters": {
          "conditions": [
            {
              "keyName": "id",
              "keyValue": "={{ $json.id }}"
            },
            {
              "keyName": "token_confirmacao",
              "keyValue": "={{ $json.token }}"
            }
          ]
        }
      },
      "id": "buscar-agendamento",
      "name": "Buscar Agendamento",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [680, 300],
      "credentials": {
        "supabaseApi": {
          "id": "SUA_CREDENCIAL_SUPABASE",
          "name": "Supabase"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.id }}",
              "operation": "isNotEmpty"
            }
          ]
        }
      },
      "id": "if-existe",
      "name": "IF - Agendamento Existe?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "operation": "update",
        "tableId": "agendamentos",
        "filterType": "manual",
        "matchBy": "id",
        "keysToMatch": {
          "values": [
            {
              "key": "id",
              "value": "={{ $json.id }}"
            }
          ]
        },
        "fieldsToSet": {
          "values": [
            {
              "name": "status",
              "value": "confirmado"
            }
          ]
        }
      },
      "id": "atualizar-status",
      "name": "Atualizar Status",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1120, 200],
      "credentials": {
        "supabaseApi": {
          "id": "SUA_CREDENCIAL_SUPABASE",
          "name": "Supabase"
        }
      }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=SUA_URL_EVOLUTION_API/message/sendText/SUA_INSTANCIA",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "number",
              "value": "={{ $json.telefone }}"
            },
            {
              "name": "text",
              "value": "✅ *Consulta Confirmada!*\\n\\nOlá {{ $json.nome }}, sua consulta foi confirmada com sucesso!\\n\\n📅 Data: {{ $json.data_preferida }}\\n🕐 Horário: {{ $json.horario_preferido }}\\n\\n*Importante:*\\n• Chegue com 15 minutos de antecedência\\n• Traga documento com foto\\n• Traga carteirinha do convênio\\n\\nNos vemos em breve! 💙"
            }
          ]
        },
        "options": {}
      },
      "id": "whatsapp-confirmacao",
      "name": "WhatsApp - Confirmação",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1340, 200],
      "credentials": {
        "httpHeaderAuth": {
          "id": "SUA_CREDENCIAL_EVOLUTION",
          "name": "Evolution API"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "=<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Consulta Confirmada</title>\n  <style>\n    body {\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\n      background: linear-gradient(135deg, #00d4aa 0%, #6c5ce7 100%);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      min-height: 100vh;\n      margin: 0;\n      padding: 20px;\n    }\n    .card {\n      background: white;\n      border-radius: 20px;\n      padding: 40px;\n      max-width: 500px;\n      text-align: center;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n    }\n    .icon {\n      font-size: 80px;\n      margin-bottom: 20px;\n    }\n    h1 { color: #00d4aa; margin: 0 0 10px; }\n    p { color: #666; line-height: 1.6; }\n    .info {\n      background: #f8f9fa;\n      border-radius: 12px;\n      padding: 20px;\n      margin: 20px 0;\n    }\n    .info strong { color: #333; display: block; margin-bottom: 8px; }\n  </style>\n</head>\n<body>\n  <div class=\"card\">\n    <div class=\"icon\">✅</div>\n    <h1>Consulta Confirmada!</h1>\n    <p>Sua consulta foi confirmada com sucesso.</p>\n    <div class=\"info\">\n      <strong>📅 {{ $json.data_preferida }}</strong>\n      <strong>🕐 {{ $json.horario_preferido }}</strong>\n    </div>\n    <p>Você receberá uma confirmação via WhatsApp em breve.</p>\n    <p><small>Pode fechar esta janela.</small></p>\n  </div>\n</body>\n</html>",
        "options": {}
      },
      "id": "response-sucesso",
      "name": "Response - Sucesso",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1560, 200]
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "=<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Link Inválido</title>\n  <style>\n    body {\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\n      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      min-height: 100vh;\n      margin: 0;\n      padding: 20px;\n    }\n    .card {\n      background: white;\n      border-radius: 20px;\n      padding: 40px;\n      max-width: 500px;\n      text-align: center;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n    }\n    .icon { font-size: 80px; margin-bottom: 20px; }\n    h1 { color: #ff6b6b; margin: 0 0 10px; }\n    p { color: #666; line-height: 1.6; }\n  </style>\n</head>\n<body>\n  <div class=\"card\">\n    <div class=\"icon\">❌</div>\n    <h1>Link Inválido</h1>\n    <p>Este link de confirmação é inválido ou já foi utilizado.</p>\n    <p>Entre em contato conosco se precisar de ajuda.</p>\n  </div>\n</body>\n</html>",
        "options": {}
      },
      "id": "response-erro",
      "name": "Response - Erro",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1120, 400]
    }
  ],
  "connections": {
    "Webhook - Confirmar": {
      "main": [[{ "node": "Validar Token", "type": "main", "index": 0 }]]
    },
    "Validar Token": {
      "main": [[{ "node": "Buscar Agendamento", "type": "main", "index": 0 }]]
    },
    "Buscar Agendamento": {
      "main": [[{ "node": "IF - Agendamento Existe?", "type": "main", "index": 0 }]]
    },
    "IF - Agendamento Existe?": {
      "main": [
        [{ "node": "Atualizar Status", "type": "main", "index": 0 }],
        [{ "node": "Response - Erro", "type": "main", "index": 0 }]
      ]
    },
    "Atualizar Status": {
      "main": [[{ "node": "WhatsApp - Confirmação", "type": "main", "index": 0 }]]
    },
    "WhatsApp - Confirmação": {
      "main": [[{ "node": "Response - Sucesso", "type": "main", "index": 0 }]]
    }
  },
  "pinData": {}
}
```

---

## 🆕 **PASSO 4: Criar Workflow de CANCELAMENTO**

### **Nome:** `Cancelar Consulta`
### **Webhook URL:** `/cancelar-consulta`

**Estrutura similar à confirmação, mas:**
- Atualiza status para `"cancelado"`
- Mensagem WhatsApp diferente
- Página de resposta diferente

### **JSON Completo do Workflow:**

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "path": "cancelar-consulta",
        "responseMode": "lastNode",
        "options": {}
      },
      "id": "webhook-cancelar",
      "name": "Webhook - Cancelar",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "webhookId": "cancelar-consulta"
    },
    {
      "parameters": {
        "jsCode": "// Extrair parâmetros da URL\nconst query = $input.first().json.query;\nconst id = query.id;\nconst token = query.token;\n\nif (!id || !token) {\n  throw new Error('Parâmetros inválidos');\n}\n\nreturn [{\n  json: {\n    id: parseInt(id),\n    token: token\n  }\n}];"
      },
      "id": "validar-token-cancel",
      "name": "Validar Token",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "operation": "get",
        "tableId": "agendamentos",
        "filters": {
          "conditions": [
            {
              "keyName": "id",
              "keyValue": "={{ $json.id }}"
            },
            {
              "keyName": "token_confirmacao",
              "keyValue": "={{ $json.token }}"
            }
          ]
        }
      },
      "id": "buscar-agendamento-cancel",
      "name": "Buscar Agendamento",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [680, 300],
      "credentials": {
        "supabaseApi": {
          "id": "SUA_CREDENCIAL_SUPABASE",
          "name": "Supabase"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.id }}",
              "operation": "isNotEmpty"
            }
          ]
        }
      },
      "id": "if-existe-cancel",
      "name": "IF - Agendamento Existe?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "operation": "update",
        "tableId": "agendamentos",
        "filterType": "manual",
        "matchBy": "id",
        "keysToMatch": {
          "values": [
            {
              "key": "id",
              "value": "={{ $json.id }}"
            }
          ]
        },
        "fieldsToSet": {
          "values": [
            {
              "name": "status",
              "value": "cancelado"
            }
          ]
        }
      },
      "id": "atualizar-status-cancel",
      "name": "Atualizar Status - Cancelado",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1120, 200],
      "credentials": {
        "supabaseApi": {
          "id": "SUA_CREDENCIAL_SUPABASE",
          "name": "Supabase"
        }
      }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=SUA_URL_EVOLUTION_API/message/sendText/SUA_INSTANCIA",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "number",
              "value": "={{ $json.telefone }}"
            },
            {
              "name": "text",
              "value": "🔴 *Consulta Cancelada*\\n\\nOlá {{ $json.nome }}, sua consulta foi cancelada conforme solicitado.\\n\\n📅 Data: {{ $json.data_preferida }}\\n🕐 Horário: {{ $json.horario_preferido }}\\n\\nSe precisar reagendar, é só acessar nosso site! 💙\\n\\n_Esperamos vê-lo em breve._"
            }
          ]
        },
        "options": {}
      },
      "id": "whatsapp-cancelamento",
      "name": "WhatsApp - Cancelamento",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1340, 200],
      "credentials": {
        "httpHeaderAuth": {
          "id": "SUA_CREDENCIAL_EVOLUTION",
          "name": "Evolution API"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "=<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Consulta Cancelada</title>\n  <style>\n    body {\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\n      background: linear-gradient(135deg, #ff9a76 0%, #ff6b6b 100%);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      min-height: 100vh;\n      margin: 0;\n      padding: 20px;\n    }\n    .card {\n      background: white;\n      border-radius: 20px;\n      padding: 40px;\n      max-width: 500px;\n      text-align: center;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n    }\n    .icon { font-size: 80px; margin-bottom: 20px; }\n    h1 { color: #ff6b6b; margin: 0 0 10px; }\n    p { color: #666; line-height: 1.6; }\n    .info {\n      background: #f8f9fa;\n      border-radius: 12px;\n      padding: 20px;\n      margin: 20px 0;\n    }\n    .info strong { color: #333; display: block; margin-bottom: 8px; }\n    .btn {\n      display: inline-block;\n      background: linear-gradient(135deg, #00d4aa 0%, #6c5ce7 100%);\n      color: white;\n      text-decoration: none;\n      padding: 12px 30px;\n      border-radius: 25px;\n      margin-top: 20px;\n      font-weight: 600;\n    }\n  </style>\n</head>\n<body>\n  <div class=\"card\">\n    <div class=\"icon\">🔴</div>\n    <h1>Consulta Cancelada</h1>\n    <p>Sua consulta foi cancelada com sucesso.</p>\n    <div class=\"info\">\n      <strong>📅 {{ $json.data_preferida }}</strong>\n      <strong>🕐 {{ $json.horario_preferido }}</strong>\n    </div>\n    <p>Você receberá uma confirmação via WhatsApp.</p>\n    <a href=\"https://SEU-SITE.netlify.app\" class=\"btn\">Reagendar Consulta</a>\n    <p><small>Pode fechar esta janela.</small></p>\n  </div>\n</body>\n</html>",
        "options": {}
      },
      "id": "response-cancelado",
      "name": "Response - Cancelado",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1560, 200]
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "=<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Link Inválido</title>\n  <style>\n    body {\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\n      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      min-height: 100vh;\n      margin: 0;\n      padding: 20px;\n    }\n    .card {\n      background: white;\n      border-radius: 20px;\n      padding: 40px;\n      max-width: 500px;\n      text-align: center;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n    }\n    .icon { font-size: 80px; margin-bottom: 20px; }\n    h1 { color: #ff6b6b; margin: 0 0 10px; }\n    p { color: #666; line-height: 1.6; }\n  </style>\n</head>\n<body>\n  <div class=\"card\">\n    <div class=\"icon\">❌</div>\n    <h1>Link Inválido</h1>\n    <p>Este link de cancelamento é inválido ou já foi utilizado.</p>\n    <p>Entre em contato conosco se precisar de ajuda.</p>\n  </div>\n</body>\n</html>",
        "options": {}
      },
      "id": "response-erro-cancel",
      "name": "Response - Erro",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1120, 400]
    }
  ],
  "connections": {
    "Webhook - Cancelar": {
      "main": [[{ "node": "Validar Token", "type": "main", "index": 0 }]]
    },
    "Validar Token": {
      "main": [[{ "node": "Buscar Agendamento", "type": "main", "index": 0 }]]
    },
    "Buscar Agendamento": {
      "main": [[{ "node": "IF - Agendamento Existe?", "type": "main", "index": 0 }]]
    },
    "IF - Agendamento Existe?": {
      "main": [
        [{ "node": "Atualizar Status - Cancelado", "type": "main", "index": 0 }],
        [{ "node": "Response - Erro", "type": "main", "index": 0 }]
      ]
    },
    "Atualizar Status - Cancelado": {
      "main": [[{ "node": "WhatsApp - Cancelamento", "type": "main", "index": 0 }]]
    },
    "WhatsApp - Cancelamento": {
      "main": [[{ "node": "Response - Cancelado", "type": "main", "index": 0 }]]
    }
  },
  "pinData": {}
}
```

---

## 📱 **PASSO 5: Modificar Workflow de LEMBRETE**

No node **WhatsApp - Lembrete**, altere o campo `text` para:

```javascript
const nome = $json.nome;
const data = $json.data_preferida;
const horario = $json.horario_preferido;
const id = $json.id;
const token = $json.token_confirmacao;

const baseUrl = 'https://solitaryhornet-n8n.cloudfy.live/webhook';
const linkConfirmar = `${baseUrl}/confirmar-consulta?id=${id}&token=${token}`;
const linkCancelar = `${baseUrl}/cancelar-consulta?id=${id}&token=${token}`;

return `🔔 *Lembrete de Consulta*

Olá ${nome}! 👋

Você tem uma consulta agendada para *hoje*:

📅 *Data:* ${data}
🕐 *Horário:* ${horario}
📍 *Local:* Clínica Dra. Roberta Silva
       Av. Paulista, 1000 - São Paulo

*Importante:*
• Chegue com 15 minutos de antecedência
• Traga documento com foto
• Traga carteirinha do convênio (se houver)
• Traga exames anteriores (se houver)

━━━━━━━━━━━━━━━━━━━━
*Confirme ou cancele sua consulta:*

🟢 *Confirmar:*
${linkConfirmar}

🔴 *Cancelar:*
${linkCancelar}
━━━━━━━━━━━━━━━━━━━━

_Aguardamos você! 💙_`;
```

---

## ✅ **Checklist de Implementação**

- [ ] Executar SQL no Supabase (adicionar coluna `token_confirmacao`)
- [ ] Modificar workflow de agendamento (adicionar node "Gerar Token")
- [ ] Criar workflow "Confirmar Consulta" (`/confirmar-consulta`)
- [ ] Criar workflow "Cancelar Consulta" (`/cancelar-consulta`)
- [ ] Modificar workflow de lembrete (adicionar links na mensagem)
- [ ] Testar fluxo completo:
  1. Criar agendamento → Verificar se token foi gerado
  2. Simular lembrete → Verificar se links aparecem
  3. Clicar em "Confirmar" → Status deve mudar para "confirmado"
  4. Criar novo agendamento e clicar em "Cancelar" → Status deve mudar para "cancelado"

---

## 🔒 **Segurança**

✅ **Token único de 64 caracteres** (impossível de adivinhar)
✅ **Validação de ID + Token** (ambos precisam existir e corresponder)
✅ **Token usado uma vez** (após usar, pode invalidar)
✅ **Links funcionam apenas para o agendamento específico**

### **OPCIONAL - Invalidar token após uso:**

Adicione no workflow de confirmação/cancelamento, após atualizar o status:

**Node: Code - "Invalidar Token"**
```javascript
// Limpar token para evitar reutilização
return [{
  json: {
    ...$json,
    token_confirmacao: null
  }
}];
```

E adicione um **Supabase Update** para limpar o campo `token_confirmacao`.

---

## 📝 **Exemplo de Mensagem WhatsApp Final:**

```
🔔 Lembrete de Consulta

Olá João Silva! 👋

Você tem uma consulta agendada para hoje:

📅 Data: 2025-10-23
🕐 Horário: 14:00
📍 Local: Clínica Dra. Roberta Silva
       Av. Paulista, 1000 - São Paulo

Importante:
• Chegue com 15 minutos de antecedência
• Traga documento com foto
• Traga carteirinha do convênio (se houver)
• Traga exames anteriores (se houver)

━━━━━━━━━━━━━━━━━━━━
Confirme ou cancele sua consulta:

🟢 Confirmar:
https://solitaryhornet-n8n.cloudfy.live/webhook/confirmar-consulta?id=123&token=abc123...

🔴 Cancelar:
https://solitaryhornet-n8n.cloudfy.live/webhook/cancelar-consulta?id=123&token=abc123...
━━━━━━━━━━━━━━━━━━━━

Aguardamos você! 💙
```

---

## 💡 **Próximos Passos (Opcional):**

1. **Adicionar Analytics:** Rastrear quantas confirmações/cancelamentos
2. **Notificar médico:** Enviar WhatsApp para médico quando houver cancelamento
3. **Reagendamento automático:** Oferecer horários alternativos ao cancelar
4. **Botões interativos:** Se Evolution API suportar, usar botões nativos do WhatsApp

---

**Dúvidas? Estou aqui para ajudar! 🚀**
