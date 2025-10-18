export const handler = async (event) => {
  try {
    const response = await fetch(
      "https://solitaryhornet-n8n.cloudfy.live/webhook-test/agendamento-consulta",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: event.body,
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // permite localhost e Netlify
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
};