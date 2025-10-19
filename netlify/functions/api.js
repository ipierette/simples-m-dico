// netlify/functions/api.js
const N8N_AGENDAR = "https://solitaryhornet-n8n.cloudfy.live/webhook/agendar-consulta";   // igual ao agendar-consulta.js
const N8N_CONSULTAR = "https://solitaryhornet-n8n.cloudfy.live/webhook/consultar-agendamento"; // igual ao consultar-agendamento.js
const N8N_DICAS = "https://solitaryhornet-n8n.cloudfy.live/webhook/dicas-saude"; // igual ao dicas-ia.js

// (opcional) novo endpoint n8n para disponibilidade por data:
const N8N_OCUPADOS = "https://solitaryhornet-n8n.cloudfy.live/webhook/consultar-horarios-ocupados"; 

const sanitize = (str, limit = 500) => String(str || '')
  .trim()
  .replace(/<[^>]*>/g, '')
  .substring(0, limit);

const badRequest = (msg) => ({
  statusCode: 400,
  headers: { "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify({ error: msg })
});

const ok = (data) => ({
  statusCode: 200,
  headers: { 
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
});

const cors = {
  statusCode: 204,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  },
  body: ""
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors;

  const action = (event.queryStringParameters?.action || '').toLowerCase();

  try {
    // ---------- AGENDAR ----------
    if (action === "agendar" && event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}");

      // Validações compatíveis com sua lambda existente (agendar-consulta.js)
      const errors = [];
      if (!data.nome || data.nome.length < 3) errors.push('Nome inválido');
      const tel = (data.telefone || '').replace(/\D/g, '');
      if (tel.length < 10 || tel.length > 11) errors.push('Telefone inválido');
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Email inválido');
      if (!data.dataPreferida || new Date(data.dataPreferida) < new Date()) errors.push('Data inválida');
      if (!data.horarioPreferido) errors.push('Horário inválido');
      if (!data.sintomas || data.sintomas.length < 10) errors.push('Sintomas inválidos');
      if (errors.length) return badRequest(errors.join(', '));

      // Monta payload como sua função existente faz
      const payload = {
        nome: sanitize(data.nome),
        telefone: tel,
        email: sanitize(data.email.toLowerCase()),
        convenio: sanitize(data.convenio || 'Particular'),
        dataPreferida: data.dataPreferida,
        horarioPreferido: data.horarioPreferido,
        sintomas: sanitize(data.sintomas),
        status: 'pendente',
        timestamp: new Date().toISOString()
      };

      const resp = await fetch(N8N_AGENDAR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`n8n status ${resp.status}`);

      const result = await resp.json();
      return ok({ success: true, message: "Agendamento realizado com sucesso", data: result });
    }

    // ---------- CONSULTAR ----------
    if (action === "consultar" && event.httpMethod === "GET") {
      // Você pode escolher consultar por nome OU telefone.
      const nome = event.queryStringParameters?.nome;
      const telefone = (event.queryStringParameters?.telefone || '').replace(/\D/g, '');

      // Exemplo por telefone: se quiser por nome, troque validação e query
      if (!telefone || telefone.length < 10) return badRequest("Telefone inválido");

      const resp = await fetch(`${N8N_CONSULTAR}?telefone=${encodeURIComponent(telefone)}`);
      if (!resp.ok) throw new Error(`n8n status ${resp.status}`);
      const result = await resp.json();
      return ok({ success: true, agendamentos: result.agendamentos || [] });
    }

    // ---------- DICAS ----------
    if (action === "dicas" && event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}");
      const sintomas = sanitize(data.sintomas, 500);
      if (!sintomas || sintomas.length < 20) return badRequest('Mínimo 20 caracteres');
      if (sintomas.length > 500) return badRequest('Máximo 500 caracteres');

      const resp = await fetch(N8N_DICAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sintomas, timestamp: new Date().toISOString() })
      });
      if (!resp.ok) throw new Error(`n8n status ${resp.status}`);

      const result = await resp.json();
      return ok({ success: true, dicas: result.dicas || result.output || result.response });
    }

    // ---------- OCUPADOS POR DATA ----------
    if (action === "ocupados" && event.httpMethod === "GET") {
      const data = event.queryStringParameters?.data;
      if (!data) return badRequest("Data não informada");

      const resp = await fetch(`${N8N_OCUPADOS}?data=${encodeURIComponent(data)}`);
      if (!resp.ok) throw new Error(`n8n status ${resp.status}`);
      const result = await resp.json();

      // Espera: { ocupados: [{ data: "YYYY-MM-DD", horario: "HH:MM" }, ...] }
      return ok({ success: true, ocupados: result.ocupados || [] });
    }

    // Ação inválida / método incorreto
    return badRequest("Ação ou método inválido");
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Erro interno" })
    };
  }
};

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.handler = async (event) => {
  const { path, httpMethod, queryStringParameters, body } = event;

  // Endpoint de horários ocupados
  if (path.includes('/api/horarios-ocupados') && httpMethod === 'GET') {
    const data = queryStringParameters?.data;
    if (!data) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Data não informada' }) };
    }

    // Substitua pelo seu webhook n8n real:
    const webhookUrl = 'https://seu-n8n.cloudfy.live/webhook/consultar-horarios-ocupados';
    const response = await fetch(`${webhookUrl}?data=${data}`);
    const result = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  }

  // Fallback genérico
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Rota não encontrada' }),
  };
};