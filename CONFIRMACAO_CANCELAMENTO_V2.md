# 🎨 Sistema de Confirmação e Cancelamento V2 - Link Único

Sistema profissional com página dedicada para gerenciamento de consultas, com os mesmos estilos do site médico.

---

## 🌟 **O QUE MUDOU (V2):**

### ❌ **ANTES (V1):**
- 2 links separados (confirmar e cancelar)
- Redirecionava direto para ação
- Página genérica de resposta

### ✅ **AGORA (V2):**
- **1 único link** profissional
- Página linda com estilos do site
- **Hierarquia visual clara:**
  - 🎯 **DESTAQUE:** Botões grandes de Confirmar/Cancelar
  - 🔹 **DISCRETO:** Links de WhatsApp e Voltar ao Site
- Informações completas da consulta
- Confirmação antes de executar ação
- Feedback visual em tempo real

---

## 📱 **COMO FUNCIONA:**

```
┌──────────────────────────────────────────────┐
│  LEMBRETE WHATSAPP                           │
│  "Clique aqui para gerenciar sua consulta"   │
│   👆 Link único: /gerenciar-consulta?id=...  │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│  PÁGINA DE GERENCIAMENTO                     │
│  ┌────────────────────────────────────────┐  │
│  │ 🏥 Logo + Título                       │  │
│  │                                        │  │
│  │ 📋 CARD COM DETALHES DA CONSULTA      │  │
│  │    • Status (badge colorido)          │  │
│  │    • Nome do paciente                 │  │
│  │    • Data e horário                   │  │
│  │    • Local                            │  │
│  │    • Convênio                         │  │
│  │                                        │  │
│  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │  │
│  │ ┃ ✅  CONFIRMAR CONSULTA  ← GRANDE ┃    │  │
│  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │  │
│  │                                        │  │
│  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │  │
│  │ ┃ 🔴  CANCELAR CONSULTA  ← GRANDE ┃    │  │
│  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │  │
│  │                                        │  │
│  │ ────────────────────────────────       │  │
│  │ 💬 WhatsApp   🏠 Voltar ← Discreto    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## 🗄️ **PASSO 1: Configurar Supabase**

Execute no **SQL Editor**:

```sql
-- Adicionar coluna para token de confirmação
ALTER TABLE agendamentos
ADD COLUMN IF NOT EXISTS token_confirmacao VARCHAR(100);

-- Adicionar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_agendamentos_token
ON agendamentos(token_confirmacao);
```

---

## 📄 **PASSO 2: Hospedar a Página HTML**

### **Opção A: Netlify (Recomendado)**

1. Copie o arquivo `gerenciar-consulta.html` para a raiz do seu projeto
2. Faça commit e push:
```bash
git add gerenciar-consulta.html
git commit -m "Adicionar página de gerenciamento de consultas"
git push
```
3. O Netlify fará deploy automático
4. URL final: `https://seu-site.netlify.app/gerenciar-consulta.html?id=123&token=abc...`

### **Opção B: N8N (Servir diretamente)**

Criar workflow que serve o HTML (ver JSON abaixo).

---

## ⚙️ **PASSO 3: Modificar Workflow de Agendamento**

Adicione **ANTES** do Supabase Insert:

### **Node: Code - "Gerar Token"**

```javascript
// Gerar token único de segurança
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

**Conectar:**
```
Webhook → Verificar Duplicatas → IF → Gerar Token → Supabase Insert
```

**No Supabase Insert**, adicione o campo:
- Field: `token_confirmacao`
- Value: `{{ $json.token_confirmacao }}`

---

## 🆕 **PASSO 4: Criar Workflow "Buscar Consulta"**

Retorna os dados da consulta para a página HTML.

### **Webhook:** `GET /buscar-consulta`

### **JSON Completo:**

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "path": "buscar-consulta",
        "responseMode": "responseNode",
        "options": {
          "responseHeaders": {
            "entries": [
              {
                "name": "Access-Control-Allow-Origin",
                "value": "*"
              },
              {
                "name": "Access-Control-Allow-Methods",
                "value": "GET, OPTIONS"
              }
            ]
          }
        }
      },
      "id": "webhook-buscar",
      "name": "Webhook - Buscar Consulta",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "const query = $input.first().json.query;\nconst id = query.id;\nconst token = query.token;\n\nif (!id || !token) {\n  throw new Error('Parâmetros inválidos');\n}\n\nreturn [{\n  json: {\n    id: parseInt(id),\n    token: token\n  }\n}];"
      },
      "id": "validar-params",
      "name": "Validar Parâmetros",
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
      "id": "buscar-supabase",
      "name": "Buscar no Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [680, 300],
      "credentials": {
        "supabaseApi": {
          "id": "SUA_CREDENCIAL",
          "name": "Supabase"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify($json) }}",
        "options": {}
      },
      "id": "response-json",
      "name": "Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [900, 300]
    }
  ],
  "connections": {
    "Webhook - Buscar Consulta": {
      "main": [[{"node": "Validar Parâmetros", "type": "main", "index": 0}]]
    },
    "Validar Parâmetros": {
      "main": [[{"node": "Buscar no Supabase", "type": "main", "index": 0}]]
    },
    "Buscar no Supabase": {
      "main": [[{"node": "Response", "type": "main", "index": 0}]]
    }
  }
}
```

