// ========================================
// CONFIGURAÇÃO - URLs DO N8N
// ========================================
const N8N_BASE_URL = 'https://solitaryhornet-n8n.cloudfy.live/webhook';
const N8N_AGENDAR = `${N8N_BASE_URL}/agendar-consulta`;
const N8N_CONSULTAR = `${N8N_BASE_URL}/consultar-agendamento`;
const N8N_DICAS = `${N8N_BASE_URL}/dicas-saude`;
const N8N_HORARIOS_OCUPADOS = `${N8N_BASE_URL}/consultar-horarios-ocupados`;

// ========================================
// FERIADOS NACIONAIS BRASILEIROS
// ========================================
const FERIADOS_FIXOS = [
  { mes: 1, dia: 1, nome: 'Ano Novo' },
  { mes: 4, dia: 21, nome: 'Tiradentes' },
  { mes: 5, dia: 1, nome: 'Dia do Trabalho' },
  { mes: 9, dia: 7, nome: 'Independência' },
  { mes: 10, dia: 12, nome: 'N. Sra. Aparecida' },
  { mes: 11, dia: 2, nome: 'Finados' },
  { mes: 11, dia: 15, nome: 'Proclamação da República' },
  { mes: 11, dia: 20, nome: 'Consciência Negra' },
  { mes: 12, dia: 25, nome: 'Natal' }
];

// Calcular Páscoa (Algoritmo de Meeus)
function calcularPascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(ano, mes - 1, dia);
}

// Feriados móveis baseados na Páscoa
function getFeriadosMoveis(ano) {
  const pascoa = calcularPascoa(ano);
  const feriados = [];
  
  // Carnaval (47 dias antes)
  const carnaval = new Date(pascoa);
  carnaval.setDate(carnaval.getDate() - 47);
  feriados.push({ data: carnaval, nome: 'Carnaval' });
  
  // Sexta-feira Santa (2 dias antes)
  const sextaSanta = new Date(pascoa);
  sextaSanta.setDate(sextaSanta.getDate() - 2);
  feriados.push({ data: sextaSanta, nome: 'Sexta-feira Santa' });
  
  // Corpus Christi (60 dias depois)
  const corpusChristi = new Date(pascoa);
  corpusChristi.setDate(corpusChristi.getDate() + 60);
  feriados.push({ data: corpusChristi, nome: 'Corpus Christi' });
  
  return feriados;
}

// Verificar se é feriado
function isFeriado(data) {
  const ano = data.getFullYear();
  const mes = data.getMonth() + 1;
  const dia = data.getDate();
  
  // Feriados fixos
  const fixo = FERIADOS_FIXOS.find(f => f.mes === mes && f.dia === dia);
  if (fixo) return { sim: true, nome: fixo.nome };
  
  // Feriados móveis
  const moveis = getFeriadosMoveis(ano);
  const movel = moveis.find(f => 
    f.data.getMonth() === data.getMonth() && 
    f.data.getDate() === dia
  );
  
  if (movel) return { sim: true, nome: movel.nome };
  
  return { sim: false };
}

// Verificar se é final de semana
function isFinalDeSemana(data) {
  const dia = data.getDay();
  return dia === 0 || dia === 6; // Domingo ou Sábado
}

// ========================================
// CONSULTAR HORÁRIOS OCUPADOS NO N8N
// ========================================
let cacheHorarios = {};

