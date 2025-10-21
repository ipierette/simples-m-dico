# 🔧 Guia de Customização do N8N

## 🌍 Como Mudar o Timezone do Workflow

### 📍 Localização Atual
**Campo Grande, MS** - `America/Campo_Grande` (UTC-4)

---

### ⚙️ Quando Preciso Mudar?

Sempre que vender o sistema para uma clínica em **outra região do Brasil** com timezone diferente.

---

### 🎯 Passo a Passo

#### **1. Abra o Workflow "Workflow de Lembretes"**

#### **2. Localize o nó "Edit Fields"**
- É o nó que vem depois de "Buscar Agendamentos Pendentes"
- Tem campos: horaAtual, dataAtual, telefone, etc.

#### **3. Edite os campos de data/hora:**

##### **Campo `horaAtual`:**
```javascript
// Encontre esta linha:
timeZone: 'America/Campo_Grande'

// Substitua por (se vender para SP por exemplo):
timeZone: 'America/Sao_Paulo'
```

##### **Campo `dataAtual`:**
```javascript
// Encontre esta linha:
timeZone: 'America/Campo_Grande'

// Substitua por (mesmo valor acima):
timeZone: 'America/Sao_Paulo'
```

#### **4. Salve o workflow**

---

### 📋 Timezones do Brasil

| Região | Estados | Timezone | UTC |
|--------|---------|----------|-----|
| **Centro-Oeste** | MS, MT | `America/Campo_Grande` | UTC-4 |
| **Sudeste/Sul/Nordeste** | SP, RJ, MG, RS, PR, SC, BA, GO, DF, etc | `America/Sao_Paulo` | UTC-3 |
| **Norte** | AM, RR, RO | `America/Manaus` | UTC-4 |
| **Acre** | AC | `America/Rio_Branco` | UTC-5 |

---

### ⚠️ IMPORTANTE

- ✅ **Frontend detecta automaticamente** - Não precisa mudar nada no site
- ✅ **Só muda no N8N** quando vender para outra região
- ✅ **Mude nas 2 linhas** (horaAtual E dataAtual)
- ✅ **Teste após mudar** enviando um lembrete de teste

---

### 🧪 Como Testar

1. **Crie um agendamento de teste** para daqui a 2h
2. **Execute o workflow manualmente** (botão "Test Workflow")
3. **Veja os logs** do nó "filtro":
   ```
   ⏰ Hora atual: 11:30
   📅 Data atual: 2025-10-21
   ```
4. **Confirme** que a hora está correta para o timezone configurado

---

### 💡 Dica

Para **90% dos clientes brasileiros**, use:
```
timeZone: 'America/Sao_Paulo'
```

Só mude se vender especificamente para MS, MT, AM ou AC.

---

### 📞 Suporte

Dúvidas? Consulte `CONFIGURACAO.md` para mais informações sobre timezones.
