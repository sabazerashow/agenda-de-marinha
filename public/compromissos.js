// public/compromissos.js (VERSÃO FINAL E COMPLETA)
document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos que existem NESTA página
    const formCompromisso = document.getElementById('form-compromisso');
    const listaCompromissos = document.getElementById('lista-compromissos');
    const formEditarCompromisso = document.getElementById('form-editar-compromisso');
    let modalEditarCompromisso;

    // Função para carregar os compromissos
    async function carregarCompromissos() {
        if (!listaCompromissos) return; // Se a lista não existir na página, não faz nada
        listaCompromissos.innerHTML = 'Carregando...';
        try {
            const response = await fetch(`/api/compromissos?ordem=desc`);

            if (!response.ok) {
                throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            listaCompromissos.innerHTML = '';
            if (!data.data || data.data.length === 0) {
                listaCompromissos.innerHTML = '<li class="list-group-item">Nenhum compromisso encontrado.</li>';
                return;
            }

            data.data.forEach(c => {
                const dataFormatada = new Date(c.quando).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                const item = document.createElement('li');
                item.className = 'list-group-item';
                item.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${c.titulo}</h5>
                        <small>${dataFormatada}</small>
                    </div>
                    <p class="mb-1">${c.observacoes || ''}</p>
                    <small class="text-muted">Onde: ${c.onde || 'Não definido'}</small>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-outline-secondary btn-editar-compromisso" data-id="${c.id}">Editar</button>
                        <button class="btn btn-sm btn-outline-danger btn-excluir-compromisso" data-id="${c.id}">Excluir</button>
                    </div>
                `;
                listaCompromissos.appendChild(item);
            });
        } catch (error) {
            console.error("Erro detalhado ao carregar compromissos:", error);
            listaCompromissos.innerHTML = '<li class="list-group-item text-danger">Falha grave ao carregar compromissos. Verifique o console (F12).</li>';
        }
    }

    // Evento para salvar um novo compromisso
    if (formCompromisso) {
        formCompromisso.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = document.getElementById('data-compromisso').value;
            const hora = document.getElementById('hora-compromisso').value;
            if (!data || !hora) {
                alert("Por favor, preencha a data e a hora do compromisso.");
                return;
            }
            const quando = `${data}T${hora}`; // Junta data e hora no formato ISO

            const compromisso = {
                titulo: document.getElementById('titulo').value,
                quando: quando,
                onde: document.getElementById('onde').value,
                observacoes: document.getElementById('observacoes').value,
            };
            await fetch('/api/compromissos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(compromisso) });
            formCompromisso.reset();
            carregarCompromissos();
        });
    }

    // Eventos para editar e excluir
    if (listaCompromissos) {
        listaCompromissos.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (!id) return;

            if (e.target.classList.contains('btn-excluir-compromisso')) {
                if (confirm('Tem certeza que deseja excluir este compromisso?')) {
                    await fetch(`/api/compromissos/${id}`, { method: 'DELETE' });
                    carregarCompromissos();
                }
            }
            if (e.target.classList.contains('btn-editar-compromisso')) {
                const response = await fetch('/api/compromissos');
                const { data } = await response.json();
                const compromisso = data.find(c => c.id == id);

                const dataISO = new Date(compromisso.quando);
                
                // Separa a data e a hora do formato ISO de forma segura
                const ano = dataISO.getFullYear();
                const mes = String(dataISO.getMonth() + 1).padStart(2, '0');
                const dia = String(dataISO.getDate()).padStart(2, '0');
                const dataSeparada = `${ano}-${mes}-${dia}`;
                const horaSeparada = dataISO.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

                document.getElementById('edit-compromisso-id').value = compromisso.id;
                document.getElementById('edit-titulo').value = compromisso.titulo;
                document.getElementById('edit-data-compromisso').value = dataSeparada;
                document.getElementById('edit-hora-compromisso').value = horaSeparada;
                document.getElementById('edit-onde').value = compromisso.onde;
                document.getElementById('edit-observacoes').value = compromisso.observacoes;
                modalEditarCompromisso.show();
            }
        });
    }

    // Evento para salvar a edição
    if (formEditarCompromisso) {
        formEditarCompromisso.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-compromisso-id').value;
            const data = document.getElementById('edit-data-compromisso').value;
            const hora = document.getElementById('edit-hora-compromisso').value;
            const quando = `${data}T${hora}`; // Junta novamente

            const compromisso = {
                titulo: document.getElementById('edit-titulo').value,
                quando: quando,
                onde: document.getElementById('edit-onde').value,
                observacoes: document.getElementById('edit-observacoes').value,
            };
            await fetch(`/api/compromissos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(compromisso) });
            modalEditarCompromisso.hide();
            carregarCompromissos();
        });
    }
    
    // Função de inicialização da página
    function init() {
        const modalElement = document.getElementById('modal-editar-compromisso');
        if (modalElement) {
            modalEditarCompromisso = new bootstrap.Modal(modalElement);
        }
        carregarCompromissos();
    }
    init();
});
