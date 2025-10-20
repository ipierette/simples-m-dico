// ========================================
// CONFIGURAÇÕES - WEBHOOKS N8N
// ========================================
const CONFIG = {
    n8nBase: 'https://solitaryhornet-n8n.cloudfy.live/webhook',
    webhookAgendar: 'https://solitaryhornet-n8n.cloudfy.live/webhook/agendar-consulta',
    webhookConsultar: 'https://solitaryhornet-n8n.cloudfy.live/webhook/consultar-agendamento',
    webhookDicas: 'https://solitaryhornet-n8n.cloudfy.live/webhook/dicas-saude'
};

function scrollToAgendamento() {
    const el = document.getElementById('agendamento');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        console.warn('⚠️ scrollToAgendamento ignorado: elemento #agendamento não encontrado.');
    }
}

function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        console.warn(`⚠️ scrollTo ignorado: elemento com id "${id}" não encontrado.`);
    }
}

// Adicionar classe active nos links de navegação ao scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Toggle mobile menu
function toggleMobileMenu() {
    const menu = document.querySelector('.nav-menu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

// ========================================
// SISTEMA DE TABS
// ========================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ========================================
// SINCRONIZAÇÃO BIDIRECIONAL DOS CAMPOS
// ========================================
let syncInProgress = false;

function setupFieldSync() {
    const sintomasAgendamento = document.getElementById('sintomas');
    const sintomasIA = document.getElementById('sintomasIA');

    if (!sintomasAgendamento || !sintomasIA) return;

    // Sincronizar Agendamento → IA
    sintomasAgendamento.addEventListener('input', (e) => {
        if (!syncInProgress) {
            syncInProgress = true;
            sintomasIA.value = e.target.value;
            syncInProgress = false;
        }
    });

    // Sincronizar IA → Agendamento
    sintomasIA.addEventListener('input', (e) => {
        if (!syncInProgress) {
            syncInProgress = true;
            sintomasAgendamento.value = e.target.value;
            syncInProgress = false;
        }
    });
}

// ========================================
// FORMULÁRIO DE AGENDAMENTO
// ========================================

// Mostrar/ocultar campos de convênio
function setupConvenio() {
    const radiosConvenio = document.querySelectorAll('input[name="convenio"]');
    const convenioDetalhes = document.getElementById('convenioDetalhes');

    if (!convenioDetalhes) return;

    radiosConvenio.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'sim') {
                convenioDetalhes.style.display = 'block';
                document.getElementById('nomeConvenio').required = true;
            } else {
                convenioDetalhes.style.display = 'none';
                document.getElementById('nomeConvenio').required = false;
                document.getElementById('nomeConvenio').value = '';
            }
        });
    });
}

// Máscara de telefone
function setupTelefoneMask() {
    const telefoneInputs = [
        document.getElementById('telefone'),
        document.getElementById('consultarTelefone')
    ];

    telefoneInputs.forEach(input => {
        if (!input) return;

        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);

            if (value.length > 6) {
                e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
            } else if (value.length > 2) {
                e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            } else if (value.length > 0) {
                e.target.value = `(${value}`;
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                if (start === end && /\D/.test(e.target.value.charAt(start - 1))) {
                    e.target.value = e.target.value.slice(0, start - 1) + e.target.value.slice(end);
                    e.target.setSelectionRange(start - 1, start - 1);
                    e.preventDefault();
                }
            }
        });
    });
}

