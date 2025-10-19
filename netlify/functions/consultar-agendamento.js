const N8N_URL_CONSULTAR = "https://solitaryhornet-n8n.cloudfy.live/webhook/consultar-agendamento";

const sanitizeConsulta = (str) => String(str).trim().replace(/<[^>]*>/g, '').substring(0, 100);

export const handlerConsultar = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Método não permitido" })
    };
  }

  try {
    const nome = event.queryStringParameters?.nome;
    
    if (!nome || nome.length < 3) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Nome inválido" })
      };
    }
    
    const nomeLimpo = sanitizeConsulta(nome);
    
    const response = await fetch(`${N8N_URL_CONSULTAR}?nome=${encodeURIComponent(nomeLimpo)}`, {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(`n8n status ${response.status}`);
    }

    const result = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        agendamentos: result.agendamentos || []
      })
    };

  } catch (error) {
    console.error("Erro:", error);
    
    return {
      statusCode: 500,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        error: "Erro ao consultar"
      })
    };
  }
};
