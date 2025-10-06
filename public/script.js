// public/script.js (VERSÃO FINAL E COMPLETA)
document.addEventListener('DOMContentLoaded', () => {
    // Tenta inicializar o modal apenas se o elemento existir
    let modalEditarMensagem;
    const modalElement = document.getElementById('modal-editar-mensagem');
    if (modalElement) {
        modalEditarMensagem = new bootstrap.Modal(modalElement);
    }

    // Seletores de elementos da página
    const formTema = document.getElementById('form-tema');
    const formAssunto = document.getElementById('form-assunto');
    const formMensagem = document.getElementById('form-mensagem');
    const formEditarMensagem = document.getElementById('form-editar-mensagem');
    const selectTemaParaAssunto = document.getElementById('select-tema-para-assunto');
    const selectTema = document.getElementById('select-tema');
    const selectAssunto = document.getElementById('select-assunto');
    const listaMensagens = document.getElementById('lista-mensagens');
    const formFiltros = document.getElementById('form-filtros');
    const filtroTema = document.getElementById('filtro-tema');
    const filtroAssunto = document.getElementById('filtro-assunto');

    // Função genérica para carregar temas em qualquer <select>
    async function carregarTemas(selectElement) {
        try {
            const response = await fetch('/api/temas');
            const { data } = await response.json();
            
            // Define o texto da primeira opção com base no ID do elemento
            const placeholder = selectElement.id.includes('filtro') ? 'Todos' : 'Selecione...';
            selectElement.innerHTML = `<option value="">${placeholder}</option>`;
            
            data.forEach(tema => {
                selectElement.innerHTML += `<option value="${tema.id}">${tema.nome}</option>`;
            });
        } catch (error) {
            console.error("Erro ao carregar temas:", error);
        }
    }

    // Função genérica para carregar assuntos em qualquer <select>
    async function carregarAssuntos(temaId, selectElement) {
        const placeholder = selectElement.id.includes('filtro') ? 'Todos' : 'Selecione um tema';
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        selectElement.disabled = true;

        if (!temaId) {
            if (selectElement.id.includes('filtro')) selectElement.disabled = false;
            return;
        }

        try {
            const response = await fetch(`/api/temas/${temaId}/assuntos`);
            const { data } = await response.json();
            
            if (data.length > 0) {
                data.forEach(assunto => {
                    selectElement.innerHTML += `<option value="${assunto.id}">${assunto.nome}</option>`;
                });
            }
            selectElement.disabled = false;
        } catch (error) {
            console.error("Erro ao carregar assuntos:", error);
        }
    }

    // Função principal para carregar a lista de mensagens
    async function carregarMensagens(params = {}) {
        Object.keys(params).forEach(key => (params[key] === '' || params[key] === null) && delete params[key]);
        const urlParams = new URLSearchParams(params);
        
        listaMensagens.innerHTML = 'Carregando...';

        try {
            const response = await fetch(`/api/mensagens?${urlParams}`);
            const { data } = await response.json();
            
            listaMensagens.innerHTML = '';
            if (data.length === 0) {
                listaMensagens.innerHTML = '<div class="alert alert-secondary">Nenhum registro encontrado para os filtros aplicados.</div>';
                return;
            }

            data.forEach(msg => {
                const dataMsg = new Date(msg.data_mensagem + 'T00:00:00').toLocaleDateString('pt-BR');
                const reservadaBadge = msg.reservada ? '<span class="badge bg-danger ms-2">Reservada</span>' : '';
                const card = document.createElement('div');
                card.className = 'card mb-3';
                card.innerHTML = `
                    <div class="card-header d-flex justify-content-between">
                        <span><strong>${msg.tema_nome} > ${msg.assunto_nome}</strong>${reservadaBadge}</span>
                        <small class="text-muted">Data: ${dataMsg} | Hora: ${msg.data_hora_texto}</small>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${msg.conteudo.replace(/\n/g, '<br>')}</p>
                        <div class="d-flex justify-content-between text-muted mt-3">
                            <small>Origem: ${msg.origem || 'N/D'}</small>
                            <small>Para: ${msg.para || 'N/D'}</small>
                        </div>
                    </div>`;
                listaMensagens.appendChild(card);
            });
        } catch (error) {
            console.error("Erro ao carregar mensagens:", error);
            listaMensagens.innerHTML = '<div class="alert alert-danger">Falha grave ao carregar mensagens.</div>';
        }
    }

    // --- LÓGICA DOS FORMULÁRIOS DE CRIAÇÃO ---
    selectTema.addEventListener('change', () => carregarAssuntos(selectTema.value, selectAssunto));
    
    formTema.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('nome-tema');
        if (!input.value.trim()) return;
        await fetch('/api/temas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: input.value }) });
        input.value = '';
        carregarTemas(selectTema);
        carregarTemas(selectTemaParaAssunto);
        carregarTemas(filtroTema);
    });

    formAssunto.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('nome-assunto');
        const temaId = selectTemaParaAssunto.value;
        if (!temaId) { alert('Selecione um tema primeiro!'); return; }
        if (!input.value.trim()) return;
        await fetch('/api/assuntos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: input.value, tema_id: temaId }) });
        input.value = '';
    });

    formMensagem.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            data_mensagem: document.getElementById('data-mensagem').value,
            data_hora_texto: document.getElementById('data-hora-texto').value ? document.getElementById('data-hora-texto').value + 'Z' : '',
            origem: document.getElementById('origem-mensagem').value,
            para: document.getElementById('para-mensagem').value,
            conteudo: document.getElementById('conteudo-mensagem').value,
            assunto_id: selectAssunto.value,
            reservada: document.getElementById('reservada-mensagem').checked ? 1 : 0
        };
        if (!payload.data_mensagem || !payload.conteudo || !payload.assunto_id) {
            alert('Os campos Data da Mensagem, Tema, Assunto e Mensagem são obrigatórios.');
            return;
        }
        await fetch('/api/mensagens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        formMensagem.reset();
        carregarMensagens();
    });

    // --- LÓGICA DOS FILTROS ---
    filtroTema.addEventListener('change', () => carregarAssuntos(filtroTema.value, filtroAssunto));

    formFiltros.addEventListener('submit', (e) => {
        e.preventDefault();
        const params = {
            busca: document.getElementById('filtro-busca').value,
            data_inicio: document.getElementById('filtro-data-inicio').value,
            data_fim: document.getElementById('filtro-data-fim').value,
            data_hora_texto: document.getElementById('filtro-data-hora').value,
            temaId: filtroTema.value,
            assuntoId: filtroAssunto.value,
            classificar: document.getElementById('filtro-classificar').value
        };
        carregarMensagens(params);
    });
    
    formFiltros.addEventListener('reset', () => {
        filtroAssunto.innerHTML = '<option value="">Selecione um tema</option>';
        filtroAssunto.disabled = true;
        // Espera um pequeno instante para o formulário limpar antes de recarregar
        setTimeout(() => carregarMensagens(), 50);
    });

    // --- INICIALIZAÇÃO DA PÁGINA ---
    function init() {
        carregarTemas(selectTema);
        carregarTemas(selectTemaParaAssunto);
        carregarTemas(filtroTema);
        carregarMensagens();
    }
    
    init();
});
