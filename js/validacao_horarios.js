/* =========================================================================
   CONFIG – Carrega configurações centralizadas
   ========================================================================= */
// Aguarda que config.js seja carregado primeiro (via script tag no HTML)
const CONFIG = window.CLINIC_CONFIG || {
  n8n: {
    baseUrl: 'https://solitaryhornet-n8n.cloudfy.live/webhook',
    endpoints: { horariosOcupados: '/consultar-horarios-ocupados' }
  },
  horarios: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
  timezone: null,
  timezoneFallback: 'America/Campo_Grande'
};

const N8N_BASE_URL = CONFIG.n8n.baseUrl;
const N8N_HORARIOS_OCUPADOS = `${N8N_BASE_URL}${CONFIG.n8n.endpoints.horariosOcupados}`;

/* =========================================================================
   CONFIG – TIMEZONE (detecção automática ou forçado)
   ========================================================================= */
function detectarTimezone() {
  // Se há timezone forçado na config, usa ele
  if (CONFIG.timezone) {
    console.log(`🌍 Timezone forçado pela configuração: ${CONFIG.timezone}`);
    return CONFIG.timezone;
  }

  try {
    // Tenta detectar timezone do navegador
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (timezone) {
      console.log(`🌍 Timezone detectado automaticamente: ${timezone}`);
      return timezone;
    }
  } catch (e) {
    console.warn('⚠️ Falha ao detectar timezone:', e);
  }

  // Fallback da configuração
  const fallback = CONFIG.timezoneFallback;
  console.log(`🌍 Usando timezone fallback: ${fallback}`);
  return fallback;
}

// Timezone global detectado automaticamente ou forçado
const TIMEZONE_LOCAL = detectarTimezone();

/* =========================================================================
   Regras de negócio – horários disponíveis por dia
   ========================================================================= */
const HORARIOS_DISPONIVEIS = CONFIG.horarios;

/* =========================================================================
   Feriados (fixos e móveis) + utilitários de data
   ========================================================================= */
const FERIADOS_FIXOS = [
  { mes: 1,  dia: 1,  nome: 'Ano Novo' },
  { mes: 4,  dia: 21, nome: 'Tiradentes' },
  { mes: 5,  dia: 1,  nome: 'Dia do Trabalho' },
  { mes: 9,  dia: 7,  nome: 'Independência do Brasil' },
  { mes: 10, dia: 12, nome: 'N. Sra. Aparecida' },
  { mes: 11, dia: 2,  nome: 'Finados' },
  { mes: 11, dia: 15, nome: 'Proclamação da República' },
  { mes: 11, dia: 20, nome: 'Consciência Negra' },
  { mes: 12, dia: 25, nome: 'Natal' },
];

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

function getFeriadosMoveis(ano) {
  const pascoa = calcularPascoa(ano);
  const out = [];
  const carnaval = new Date(pascoa); carnaval.setDate(carnaval.getDate() - 47);
  out.push({ data: carnaval, nome: 'Carnaval' });
  const sexta = new Date(pascoa); sexta.setDate(sexta.getDate() - 2);
  out.push({ data: sexta, nome: 'Sexta-feira Santa' });
  const corpus = new Date(pascoa); corpus.setDate(corpus.getDate() + 60);
  out.push({ data: corpus, nome: 'Corpus Christi' });
  return out;
}

function isFeriado(data) {
  const ano = data.getFullYear();
  const mes = data.getMonth() + 1;
  const dia = data.getDate();

  const fixo = FERIADOS_FIXOS.find(f => f.mes === mes && f.dia === dia);
  if (fixo) return { sim: true, nome: fixo.nome };

  const moveis = getFeriadosMoveis(ano);
  const movel = moveis.find(f => f.data.getMonth() === data.getMonth() && f.data.getDate() === dia);
  return movel ? { sim: true, nome: movel.nome } : { sim: false };
}