// ========================================
// Submit formulário de agendamento - CORRIGIDO
// ========================================
function setupFormAgendamento() {
    const form = document.getElementById('formAgendamento');
    if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = e.target.querySelector('.btn-submit');
            const btnText = btn.querySelector('span');
            const originalText = btnText.textContent;

            btnText.textContent = 'Enviando...';
            btn.disabled = true;

            try {
                const convenioSim = document.querySelector('input[name="convenio"]:checked').value === 'sim';
                const nomeConvenio = convenioSim ? document.getElementById('nomeConvenio').value : 'Particular';

                const formData = {
                    nome: document.getElementById('nome').value,
                    telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
                    email: document.getElementById('email').value,
                    convenio: nomeConvenio,
                    dataPreferida: document.getElementById('data').value,
                    horarioPreferido: document.getElementById('horario').value,
                    sintomas: document.getElementById('sintomas').value || 'Não informado'
                };

                console.log('📤 Enviando agendamento:', formData);

                const response = await fetch(CONFIG.webhookAgendar, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                console.log('📡 Status da resposta:', response.status);
                console.log('📋 Headers:', [...response.headers.entries()]);

                if (response.status >= 200 && response.status < 300) {
                    console.log('✅ Agendamento enviado com sucesso!');

                    let responseData = null;
                    try {
                        const text = await response.text();
                        if (text && text.trim()) {
                            responseData = JSON.parse(text);
                            console.log('📦 Resposta do servidor:', responseData);
                        }
                    } catch (parseError) {
                        console.log('⚠️ Resposta não é JSON, mas está OK:', parseError);
                    }

                    showToast('✅ Agendamento realizado! Você receberá confirmação via WhatsApp.', 'success');

                    // Limpar formulário
                    e.target.reset();
                    const sintomasIA = document.getElementById('sintomasIA');
                    if (sintomasIA) sintomasIA.value = '';

                    // Resetar horários
                    const selectHorario = document.getElementById('horario');
                    if (selectHorario) {
                        selectHorario.innerHTML = '<option value="">Selecione primeiro uma data</option>';
                        selectHorario.disabled = true;
                    }

                    // Limpar cache de horários
                    if (window.validacaoHorarios) {
                        window.validacaoHorarios.limparCache();
                    }

                    // Scroll suave para o topo — com proteção
                    try {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } catch (err) {
                        console.warn('⚠️ Falha ao rolar para o topo:', err);
                    }

                } else {
                    throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
                }

            } catch (error) {
                console.error('❌ Erro ao agendar:', error);
                console.error('Detalhes:', error.message);

                let mensagemErro = 'Erro ao realizar agendamento. ';
                if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    mensagemErro += 'Verifique sua conexão com a internet.';
                } else if (error.message.includes('CORS')) {
                    mensagemErro += 'Erro de configuração. Entre em contato com o suporte.';
                } else {
                    mensagemErro += 'Tente novamente ou ligue: (11) 3456-7890';
                }

                showToast('❌ ' + mensagemErro, 'error');
            } finally {
                btnText.textContent = originalText;
                btn.disabled = false;
            }
        });

}

// ========================================
// CONSULTAR AGENDAMENTO
// ========================================
function setupFormConsultar() {
    const form = document.getElementById('formConsultar');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const telefone = document.getElementById('consultarTelefone').value.replace(/\D/g, '');
        const resultado = document.getElementById('resultadoConsulta');

        resultado.innerHTML = '<div class="dicas-loading"><div class="spinner"></div><p>Consultando...</p></div>';

        try {
            const response = await fetch(`${CONFIG.webhookConsultar}?nome=${encodeURIComponent(telefone)}`);

            if (!response.ok) {
                throw new Error('Erro ao consultar');
            }

            const data = await response.json();

            if (data.agendamentos && data.agendamentos.length > 0) {
                resultado.innerHTML = data.agendamentos.map(ag => `
                    <div class="credencial-item">
                        <div class="credencial-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#00d4aa" stroke-width="2" fill="none"/>
                                <path d="M8 2V6M16 2V6M3 10H21" stroke="#00d4aa" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <div class="credencial-title">${formatarData(ag.data_preferida)} às ${ag.horario_preferido}</div>
                            <div class="credencial-desc">Paciente: ${ag.nome}</div>
                            <div class="credencial-desc">Convênio: ${ag.convenio || 'Particular'}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                resultado.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style="margin-bottom: 16px;">
                            <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
                            <path d="M32 20V34M32 42H32.02" stroke="rgba(255,255,255,0.3)" stroke-width="3" stroke-linecap="round"/>
                        </svg>
                        <p>Nenhum agendamento encontrado para este telefone.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Erro:', error);
            resultado.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ff6b6b;">
                    <p>Erro ao consultar agendamentos. Tente novamente.</p>
                </div>
            `;
        }
    });
}