---

## 🆕 **PASSO 5: Criar Workflow "Processar Confirmação"**

### **Webhook:** `POST /processar-confirmacao`

### **JSON Completo:**

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "processar-confirmacao",
        "responseMode": "responseNode",
        "options": {
          "responseHeaders": {
            "entries": [
              {
                "name": "Access-Control-Allow-Origin",
                "value": "*"
              }
            ]
          }
        }
      },
      "id": "webhook-confirmar",
      "name": "Webhook - Confirmar",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "const body = $input.first().json.body;\nconst id = body.id;\nconst token = body.token;\n\nif (!id || !token) {\n  throw new Error('Dados inválidos');\n}\n\nreturn [{\n  json: {\n    id: parseInt(id),\n    token: token\n  }\n}];"
      },
      "id": "validar-dados",
      "name": "Validar Dados",
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
          "id": "SUA_CREDENCIAL",
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
      "name": "IF - Existe?",
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
          "id": "SUA_CREDENCIAL",
          "name": "Supabase"
        }
      }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "SUA_URL_EVOLUTION/message/sendText/SUA_INSTANCIA",
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
              "value": "✅ *Consulta Confirmada!*\\n\\nOlá {{ $json.nome }}, sua consulta foi confirmada com sucesso!\\n\\n📅 *Data:* {{ $json.data_preferida }}\\n🕐 *Horário:* {{ $json.horario_preferido }}\\n📍 *Local:* Clínica Dra. Roberta Silva\\n\\n*Importante:*\\n• Chegue com 15 minutos de antecedência\\n• Traga documento com foto\\n• Traga carteirinha do convênio\\n\\nNos vemos em breve! 💙"
            }
          ]
        }
      },
      "id": "whatsapp-confirma",
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
        "respondWith": "json",
        "responseBody": "{\"success\": true, \"message\": \"Consulta confirmada\"}",
        "options": {}
      },
      "id": "response-sucesso",
      "name": "Response Sucesso",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1560, 200]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\"success\": false, \"message\": \"Link inválido\"}",
        "options": {
          "responseCode": 400
        }
      },
      "id": "response-erro",
      "name": "Response Erro",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1120, 400]
    }
  ],
  "connections": {
    "Webhook - Confirmar": {
      "main": [[{"node": "Validar Dados", "type": "main", "index": 0}]]
    },
    "Validar Dados": {
      "main": [[{"node": "Buscar Agendamento", "type": "main", "index": 0}]]
    },
    "Buscar Agendamento": {
      "main": [[{"node": "IF - Existe?", "type": "main", "index": 0}]]
    },
    "IF - Existe?": {
      "main": [
        [{"node": "Atualizar Status", "type": "main", "index": 0}],
        [{"node": "Response Erro", "type": "main", "index": 0}]
      ]
    },
    "Atualizar Status": {
      "main": [[{"node": "WhatsApp - Confirmação", "type": "main", "index": 0}]]
    },
    "WhatsApp - Confirmação": {
      "main": [[{"node": "Response Sucesso", "type": "main", "index": 0}]]
    }
  }
}
```

---

## 🆕 **PASSO 6: Criar Workflow "Processar Cancelamento"**

### **Webhook:** `POST /processar-cancelamento`

Estrutura **idêntica** ao de confirmação, mas:
- Status atualizado para `"cancelado"`
- Mensagem WhatsApp diferente

### **JSON Completo:**

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "processar-cancelamento",
        "responseMode": "responseNode",
        "options": {
          "responseHeaders": {
            "entries": [
              {
                "name": "Access-Control-Allow-Origin",
                "value": "*"
              }
            ]
          }
        }
      },
      "id": "webhook-cancelar",
      "name": "Webhook - Cancelar",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "const body = $input.first().json.body;\nconst id = body.id;\nconst token = body.token;\n\nif (!id || !token) {\n  throw new Error('Dados inválidos');\n}\n\nreturn [{\n  json: {\n    id: parseInt(id),\n    token: token\n  }\n}];"
      },
      "id": "validar-dados-cancel",
      "name": "Validar Dados",
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
          "id": "SUA_CREDENCIAL",
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
      "name": "IF - Existe?",
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
          "id": "SUA_CREDENCIAL",
          "name": "Supabase"
        }
      }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "SUA_URL_EVOLUTION/message/sendText/SUA_INSTANCIA",
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
              "value": "🔴 *Consulta Cancelada*\\n\\nOlá {{ $json.nome }}, sua consulta foi cancelada conforme solicitado.\\n\\n📅 *Data:* {{ $json.data_preferida }}\\n🕐 *Horário:* {{ $json.horario_preferido }}\\n\\nSe precisar reagendar, acesse nosso site! 💙\\n\\n_Esperamos vê-lo em breve._"
            }
          ]
        }
      },
      "id": "whatsapp-cancela",
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
        "respondWith": "json",
        "responseBody": "{\"success\": true, \"message\": \"Consulta cancelada\"}",
        "options": {}
      },
      "id": "response-sucesso-cancel",
      "name": "Response Sucesso",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1560, 200]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\"success\": false, \"message\": \"Link inválido\"}",
        "options": {
          "responseCode": 400
        }
      },
      "id": "response-erro-cancel",
      "name": "Response Erro",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1120, 400]
    }
  ],
  "connections": {
    "Webhook - Cancelar": {
      "main": [[{"node": "Validar Dados", "type": "main", "index": 0}]]
    },
    "Validar Dados": {
      "main": [[{"node": "Buscar Agendamento", "type": "main", "index": 0}]]
    },
    "Buscar Agendamento": {
      "main": [[{"node": "IF - Existe?", "type": "main", "index": 0}]]
    },
    "IF - Existe?": {
      "main": [
        [{"node": "Atualizar Status - Cancelado", "type": "main", "index": 0}],
        [{"node": "Response Erro", "type": "main", "index": 0}]
      ]
    },
    "Atualizar Status - Cancelado": {
      "main": [[{"node": "WhatsApp - Cancelamento", "type": "main", "index": 0}]]
    },
    "WhatsApp - Cancelamento": {
      "main": [[{"node": "Response Sucesso", "type": "main", "index": 0}]]
    }
  }
}
```

