const N8N_URL_DICAS = "https://solitaryhornet-n8n.cloudfy.live/webhook/dicas-saude";

const sanitizeDicas = (str) => String(str).trim().replace(/<[^>]*>/g, '').substring(0, 500);

const validarDicas = (sintomas) => {
  if (!sintomas || sintomas.length < 20) {
    return { valid: false, error: 'Mínimo 20 caracteres' };
  }
  if (sintomas.length > 500) {
    return { valid: false, error: 'Máximo 500 caracteres' };
  }
  return { valid: true };
};

export const handlerDicas = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Método não permitido" })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    const validacao = validarDicas(data.sintomas);
    if (!validacao.valid) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: validacao.error })
      };
    }
    
    const payload = {
      sintomas: sanitizeDicas(data.sintomas),
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(N8N_URL_DICAS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
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
        dicas: result.dicas || result.output || result.response
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
        error: "Erro ao processar"
      })
    };
  }
};