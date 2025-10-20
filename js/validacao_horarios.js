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
  const inputData = document.getElementById('data');
  const feedbackDiv = document.getElementById('feedback-data');

  if (!dataStr) {
    selectHorario.innerHTML = '<option value="">Selecione primeiro uma data</option>';
    selectHorario.disabled = true;
    return;
  }

  selectHorario.disabled = true;
  selectHorario.innerHTML = '<option value="">Carregando horários...</option>';

  try {
    const horariosOcupados = await buscarHorariosOcupados(dataStr);
    const todosOcupados = horariosOcupados.length >= HORARIOS_DISPONIVEIS.length;

    // Verifica se o dia está totalmente cheio
    if (todosOcupados) {
      if (feedbackDiv) {
        feedbackDiv.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; color: #ff6b6b; margin-top: 8px;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#ff6b6b" stroke-width="1.5"/>
              <path d="M8 4V8M8 11H8.01" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>Data indisponível: todos os horários estão ocupados</span>
          </div>
        `;
      }

      inputData.style.borderColor = '#ff6b6b';
      inputData.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';
      selectHorario.innerHTML = '<option value="">Nenhum horário disponível</option>';
      selectHorario.disabled = true;
      return;
    }

    // Recria opções do select normalmente
    selectHorario.innerHTML = '<option value="">Selecione um horário</option>';

    HORARIOS_DISPONIVEIS.forEach(horario => {
      const option = document.createElement('option');
      option.value = horario;

      if (horariosOcupados.includes(horario)) {
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
    if (feedbackDiv) feedbackDiv.innerHTML = '';

  } catch (erro) {
    console.error('Erro ao atualizar horários:', erro);
    selectHorario.innerHTML = '<option value="">Erro ao carregar horários</option>';
  }
}

// ========================================
// VALIDAR INPUT DE DATA
// ========================================
async function validarData(input) {
  const data = new Date(input.value + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let mensagemErro = '';
  let valido = true;

  if (data < hoje) {
    mensagemErro = 'Data já passou';
    valido = false;
  } else if (isFinalDeSemana(data)) {
    mensagemErro = 'Não atendemos aos finais de semana';
    valido = false;
  } else {
    const feriado = isFeriado(data);
    if (feriado.sim) {
      mensagemErro = `Feriado: ${feriado.nome}`;
      valido = false;
    }
  }

  const feedbackDiv = document.getElementById('feedback-data');
  const dataStr = input.value;

  // Verifica ocupação total do dia (via n8n)
  if (valido && dataStr) {
    const horariosOcupados = await buscarHorariosOcupados(dataStr);
    if (horariosOcupados.length >= HORARIOS_DISPONIVEIS.length) {
      mensagemErro = 'Data indisponível: todos os horários estão ocupados';
      valido = false;
    }
  }

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
    document.getElementById('horario').value = '';
    atualizarHorarios('');
    return false;
  } else {
    input.style.borderColor = 'var(--accent-cyan)';
    input.style.backgroundColor = 'transparent';
    if (feedbackDiv) feedbackDiv.innerHTML = '';
    atualizarHorarios(dataStr);
    return true;
  }
}

// ========================================
// ⚡ Atualizar lista de datas totalmente ocupadas (14 dias, paralelo)
// ========================================
async function atualizarDatasIndisponiveis() {
  const hoje = new Date();
  const DIAS_A_VERIFICAR = 14;
  const datasIndisponiveis = new Set();

  // Fonte única de verdade para comparação (mesmo set do <select>)
  const HORARIOS_DISPONIVEIS = [
    "08:00", "09:00", "10:00", "11:00",
    "14:00", "15:00", "16:00", "17:00"
  ];

  // Monta a lista de datas úteis (já pula fds/feriados)
  const datasValidas = [];
  for (let i = 0; i < DIAS_A_VERIFICAR; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    const iso = d.toISOString().split('T')[0];

    if (isFinalDeSemana(d)) {
      datasIndisponiveis.add(iso);
      continue;
    }
    const feriado = isFeriado(d);
    if (feriado.sim) {
      datasIndisponiveis.add(iso);
      continue;
    }
    datasValidas.push(iso);
  }

  // Consulta paralela ao n8n
  const resultados = await Promise.allSettled(
    datasValidas.map(async iso => {
      const ocup = await buscarHorariosOcupados(iso); // já retorna ["HH:MM", ...]
      return { iso, ocup };
    })
  );

  // Só marca como indisponível se TODOS os horários estiverem ocupados
  resultados.forEach(r => {
    if (r.status !== 'fulfilled') return;
    const { iso, ocup } = r.value;
    const todosOcupados = HORARIOS_DISPONIVEIS.every(h => ocup.includes(h));
    if (todosOcupados) datasIndisponiveis.add(iso);
  });

  const lista = [...datasIndisponiveis];
  console.log('📅 Datas realmente indisponíveis:', lista);
  return lista;
}

// ========================================
// 📅 BLOQUEAR DATAS NO CALENDÁRIO HTML5 (melhorado)
// ========================================
async function configurarInputData() {
  const inputData = document.getElementById('data');
  if (!inputData) return;

  // 🔹 Intervalo permitido: hoje até +90 dias
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  inputData.min = hoje.toISOString().split('T')[0];
  const maxData = new Date();
  maxData.setDate(maxData.getDate() + 90);
  inputData.max = maxData.toISOString().split('T')[0];

  // 🔹 Área de feedback visual
  let feedbackDiv = document.getElementById('feedback-data');
  if (!feedbackDiv) {
    feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'feedback-data';
    inputData.parentNode.appendChild(feedbackDiv);
  }

  // 🔹 Carrega dias indisponíveis via n8n (14 dias à frente)
  const datasIndisponiveis = await atualizarDatasIndisponiveis();
  console.log('📅 Datas realmente indisponíveis:', datasIndisponiveis);

  // 🔸 Função utilitária local
  const bloquear = (campo, msg) => {
    campo.value = '';
    campo.blur();
    campo.style.borderColor = '#ff6b6b';
    campo.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';
    if (feedbackDiv) {
      feedbackDiv.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;color:#ff6b6b;margin-top:8px;">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="#ff6b6b" stroke-width="1.5"/>
            <path d="M8 4V8M8 11H8.01" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>${msg}</span>
        </div>
      `;
    }
  };

  // 🔍 Quando o usuário digita manualmente uma data
  inputData.addEventListener('input', function () {
    const valor = this.value;
    if (!valor) return;

    const data = new Date(valor + 'T00:00:00');
    const feriado = isFeriado(data);

    if (data < hoje) return bloquear(this, 'Data já passou');
    if (isFinalDeSemana(data)) return bloquear(this, 'Não atendemos aos finais de semana');
    if (feriado.sim) return bloquear(this, `Feriado: ${feriado.nome}`);
    if (datasIndisponiveis.includes(valor)) return bloquear(this, 'Data indisponível para agendamento');

    // Se tudo certo, limpa feedback
    this.style.borderColor = 'var(--accent-cyan)';
    this.style.backgroundColor = 'transparent';
    if (feedbackDiv) feedbackDiv.innerHTML = '';
  });

  // 🔍 Quando o usuário seleciona uma data no calendário
  inputData.addEventListener('change', async function () {
    const valor = this.value;
    if (!valor) return;

    const data = new Date(valor + 'T00:00:00');
    const feriado = isFeriado(data);

    if (data < hoje) return bloquear(this, 'Data já passou');
    if (isFinalDeSemana(data)) return bloquear(this, 'Não atendemos aos finais de semana');
    if (feriado.sim) return bloquear(this, `Feriado: ${feriado.nome}`);
    if (datasIndisponiveis.includes(valor)) return bloquear(this, 'Data indisponível para agendamento');

    // Caso a data seja válida → valida no n8n
    await validarData(this);
  });
}

  // 🔍 Validação de data ao mudar (seleção no calendário)
  inputData.addEventListener('change', async function () {
    if (this.value) {
      if (datasIndisponiveis.includes(this.value)) {
        this.value = '';
        this.style.borderColor = '#ff6b6b';
        this.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';
        if (feedbackDiv) {
          feedbackDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; color: #ff6b6b; margin-top: 8px;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#ff6b6b" stroke-width="1.5"/>
                <path d="M8 4V8M8 11H8.01" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>Data indisponível para agendamento</span>
            </div>
          `;
        }
        return;
      }
      await validarData(this);
    }
  });
}

// 🎯 Atualiza horários automaticamente ao escolher a data
document.addEventListener('DOMContentLoaded', () => {
  const inputData = document.getElementById('data');
  if (inputData) {
    inputData.addEventListener('change', async (e) => {
      const iso = e.target.value; // input type="date" já está em YYYY-MM-DD
      if (iso) {
        await atualizarHorarios(iso);
      }
    });
  }
});

// ========================================
// 🕒 Atualizar horários disponíveis ao selecionar uma data
// ========================================
async function atualizarHorariosDisponiveis(dataSelecionada) {
  const selectHorario = document.querySelector("#horario_preferido");

  // Selecione o <select> correto
  if (!selectHorario) return;

  // Limpa e recria o campo
  selectHorario.innerHTML = '<option value="">Selecione um horário</option>';

  // Lista base de horários (deve ser a mesma usada em HORARIOS_DISPONIVEIS)
  const HORARIOS_DISPONIVEIS = [
    "08:00", "09:00", "10:00", "11:00",
    "14:00", "15:00", "16:00", "17:00"
  ];

// ===============================
// 🔎 Buscar horários ocupados (parse seguro)
// ===============================
const CACHE_OCUPADOS = new Map(); // evita chamadas repetidas no mesmo dia

async function buscarHorariosOcupados(dataISO) {
  if (!dataISO) return [];

  // Cache local por data
  if (CACHE_OCUPADOS.has(dataISO)) {
    return CACHE_OCUPADOS.get(dataISO);
  }

  const url = `${CONFIG.webhookConsultarOcupados}?data=${encodeURIComponent(dataISO)}`;

  try {
    const res = await fetch(url, { method: 'GET' });

    // HTTP não-OK → não considerar como lotado; apenas retornar vazio
    if (!res.ok) {
      console.warn('⚠️ HTTP não OK em consultar horários:', res.status, dataISO);
      CACHE_OCUPADOS.set(dataISO, []);
      return [];
    }

    // Alguns proxies podem retornar corpo vazio → tratar
    const text = await res.text();
    if (!text) {
      console.warn('⚠️ Corpo vazio para', dataISO);
      CACHE_OCUPADOS.set(dataISO, []);
      return [];
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.warn('⚠️ Falha ao parsear JSON para', dataISO, '→', e);
      CACHE_OCUPADOS.set(dataISO, []);
      return [];
    }

    // O seu n8n pode devolver { ocupados:[{data,horario}...], horarios:[...], total:n }
    const listFromOcupados = Array.isArray(json?.ocupados)
      ? json.ocupados
          .map(o => (typeof o === 'string' ? o : o?.horario))
          .filter(Boolean)
      : [];

    const listFromHorarios = Array.isArray(json?.horarios) ? json.horarios : [];

    // normaliza para "HH:MM"
    const horas = (listFromHorarios.length ? listFromHorarios : listFromOcupados)
      .filter(Boolean)
      .map(h => String(h).slice(0, 5));

    CACHE_OCUPADOS.set(dataISO, horas);
    return horas;
  } catch (err) {
    console.error('❌ Erro de rede ao consultar horários ocupados:', err);
    CACHE_OCUPADOS.set(dataISO, []);
    return [];
  }
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
}