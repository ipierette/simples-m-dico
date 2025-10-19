const N8N_URL = "https://solitaryhornet-n8n.cloudfy.live/webhook/agendar-consulta";

const sanitize = (str) => String(str).trim().replace(/<[^>]*>/g, '').substring(0, 500);

const validar = (data) => {
  const errors = [];
  
  if (!data.nome || data.nome.length < 3) errors.push('Nome inválido');
  
  const tel = (data.telefone || '').replace(/\D/g, '');
  if (tel.length < 10 || tel.length > 11) errors.push('Telefone inválido');
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Email inválido');
  
  const data_escolhida = new Date(data.dataPreferida);
  if (data_escolhida < new Date()) errors.push('Data inválida');
  
  if (!data.sintomas || data.sintomas.length < 10) errors.push('Sintomas inválidos');
  
  return errors;
};

export const handler = async (event) => {
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
    
    const errors = validar(data);
    if (errors.length > 0) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: errors.join(', ') })
      };
    }
    
    const payload = {
      nome: sanitize(data.nome),
      telefone: data.telefone.replace(/\D/g, ''),
      email: sanitize(data.email.toLowerCase()),
      convenio: sanitize(data.convenio || 'Particular'),
      dataPreferida: data.dataPreferida,
      horarioPreferido: data.horarioPreferido,
      sintomas: sanitize(data.sintomas),
      status: 'pendente',
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(N8N_URL, {
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
        message: "Agendamento realizado com sucesso",
        data: result
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
        error: "Erro ao processar agendamento"
      })
    };
  }
};