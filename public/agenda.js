// public/agenda.js (VERSÃO FINAL COM CALENDÁRIO)
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/compromissos');
        const { data } = await response.json();

        // Formata os eventos para o formato que o FullCalendar entende
        const events = data.map(compromisso => ({
            title: compromisso.titulo,
            start: compromisso.quando, // O formato ISO que salvamos funciona perfeitamente
            description: compromisso.observacoes,
            location: compromisso.onde
        }));

        const calendarEl = document.getElementById('calendar');
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'pt-br', // Traduz para o português
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek' // Adicionada a visualização de lista
            },
            buttonText: { // Tradução dos botões
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                list: 'Lista'
            },
            events: events,
            eventDidMount: function(info) {
                // Adiciona informações extras (tooltip) ao passar o mouse
                if (info.event.extendedProps.description || info.event.extendedProps.location) {
                    const tooltipText = `
                        ${info.event.extendedProps.description ? `<b>Obs:</b> ${info.event.extendedProps.description}` : ''}
                        ${info.event.extendedProps.location ? `<br><b>Local:</b> ${info.event.extendedProps.location}` : ''}
                    `.trim();
                    
                    // Usando o tooltip do Bootstrap que já está carregado na página
                    if (tooltipText) {
                        info.el.setAttribute('data-bs-toggle', 'tooltip');
                        info.el.setAttribute('data-bs-placement', 'top');
                        info.el.setAttribute('data-bs-title', tooltipText);
                        info.el.setAttribute('data-bs-html', 'true'); // Permite HTML no tooltip
                        new bootstrap.Tooltip(info.el);
                    }
                }
            }
        });
        calendar.render();

    } catch (error) {
        console.error("Erro ao carregar os eventos da agenda:", error);
        const calendarEl = document.getElementById('calendar');
        if(calendarEl) {
            calendarEl.innerHTML = '<div class="alert alert-danger">Erro ao carregar os eventos da agenda. Verifique o console (F12).</div>';
        }
    }
});