// ========================================
// DICAS DE IA
// ========================================
async function obterDicas() {
    const sintomas = document.getElementById('sintomasIA').value.trim();
    const resultado = document.getElementById('dicasResultado');
    const btn = document.getElementById('btnObterDicas');

    if (!sintomas) {
        showToast('Por favor, descreva seus sintomas antes de solicitar dicas.', 'error');
        return;
    }

    resultado.style.display = 'block';
    resultado.innerHTML = '<div class="dicas-loading"><div class="spinner"></div><p>Analisando sintomas e consultando base científica...</p></div>';
    btn.disabled = true;

    try {
        const response = await fetch(CONFIG.webhookDicas, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sintomas })
        });

        if (!response.ok) throw new Error('Erro na requisição');

        const data = await response.json();
        const dicasHTML = data.dicas || data.output || 'Não foi possível gerar orientações.';

        resultado.innerHTML = `
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 1.5rem; margin-bottom: 16px; color: var(--accent-purple-light);">
                    💡 Orientações de Saúde
                </h3>
                <div style="color: var(--text-secondary); line-height: 1.7;">
                    ${dicasHTML}
                </div>
            </div>
            <div style="margin-top: 24px; padding: 16px; background: rgba(255, 107, 107, 0.1); border-radius: 12px; border: 1px solid rgba(255, 107, 107, 0.2);">
                <strong style="color: #ff6b6b;">⚠️ Lembre-se:</strong>
                <p style="margin-top: 8px; color: var(--text-secondary);">
                    Estas são apenas orientações gerais. Para diagnóstico e tratamento adequado, 
                    agende uma consulta médica.
                </p>
            </div>
        `;

        resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        console.error('Erro:', error);
        resultado.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ff6b6b;">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style="margin-bottom: 16px;">
                    <circle cx="32" cy="32" r="30" stroke="#ff6b6b" stroke-width="2"/>
                    <path d="M22 22L42 42M42 22L22 42" stroke="#ff6b6b" stroke-width="3" stroke-linecap="round"/>
                </svg>
                <p>Erro ao obter dicas. Por favor, tente novamente.</p>
            </div>
        `;
    } finally {
        btn.disabled = false;
    }
}

// ========================================
// SISTEMA DE TOAST
// ========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('Toast element not found');
        return;
    }

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// ========================================
// UTILITÁRIOS
// ========================================
function formatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

// ========================================
// ANIMAÇÕES DE ENTRADA
// ========================================
function setupAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.especialidade-card, .credencial-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

// ========================================
// VALIDAÇÃO DE FORMULÁRIOS
// ========================================
function setupValidation() {
    const inputs = document.querySelectorAll('input[required], textarea[required], select[required]');

    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                input.style.borderColor = '#ff6b6b';
            } else {
                input.style.borderColor = 'rgba(255, 255, 255, 0.05)';
            }
        });

        input.addEventListener('input', () => {
            if (input.value.trim()) {
                input.style.borderColor = 'var(--accent-cyan)';
            }
        });
    });
}

// ========================================
// INICIALIZAÇÃO GERAL
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema carregado - Conectado ao N8N');
    console.log('📡 Webhook Agendar:', CONFIG.webhookAgendar);

    setupFieldSync();
    setupConvenio();
    setupTelefoneMask();
    setupFormAgendamento();
    setupFormConsultar();
    setupAnimations();
    setupValidation();
});