function isFinalDeSemana(data) {
  const d = data.getDay();
  return d === 0 || d === 6;
}

/* =========================================================================
   Backend: consultar horários ocupados (robusto + cache)
   ========================================================================= */
const CACHE_OCUPADOS = new Map();

async function buscarHorariosOcupados(dataISO) {
  if (!dataISO) return [];

  console.log(`🔍 Buscando horários para data: ${dataISO}`);

  if (CACHE_OCUPADOS.has(dataISO)) {
    console.log(`📦 Usando cache para ${dataISO}`);
    return CACHE_OCUPADOS.get(dataISO);
  }

  const url = `${N8N_HORARIOS_OCUPADOS}?data=${encodeURIComponent(dataISO)}`;
  console.log(`🌐 Requisição: ${url}`);

  try {
    const res = await fetch(url, { method: 'GET' });

    if (!res.ok) {
      console.warn('⚠️ HTTP não OK em consultar horários:', res.status, dataISO);
      CACHE_OCUPADOS.set(dataISO, []);
      return [];
    }

    const text = await res.text();
    if (!text) {
      console.warn('⚠️ Corpo vazio para', dataISO);
      CACHE_OCUPADOS.set(dataISO, []);
      return [];
    }

    let json;
    try { json = JSON.parse(text); }
    catch (e) {
      console.warn('⚠️ Falha ao parsear JSON para', dataISO, e);
      CACHE_OCUPADOS.set(dataISO, []);
      return [];
    }

    const listFromOcupados = Array.isArray(json?.ocupados)
      ? json.ocupados.map(o => (typeof o === 'string' ? o : o?.horario)).filter(Boolean)
      : [];

    const listFromHorarios = Array.isArray(json?.horarios) ? json.horarios : [];

    const horarios = (listFromHorarios.length ? listFromHorarios : listFromOcupados)
      .filter(Boolean)
      .map(h => String(h).slice(0, 5)); // normaliza HH:MM

    CACHE_OCUPADOS.set(dataISO, horarios);
    return horarios;
  } catch (err) {
    console.error('❌ Erro de rede ao consultar horários ocupados:', err);
    CACHE_OCUPADOS.set(dataISO, []);
    return [];
  }
}

/* =========================================================================
   UI: atualizar <select id="horario"> para uma data
   ========================================================================= */
