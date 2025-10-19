// ========================================
// CONFIGURAÇÕES
// ========================================
const CONFIG = {
    webhookN8N: 'https://SEU-N8N.app.n8n.cloud/webhook/agendamento-consulta',
    netlifyFunction: '/.netlify/functions/dicas-ia'
};

// ========================================
// NAVEGAÇÃO E SCROLL
// ========================================
function scrollToAgendamento() {
    document.getElementById('agendamento').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function scrollTo(id) {
    document.getElementById(id).scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
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
    // Remover active de todos os botões e conteúdos
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Adicionar active no botão e conteúdo clicado
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

// Inicializar sincronização quando o DOM carregar
document.addEventListener('DOMContentLoaded', setupFieldSync);

// ========================================
// FORMULÁRIO DE AGENDAMENTO
// ========================================

// Mostrar/ocultar campos de convênio
document.addEventListener('DOMContentLoaded', () => {
    const radiosConvenio = document.querySelectorAll('input[name="convenio"]');
    const convenioDetalhes = document.getElementById('convenioDetalhes');
    
    radiosConvenio.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'sim') {
                convenioDetalhes.style.display = 'block';
                document.getElementById('nomeConvenio').required = true;
            } else {
                convenioDetalhes.style.display = 'none';
                document.getElementById('nomeConvenio').required = false;
            }
        });
    });
});

// Máscara de telefone
document.addEventListener('DOMContentLoaded', () => {
    const telefoneInputs = [
        document.getElementById('telefone'),
        document.getElementById('consultarTelefone')
    ];
    
    telefoneInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length <= 11) {
                    value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
                    value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
                    value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
                    value = value.replace(/^(\d*)/, '($1');
                }
                
                e.target.value = value;
            });
        }
    });
});

// Definir data mínima como hoje
document.addEventListener('DOMContentLoaded', () => {
    const dataInput = document.getElementById('data');
    if (dataInput) {
        const hoje = new Date().toISOString().split('T')[0];
        dataInput.min = hoje;
    }
});

// Submit formulário de agendamento
document.getElementById('formAgendamento').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector('.btn-submit');
    const btnText = btn.querySelector('span');
    const originalText = btnText.textContent;
    
    // Mostrar loading
    btnText.textContent = 'Enviando...';
    btn.disabled = true;
    
    try {
        // Coletar dados do formulário
        const formData = {
            nome: document.getElementById('nome').value,
            telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
            email: document.getElementById('email').value,
            convenio: document.querySelector('input[name="convenio"]:checked').value,
            nomeConvenio: document.getElementById('nomeConvenio').value || 'Particular',
            data: document.getElementById('data').value,
            horario: document.getElementById('horario').value,
            sintomas: document.getElementById('sintomas').value || 'Não informado',
            sessionId: `agendamento_${Date.now()}`
        };
        
        // Enviar para n8n
        const response = await fetch(CONFIG.webhookN8N, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showToast('Agendamento realizado com sucesso! Você receberá uma confirmação via WhatsApp.', 'success');
            e.target.reset();
            
            // Limpar também o campo sincronizado
            document.getElementById('sintomasIA').value = '';
            
            // Scroll para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            throw new Error('Erro ao enviar agendamento');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao realizar agendamento. Por favor, tente novamente ou entre em contato por telefone.', 'error');
    } finally {
        btnText.textContent = originalText;
        btn.disabled = false;
    }
});

// ========================================
// CONSULTAR AGENDAMENTO
// ========================================
document.getElementById('formConsultar').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const telefone = document.getElementById('consultarTelefone').value.replace(/\D/g, '');
    const resultado = document.getElementById('resultadoConsulta');
    
    resultado.innerHTML = '<div class="dicas-loading"><div class="spinner"></div><p>Consultando...</p></div>';
    
    try {
        // Consultar no n8n/Supabase
        const response = await fetch(`${CONFIG.webhookN8N}/consultar?telefone=${telefone}`);
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
                        <div class="credencial-title">${formatarData(ag.data)} às ${ag.horario}</div>
                        <div class="credencial-desc">Status: ${ag.status || 'Confirmado'}</div>
                        <div class="credencial-desc">Convênio: ${ag.convenio}</div>
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
    
    // Mostrar loading
    resultado.style.display = 'block';
    resultado.innerHTML = '<div class="dicas-loading"><div class="spinner"></div><p>Analisando sintomas e consultando base científica...</p></div>';
    btn.disabled = true;
    
    try {
        const response = await fetch(CONFIG.netlifyFunction, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sintomas })
        });
        
        if (!response.ok) throw new Error('Erro na requisição');
        
        const data = await response.json();
        
        // Exibir dicas
        resultado.innerHTML = `
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 1.5rem; margin-bottom: 16px; color: var(--accent-purple-light);">
                    Orientações de Saúde
                </h3>
                <p style="color: var(--text-secondary); line-height: 1.7;">
                    ${data.dicas || 'Não foi possível gerar orientações para os sintomas informados.'}
                </p>
            </div>
            ${data.referencias ? `
                <div class="dica-item">
                    <div class="dica-titulo">📚 Referências Científicas</div>
                    <div class="dica-texto">${data.referencias}</div>
                </div>
            ` : ''}
            <div style="margin-top: 24px; padding: 16px; background: rgba(255, 107, 107, 0.1); border-radius: 12px; border: 1px solid rgba(255, 107, 107, 0.2);">
                <strong style="color: #ff6b6b;">⚠️ Lembre-se:</strong>
                <p style="margin-top: 8px; color: var(--text-secondary);">
                    Estas são apenas orientações gerais. Para diagnóstico e tratamento adequado, 
                    agende uma consulta médica.
                </p>
            </div>
        `;
        
        // Scroll suave até o resultado
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
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

// ========================================
// ANIMAÇÕES DE ENTRADA
// ========================================
document.addEventListener('DOMContentLoaded', () => {
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
});

// ========================================
// VALIDAÇÃO DE FORMULÁRIOS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
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
});