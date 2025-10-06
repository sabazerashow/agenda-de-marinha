// public/theme.js (VERSÃO FINAL E COMPLETA)
(() => {
    'use strict'

    // Função para buscar o tema salvo no armazenamento local do navegador
    const getStoredTheme = () => localStorage.getItem('theme')
    // Função para salvar a escolha de tema do usuário
    const setStoredTheme = theme => localStorage.setItem('theme', theme)

    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme()
        if (storedTheme) {
            return storedTheme
        }
        // Se não houver tema salvo, verifica a preferência do sistema operacional do usuário
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const setTheme = theme => {
        if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-bs-theme', 'dark')
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme)
        }
    }

    // Aplica o tema preferido assim que o script carrega, evitando "flash" de tela
    setTheme(getPreferredTheme())

    // Adiciona o evento de clique ao botão de troca de tema assim que a página carregar
    window.addEventListener('DOMContentLoaded', () => {
        const themeToggler = document.getElementById('theme-toggler');
        
        if(themeToggler) {
            themeToggler.addEventListener('click', () => {
                const currentTheme = getStoredTheme() || getPreferredTheme();
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                setStoredTheme(newTheme);
                setTheme(newTheme);
            })
        }
    })
})()