async function atualizarHorarios(dataISO) {
  const selectHorario = document.getElementById('horario');
  const feedbackDiv  = document.getElementById('feedback-data');

  if (!selectHorario) return;
  if (!dataISO) {
    selectHorario.innerHTML = '<option value="">Selecione primeiro uma data</option>';
    selectHorario.disabled = true;
    return;
  }

  selectHorario.disabled = true;
  selectHorario.innerHTML = '<option value="">Carregando horários...</option>';

  try {
    const horariosOcupados = await buscarHorariosOcupados(dataISO);

    // 🔹 Verifica se é HOJE e pega hora atual (timezone MS)
    const hoje = new Date().toLocaleDateString('en-CA'); // formato YYYY-MM-DD
    const isHoje = (dataISO === hoje);

    let horaAtualMinutos = 0;
    if (isHoje) {
      const agora = new Date().toLocaleTimeString('pt-BR', {
        timeZone: TIMEZONE_LOCAL,
        hour12: false
      });
      const [h, m] = agora.split(':').map(Number);
      horaAtualMinutos = (h * 60) + m;
      console.log(`⏰ Hora atual (${TIMEZONE_LOCAL}): ${agora} (${horaAtualMinutos} minutos)`);
    }

    // 🔹 Filtra horários: ocupados + passados
    const horariosIndisponiveis = new Set(horariosOcupados);

    if (isHoje) {
      HORARIOS_DISPONIVEIS.forEach(hora => {
        const [h, m] = hora.split(':').map(Number);
        const horarioMinutos = (h * 60) + m;

        if (horarioMinutos <= horaAtualMinutos) {
          horariosIndisponiveis.add(hora);
        }
      });
    }

    // Se todos indisponíveis → dia cheio
    const todosIndisponiveis = HORARIOS_DISPONIVEIS.every(h => horariosIndisponiveis.has(h));
    if (todosIndisponiveis) {
      selectHorario.innerHTML = '<option value="">Nenhum horário disponível</option>';
      if (feedbackDiv) {
        const motivo = isHoje ? 'todos os horários já passaram ou estão ocupados' : 'todos os horários estão ocupados';
        feedbackDiv.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;color:#ff6b6b;margin-top:8px;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#ff6b6b" stroke-width="1.5"/>
              <path d="M8 4V8M8 11H8.01" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>Data indisponível: ${motivo}</span>
          </div>
        `;
      }
      return;
    }

    // Recria as opções, marcando ocupados e passados
    selectHorario.innerHTML = '<option value="">Selecione um horário</option>';
    HORARIOS_DISPONIVEIS.forEach(hora => {
      const opt = document.createElement('option');
      opt.value = hora;

      const [h, m] = hora.split(':').map(Number);
      const horarioMinutos = (h * 60) + m;
      const jaPassou = isHoje && horarioMinutos <= horaAtualMinutos;
      const ocupado = horariosOcupados.includes(hora);

      if (jaPassou) {
        opt.textContent = `${hora} — já passou`;
        opt.disabled = true;
        opt.style.color = '#888';
        opt.style.fontStyle = 'italic';
      } else if (ocupado) {
        opt.textContent = `${hora} — ocupado`;
        opt.disabled = true;
        opt.style.color = '#ff6b6b';
        opt.style.fontWeight = '600';
      } else {
        opt.textContent = hora;
      }

      selectHorario.appendChild(opt);
    });

    selectHorario.disabled = false;
    if (feedbackDiv) feedbackDiv.innerHTML = '';
  } catch (erro) {
    console.error('Erro ao atualizar horários:', erro);
    selectHorario.innerHTML = '<option value="">Erro ao carregar horários</option>';
  }
}

/* =========================================================================
   UI: validação de data + mensagens
   ========================================================================= */
function bloquear(campo, msg) {
  let feedbackDiv = document.getElementById('feedback-data');
  if (!feedbackDiv) {
    feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'feedback-data';
    campo.parentNode.appendChild(feedbackDiv);
  }

  campo.value = '';
  campo.style.borderColor = '#ff6b6b';
  campo.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';

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

async function validarData(input) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const valor = input.value;
  if (!valor) return false;

  const data = new Date(valor + 'T00:00:00');
  const feriado = isFeriado(data);

  if (data < hoje)            return bloquear(input, 'Data já passou'), false;
  if (isFinalDeSemana(data))  return bloquear(input, 'Não atendemos aos finais de semana'), false;
  if (feriado.sim)            return bloquear(input, `Feriado: ${feriado.nome}`), false;

  // Data ok → atualiza horários
  input.style.borderColor = 'var(--accent-cyan)';
  input.style.backgroundColor = 'transparent';
  const feedbackDiv = document.getElementById('feedback-data');
  if (feedbackDiv) feedbackDiv.innerHTML = '';
  await atualizarHorarios(valor);
  return true;
}

/* =========================================================================
   Calendário: bloquear datas passadas, fds, feriados e dias cheios
   Também busca dias cheios nos próximos 14 dias (paralelo)
   ========================================================================= */
async function atualizarDatasIndisponiveis() {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const DIAS_A_VERIFICAR = 14;
  const datasIndisponiveis = new Set();

  // monta datas úteis
  const datasValidas = [];
  for (let i = 0; i < DIAS_A_VERIFICAR; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    const iso = d.toISOString().split('T')[0];

    if (isFinalDeSemana(d)) { datasIndisponiveis.add(iso); continue; }
    const feriado = isFeriado(d);
    if (feriado.sim)        { datasIndisponiveis.add(iso); continue; }

    datasValidas.push(iso);
  }

  // consulta paralela
  const resultados = await Promise.allSettled(
    datasValidas.map(async iso => {
      const ocup = await buscarHorariosOcupados(iso); // ['HH:MM', ...]
      return { iso, ocup };
    })
  );

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

async function configurarInputData() {
  const inputData = document.getElementById('data');
  if (!inputData) return;

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const max = new Date(); max.setDate(max.getDate() + 90);

  // limita intervalo nativo do input date
  inputData.min = hoje.toISOString().split('T')[0];
  inputData.max = max.toISOString().split('T')[0];

  // garante container de feedback
  let feedbackDiv = document.getElementById('feedback-data');
  if (!feedbackDiv) {
    feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'feedback-data';
    inputData.parentNode.appendChild(feedbackDiv);
  }

  // carrega dias indisponíveis (14 dias)
  const datasIndisponiveis = await atualizarDatasIndisponiveis();

  // valida ao digitar
  inputData.addEventListener('input', function () {
    const valor = this.value;
    if (!valor) return;
    const data = new Date(valor + 'T00:00:00');
    const feriado = isFeriado(data);

    if (data < hoje)                         return bloquear(this, 'Data já passou');
    if (isFinalDeSemana(data))               return bloquear(this, 'Não atendemos aos finais de semana');
    if (feriado.sim)                         return bloquear(this, `Feriado: ${feriado.nome}`);
    if (datasIndisponiveis.includes(valor))  return bloquear(this, 'Data indisponível para agendamento');

    // ok
    this.style.borderColor = 'var(--accent-cyan)';
    this.style.backgroundColor = 'transparent';
    if (feedbackDiv) feedbackDiv.innerHTML = '';
  });

  // valida ao selecionar no calendário
  inputData.addEventListener('change', async function () {
    const valor = this.value;
    if (!valor) return;

    if (datasIndisponiveis.includes(valor))  return bloquear(this, 'Data indisponível para agendamento');

    await validarData(this);
  });

  // reforça min/max quando o calendário abrir (UX)
  inputData.addEventListener('focus', () => {
    inputData.min = hoje.toISOString().split('T')[0];
    inputData.max = max.toISOString().split('T')[0];
  });
}

/* =========================================================================
   Inicialização
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  configurarInputData();
  const selectHorario = document.getElementById('horario');
  if (selectHorario) {
    selectHorario.innerHTML = '<option value="">Selecione uma data</option>';
    selectHorario.disabled = true;
  }
});

// ========================================
// LIMPAR CACHE - CORRIGIDO
// ========================================
function limparCache(dataISO = null) {
  if (dataISO) {
    // Limpa apenas a data específica
    CACHE_OCUPADOS.delete(dataISO);
    console.log(`🗑️ Cache limpo para data: ${dataISO}`);
  } else {
    // Limpa todo o cache
    CACHE_OCUPADOS.clear();
    console.log('🗑️ Todo o cache de horários limpo');
  }
}

// ========================================
// REFRESH APÓS AGENDAMENTO
// ========================================
async function refreshHorariosAposAgendamento() {
  // Pega a data atualmente selecionada
  const inputData = document.getElementById('data');
  const dataAtual = inputData?.value;

  if (dataAtual) {
    console.log('🔄 Atualizando horários para', dataAtual);
    // Limpa cache dessa data específica
    limparCache(dataAtual);
    // Re-busca horários
    await atualizarHorarios(dataAtual);
    console.log('✅ Horários atualizados!');
  }

  // Atualiza também a lista de datas indisponíveis (próximos 14 dias)
  await atualizarDatasIndisponiveis();
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
  limparCache,
  refreshHorariosAposAgendamento,
  getTimezone: () => TIMEZONE_LOCAL
};