async function buscarHorariosOcupados(dataStr) {
  // Usar cache se disponível
  if (cacheHorarios[dataStr]) {
    return cacheHorarios[dataStr];
  }
  
  try {
    const response = await fetch(`${N8N_HORARIOS_OCUPADOS}?data=${dataStr}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Erro ao buscar horários:', response.status);
      return [];
    }
    
    const resultado = await response.json();
    
    // Extrair horários do formato: { ocupados: [{ data, horario }, ...] }
    const horariosOcupados = (resultado.ocupados || [])
      .filter(item => item.data === dataStr)
      .map(item => item.horario);
    
    // Salvar no cache
    cacheHorarios[dataStr] = horariosOcupados;
    
    return horariosOcupados;
    
  } catch (erro) {
    console.error('Erro ao consultar horários ocupados:', erro);
    return [];
  }
}

// ========================================
// ATUALIZAR SELECT DE HORÁRIOS
// ========================================
const HORARIOS_DISPONIVEIS = [
  '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00'
];

async function atualizarHorarios(dataStr) {
  const selectHorario = document.getElementById('horario');
  
  if (!dataStr) {
    // Resetar para estado inicial
    selectHorario.innerHTML = '<option value="">Selecione primeiro uma data</option>';
    selectHorario.disabled = true;
    return;
  }
  
  // Mostrar loading
  selectHorario.disabled = true;
  selectHorario.innerHTML = '<option value="">Carregando horários...</option>';
  
  try {
    // Buscar horários ocupados
    const horariosOcupados = await buscarHorariosOcupados(dataStr);
    
    // Reconstruir as opções
    selectHorario.innerHTML = '<option value="">Selecione um horário</option>';
    
    HORARIOS_DISPONIVEIS.forEach(horario => {
      const option = document.createElement('option');
      option.value = horario;
      
      const ocupado = horariosOcupados.includes(horario);
      
      if (ocupado) {
        option.textContent = `${horario} - OCUPADO`;
        option.disabled = true;
        option.style.color = '#ff6b6b';
        option.style.fontWeight = 'bold';
      } else {
        option.textContent = horario;
      }
      
      selectHorario.appendChild(option);
    });
    
    selectHorario.disabled = false;
    
  } catch (erro) {
    console.error('Erro ao atualizar horários:', erro);
    selectHorario.innerHTML = '<option value="">Erro ao carregar horários</option>';
  }
}

// ========================================
// VALIDAR INPUT DE DATA
// ========================================
function validarData(input) {
  const data = new Date(input.value + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  let mensagemErro = '';
  let valido = true;
  
  // Data no passado
  if (data < hoje) {
    mensagemErro = 'Data já passou';
    valido = false;
  }
  
  // Final de semana
  else if (isFinalDeSemana(data)) {
    mensagemErro = 'Não atendemos aos finais de semana';
    valido = false;
  }
  
  // Feriado
  else {
    const feriado = isFeriado(data);
    if (feriado.sim) {
      mensagemErro = `Feriado: ${feriado.nome}`;
      valido = false;
    }
  }
  
  // Exibir feedback visual
  const feedbackDiv = document.getElementById('feedback-data');
  
  if (!valido) {
    input.style.borderColor = '#ff6b6b';
    input.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';
    
    if (feedbackDiv) {
      feedbackDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; color: #ff6b6b; margin-top: 8px;">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="#ff6b6b" stroke-width="1.5"/>
            <path d="M8 4V8M8 11H8.01" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>${mensagemErro}</span>
        </div>
      `;
    }
    
    // Limpar horário
    document.getElementById('horario').value = '';
    atualizarHorarios('');
    
    return false;
  } else {
    input.style.borderColor = 'var(--accent-cyan)';
    input.style.backgroundColor = 'transparent';
    
    if (feedbackDiv) {
      feedbackDiv.innerHTML = '';
    }
    
    // Atualizar horários disponíveis
    atualizarHorarios(input.value);
    
    return true;
  }
}

// ========================================
// BLOQUEAR DATAS NO CALENDARIO (HTML5)
// ========================================
function configurarInputData() {
  const inputData = document.getElementById('data');
  
  if (!inputData) return;
  
  // Data mínima: hoje
  const hoje = new Date().toISOString().split('T')[0];
  inputData.min = hoje;
  
  // Data máxima: 90 dias no futuro
  const maxData = new Date();
  maxData.setDate(maxData.getDate() + 90);
  inputData.max = maxData.toISOString().split('T')[0];
  
  // Adicionar div de feedback se não existir
  if (!document.getElementById('feedback-data')) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'feedback-data';
    inputData.parentNode.appendChild(feedbackDiv);
  }
  
  // Validar quando mudar
  inputData.addEventListener('change', function() {
    if (this.value) {
      validarData(this);
    }
  });
  
  // Validar ao digitar (alguns navegadores permitem)
  inputData.addEventListener('input', function() {
    if (this.value.length === 10) {
      validarData(this);
    }
  });
}

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Sistema de validação de datas e horários carregado');
  
  // Configurar input de data
  configurarInputData();
  
  // Estado inicial do select de horários
  const selectHorario = document.getElementById('horario');
  if (selectHorario) {
    selectHorario.innerHTML = '<option value="">Selecione primeiro uma data</option>';
    selectHorario.disabled = true;
  }
});

// ========================================
// LIMPAR CACHE
// ========================================
function limparCache() {
  cacheHorarios = {};
  console.log('🗑️ Cache de horários limpo');
}

// ========================================
// FUNÇÕES AUXILIARES EXPORTADAS
// ========================================
window.validacaoHorarios = {
  isFeriado,
  isFinalDeSemana,
  buscarHorariosOcupados,
  atualizarHorarios,
  validarData,
  limparCache
};