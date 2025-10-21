/* =========================================================================
   CONFIGURAÇÃO GLOBAL DO SISTEMA
   =========================================================================

   Este arquivo centraliza todas as configurações que podem variar
   entre diferentes clínicas ou regiões.

   IMPORTANTE: Após editar, faça o deploy para aplicar as mudanças.
   ========================================================================= */

const CLINIC_CONFIG = {
  // ====================================
  // INFORMAÇÕES DA CLÍNICA
  // ====================================
  nome: 'Clínica Dra. Roberta Silva',
  endereco: 'Av. Paulista, 1000 - São Paulo',
  telefone: '(11) 3456-7890',
  whatsappMedico: '+5567984098786', // Para receber notificações

  // ====================================
  // TIMEZONE
  // ====================================
  // Se deixar null, detecta automaticamente do navegador do usuário
  // Se quiser forçar um timezone específico, use formato IANA:
  // Exemplos: 'America/Sao_Paulo', 'America/Campo_Grande', 'America/Manaus'
  timezone: null, // null = detecção automática

  // Fallback caso detecção automática falhe
  timezoneFallback: 'America/Campo_Grande',

  // ====================================
  // HORÁRIOS DE ATENDIMENTO
  // ====================================
  horarios: [
    '08:00', '09:00', '10:00', '11:00',
    '14:00', '15:00', '16:00', '17:00'
  ],

  // ====================================
  // WEBHOOKS N8N
  // ====================================
  n8n: {
    baseUrl: 'https://solitaryhornet-n8n.cloudfy.live/webhook',
    endpoints: {
      agendar: '/agendar-consulta',
      consultar: '/consultar-agendamento',
      horariosOcupados: '/consultar-horarios-ocupados',
      dicas: '/dicas-saude'
    }
  },

  // ====================================
  // CONVÊNIOS ACEITOS (opcional)
  // ====================================
  convenios: [
    'Unimed',
    'Bradesco Saúde',
    'SulAmérica',
    'Amil',
    'Particular'
  ],

  // ====================================
  // MENSAGENS WHATSAPP (templates)
  // ====================================
  mensagens: {
    confirmacao: {
      titulo: '✅ Agendamento Confirmado!',
      rodape: '_Você receberá um lembrete 2 horas antes da consulta._'
    },
    lembrete: {
      titulo: '🔔 Lembrete de Consulta',
      instrucoes: [
        'Documento com foto',
        'Carteirinha do convênio',
        'Exames anteriores (se houver)'
      ],
      antecedencia: '_Chegue com 15 minutos de antecedência._'
    }
  }
};

// ====================================
// EXPORTAÇÃO
// ====================================
window.CLINIC_CONFIG = CLINIC_CONFIG;

// Criar CONFIG global para uso nos scripts
window.CONFIG = {
  // Webhooks
  n8nBase: CLINIC_CONFIG.n8n.baseUrl,
  webhookAgendar: `${CLINIC_CONFIG.n8n.baseUrl}${CLINIC_CONFIG.n8n.endpoints.agendar}`,
  webhookConsultar: `${CLINIC_CONFIG.n8n.baseUrl}${CLINIC_CONFIG.n8n.endpoints.consultar}`,
  webhookHorariosOcupados: `${CLINIC_CONFIG.n8n.baseUrl}${CLINIC_CONFIG.n8n.endpoints.horariosOcupados}`,
  webhookDicas: `${CLINIC_CONFIG.n8n.baseUrl}${CLINIC_CONFIG.n8n.endpoints.dicas}`,

  // Configurações diretas
  horarios: CLINIC_CONFIG.horarios,
  timezone: CLINIC_CONFIG.timezone,
  timezoneFallback: CLINIC_CONFIG.timezoneFallback
};

// Log de inicialização
console.log('⚙️ Configuração carregada:', {
  clinica: CLINIC_CONFIG.nome,
  timezone: CLINIC_CONFIG.timezone || 'Automático',
  horarios: CLINIC_CONFIG.horarios.length + ' horários disponíveis'
});
