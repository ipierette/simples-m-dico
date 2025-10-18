const N8N_URL = "https://solitaryhornet-n8n.cloudfy.live/webhook/agendamento-consulta";

export const handler = async (event) => {
  // Preflight (CORS)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  try {
    const resp = await fetch(N8N_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: event.body,
    });

    const text = await resp.text();

    return {
      statusCode: resp.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: JSON.stringify({ response: text || "OK" }),
    };

  } catch (err) {
    console.error("Erro no proxy Netlify → n8n:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