---

## 📱 **PASSO 7: Modificar Workflow de Lembrete**

No node **WhatsApp - Lembrete**, altere o campo `text`:

```javascript
const nome = $json.nome;
const data = $json.data_preferida;
const horario = $json.horario_preferido;
const id = $json.id;
const token = $json.token_confirmacao;

// URL da página de gerenciamento
const linkGerenciar = `https://seu-site.netlify.app/gerenciar-consulta.html?id=${id}&token=${token}`;

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
👆 *Clique aqui para gerenciar sua consulta:*

${linkGerenciar}

_(Você pode confirmar ou cancelar pelo link acima)_
━━━━━━━━━━━━━━━━━━━━

_Aguardamos você! 💙_`;
```

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

- [ ] Executar SQL no Supabase (coluna `token_confirmacao`)
- [ ] Modificar workflow de agendamento (node "Gerar Token")
- [ ] Hospedar `gerenciar-consulta.html` (Netlify ou N8N)
- [ ] Criar workflow `/buscar-consulta` (GET)
- [ ] Criar workflow `/processar-confirmacao` (POST)
- [ ] Criar workflow `/processar-cancelamento` (POST)
- [ ] Modificar workflow de lembrete (adicionar link único)
- [ ] **Ajustar URLs** em `gerenciar-consulta.html`:
  - Linha 572: `N8N_BASE_URL`
  - Linha 573: `WHATSAPP_CLINICA`
- [ ] Testar fluxo completo

---

## 🎨 **DESIGN DA PÁGINA**

### **Destaques Visuais:**

✅ **HIERARQUIA CLARA:**
- Botões de Confirmar/Cancelar: **Grandes, coloridos, com sombras**
- Botões de WhatsApp/Voltar: **Pequenos, discretos, no rodapé**

✅ **RESPONSIVO:**
- Mobile-first
- Cards adaptáveis
- Touch-friendly

✅ **ESTADOS:**
- Loading (spinner)
- Sucesso (verde)
- Erro (vermelho)
- Info (amarelo)

✅ **ANIMAÇÕES:**
- Fade in suave
- Hover nos botões
- Feedback visual

---

## 📝 **EXEMPLO DE MENSAGEM WHATSAPP:**

```
🔔 Lembrete de Consulta

Olá João Silva! 👋

Você tem uma consulta agendada para hoje:

📅 Data: 23/10/2025
🕐 Horário: 14:00
📍 Local: Clínica Dra. Roberta Silva
       Av. Paulista, 1000 - São Paulo

Importante:
• Chegue com 15 minutos de antecedência
• Traga documento com foto
• Traga carteirinha do convênio (se houver)
• Traga exames anteriores (se houver)

━━━━━━━━━━━━━━━━━━━━
👆 Clique aqui para gerenciar sua consulta:

https://seu-site.netlify.app/gerenciar-consulta.html?id=123&token=abc...

(Você pode confirmar ou cancelar pelo link acima)
━━━━━━━━━━━━━━━━━━━━

Aguardamos você! 💙
```

---

## 🔒 **SEGURANÇA**

✅ Token único de 64 caracteres
✅ Validação dupla: ID + Token
✅ CORS configurado
✅ Confirmação antes de ações
✅ Status visual claro
✅ Desabilita botões após ação

---

## 💡 **MELHORIAS FUTURAS**

- Analytics de confirmações
- Notificar médico em cancelamentos
- Opção de reagendar direto na página
- PWA para adicionar à tela inicial
- Push notifications

---

**Dúvidas? Estou aqui! 🚀**
