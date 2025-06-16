/**
 * Main Module - Lógica principal da aplicação Steam Game Viewer
 * Responsável pela interface, eventos e coordenação entre componentes
 */

/**
 * Classe principal da aplicação
 */
class SteamGameViewer {

    constructor() {
        // Elementos do DOM
        this.elements = {
            searchForm: document.getElementById('searchForm'),
            steamIdInput: document.getElementById('steamId'),
            sortBySelect: document.getElementById('sortBy'),
            searchBtn: document.getElementById('searchBtn'),
            helpBtn: document.getElementById('helpBtn'),
            helpModal: document.getElementById('helpModal'),
            closeModal: document.querySelector('.close'),
            messageSection: document.getElementById('messageSection'),
            resultsSection: document.getElementById('resultsSection'),
            resultsTitle: document.getElementById('resultsTitle'),
            gameCount: document.getElementById('gameCount'),
            totalHours: document.getElementById('totalHours'),
            gamesList: document.getElementById('gamesList')
        };

        // Estado da aplicação
        this.state = {
            isLoading: false,
            currentGames: [],
            lastSearchParams: null
        };

        // Configurações
        this.config = {
            exampleSteamIds: [
                '76561198010872093',
                '76561197960435530',
                '76561198000000000'
            ],
            autoHideSuccessMessages: 5000,
            scrollBehavior: 'smooth'
        };

        this.init();
    }

    /**
     * Inicializa a aplicação
     */
    init() {
        console.log('🎮 Inicializando Steam Game Viewer...');

        this.bindEvents();
        this.setupValidation();
        this.addDynamicStyles();
        this.testApiOnLoad();

        console.log('✅ Steam Game Viewer inicializado com sucesso!');
    }

    /**
     * Vincula todos os eventos da interface
     */
    bindEvents() {
        // Eventos do formulário
        this.elements.searchForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Eventos dos botões
        this.elements.helpBtn.addEventListener('click', () => this.openHelpModal());
        this.elements.closeModal.addEventListener('click', () => this.closeHelpModal());

        // Eventos do modal
        window.addEventListener('click', (event) => {
            if (event.target === this.elements.helpModal) {
                this.closeHelpModal();
            }
        });

        // Validação em tempo real
        this.elements.steamIdInput.addEventListener('input', () => this.validateSteamIdInput());
        this.elements.steamIdInput.addEventListener('blur', () => this.validateSteamIdInput());

        // Atalhos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    /**
     * Configura validação do formulário
     */
    setupValidation() {
        // Placeholder dinâmico com exemplo
        const exampleId = this.config.exampleSteamIds[0];
        this.elements.steamIdInput.placeholder = `Ex: ${exampleId}`;

        // Máscara para aceitar apenas números
        this.elements.steamIdInput.addEventListener('input', (e) => {
            // Remove caracteres não numéricos
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            // Limita a 17 caracteres
            if (e.target.value.length > 17) {
                e.target.value = e.target.value.substring(0, 17);
            }
        });
    }

    /**
     * Adiciona estilos dinâmicos para melhorar a UX
     */
    addDynamicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .input-wrapper.valid input {
                border-color: var(--success-green) !important;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
            }

            .input-wrapper.invalid input {
                border-color: var(--error-red) !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
            }

            .playtime-bar {
                width: 100%;
                height: 4px;
                background: var(--bg-input);
                border-radius: 2px;
                margin-top: 0.5rem;
                overflow: hidden;
            }

            .playtime-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--primary-purple), var(--accent-purple));
                border-radius: 2px;
                transition: width 1s ease;
            }

            .game-card {
                animation: fadeInUp 0.5s ease forwards;
                opacity: 0;
                transform: translateY(20px);
            }

            @keyframes fadeInUp {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Testa a API ao carregar a aplicação
     */
    async testApiOnLoad() {
        try {
            const isConnected = await SteamAPI.testConnection();

            if (!isConnected) {
                this.showMessage(
                    'Aviso: Não foi possível conectar com a API. Verifique se o servidor está rodando na porta 8080.',
                    'warning'
                );
            }
        } catch (error) {
            console.error('Erro ao testar API:', error);
        }
    }

    /**
     * Manipula o envio do formulário
     */
    async handleFormSubmit(event) {
        event.preventDefault();

        if (this.state.isLoading) {
            return; // Previne múltiplas submissões
        }

        const steamId = this.elements.steamIdInput.value.trim();
        const sortBy = this.elements.sortBySelect.value;

        // Validações
        if (!steamId) {
            this.showMessage('Por favor, insira um Steam ID.', 'error');
            this.elements.steamIdInput.focus();
            return;
        }

        if (!SteamAPI.isValidSteamId(steamId)) {
            this.showMessage(
                'Steam ID inválido. Deve ter 17 dígitos e começar com 765611980.',
                'error'
            );
            this.elements.steamIdInput.focus();
            return;
        }

        // Salvar parâmetros da busca
        this.state.lastSearchParams = { steamId, sortBy };

        // Executar busca
        await this.searchGames(steamId, sortBy);
    }

    /**
     * Executa a busca de jogos
     */
    async searchGames(steamId, sortBy) {
        try {
            this.setLoading(true);
            this.clearMessages();
            this.hideResults();

            console.log('🔍 Iniciando busca:', { steamId, sortBy });

            const games = await SteamAPI.getUserGames(steamId, sortBy);

            if (games.length === 0) {
                this.showMessage(
                    'Nenhum jogo encontrado. Verifique se o Steam ID está correto e se o perfil está público.',
                    'warning'
                );
                return;
            }

            this.state.currentGames = games;
            this.displayGames(games, sortBy);

            this.showMessage(
                `✅ ${games.length} jogo${games.length > 1 ? 's' : ''} carregado${games.length > 1 ? 's' : ''} com sucesso!`,
                'success'
            );

        } catch (error) {
            console.error('❌ Erro na busca:', error);
            this.handleSearchError(error);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Trata erros durante a busca
     */
    handleSearchError(error) {
        let errorMessage = 'Erro ao carregar jogos. ';

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += 'Verifique sua conexão com a internet e se o servidor está rodando.';
        } else if (error.message.includes('timeout')) {
            errorMessage += 'Tempo limite excedido. Tente novamente.';
        } else if (error.message.includes('Steam ID')) {
            errorMessage += 'Verifique se o Steam ID está correto.';
        } else {
            errorMessage += error.message || 'Tente novamente em alguns instantes.';
        }

        this.showMessage(errorMessage, 'error');
    }

    /**
     * Exibe os jogos na interface
     */
    displayGames(games, sortBy) {
        // Calcular estatísticas
        const stats = SteamAPI.calculateGameStats(games);

        // Atualizar cabeçalho
        const sortText = sortBy === 'name' ? 'por Nome' : 'por Horas Jogadas';
        this.elements.resultsTitle.innerHTML = `
            <i class="fas fa-trophy"></i>
            Biblioteca de Jogos (${sortText})
        `;

        // Atualizar estatísticas
        this.elements.gameCount.textContent =
            `${stats.totalGames} jogo${stats.totalGames > 1 ? 's' : ''} encontrado${stats.totalGames > 1 ? 's' : ''}`;

        this.elements.totalHours.textContent = `${stats.totalHours}h total`;

        // Limpar e popular lista de jogos
        this.elements.gamesList.innerHTML = '';

        games.forEach((game, index) => {
            setTimeout(() => {
                const gameCard = this.createGameCard(game, stats);
                this.elements.gamesList.appendChild(gameCard);
            }, index * 100); // Animação escalonada
        });

        // Mostrar resultados
        this.showResults();
    }

    /**
     * Cria um card para um jogo
     */
    createGameCard(game, stats) {
        const card = document.createElement('div');
        card.className = 'game-card';

        // DEBUG: Log para verificar os dados
        console.log('🎮 Debug game:', game.name, 'playtime:', game.playtimeForever, 'type:', typeof game.playtimeForever);

        // Garantir que playtimeForever é um número válido
        const playtime = Number(game.playtimeForever) || 0;
        const hours = Math.round(playtime / 60 * 10) / 10;
        const hoursText = this.formatPlaytime(playtime);

        console.log('⏰ Playtime processado:', { playtime, hours, hoursText });

        // Calcular porcentagem para a barra de progresso
        const maxPlaytime = stats.mostPlayedGame ?
            Number(stats.mostPlayedGame.playtimeForever) || 1 : 100;
        const progressPercent = maxPlaytime > 0 ?
            Math.min((playtime / maxPlaytime) * 100, 100) : 0;

        card.innerHTML = `
            <div class="game-header">
                <div class="game-icon-wrapper">
                    ${this.createGameIcon(game)}
                </div>
                <div class="game-info">
                    <h3 title="${this.escapeHtml(game.name)}">${this.truncateText(game.name, 50)}</h3>
                    <div class="game-id">ID: ${game.appId}</div>
                </div>
            </div>

            <div class="game-stats">
                <div class="playtime">
                    <i class="fas fa-clock"></i>
                    <span class="playtime-badge">${hoursText}</span>
                </div>
                ${playtime > 0 ? `
                    <div class="playtime-bar">
                        <div class="playtime-fill" style="width: 0%" data-target="${progressPercent}"></div>
                    </div>
                ` : ''}
            </div>
        `;

        // Animar barra de progresso
        setTimeout(() => {
            const progressBar = card.querySelector('.playtime-fill');
            if (progressBar) {
                const targetWidth = progressBar.getAttribute('data-target');
                progressBar.style.width = targetWidth + '%';
            }
        }, 500);

        return card;
    }

    /**
     * Cria o ícone do jogo
     */
    createGameIcon(game) {
        // Verificar se tem URL de imagem válida
        if (game.imgIconUrl && game.imgIconUrl.trim() && !game.imgIconUrl.includes('undefined')) {
            return `<img src="${game.imgIconUrl}" alt="${this.escapeHtml(game.name)}" class="game-icon" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\"game-icon no-image\\"><i class=\\"fas fa-gamepad\\"></i></div>'">`;
        } else {
            // Se não tem imagem, usar ícone baseado no tipo de jogo
            const gameIcon = this.getGameIcon(game.name);
            return `<div class="game-icon no-image"><i class="${gameIcon}"></i></div>`;
        }
    }

    /**
     * Retorna ícone apropriado baseado no nome do jogo
     */
    getGameIcon(gameName) {
        const name = gameName.toLowerCase();

        if (name.includes('counter-strike') || name.includes('cs')) {
            return 'fas fa-crosshairs';
        } else if (name.includes('portal')) {
            return 'fas fa-portal-exit';
        } else if (name.includes('dota') || name.includes('moba')) {
            return 'fas fa-chess';
        } else if (name.includes('half-life')) {
            return 'fas fa-radiation';
        } else if (name.includes('team fortress')) {
            return 'fas fa-users';
        } else if (name.includes('left 4 dead')) {
            return 'fas fa-skull';
        } else if (name.includes('civilization')) {
            return 'fas fa-globe';
        } else if (name.includes('cities') || name.includes('sim')) {
            return 'fas fa-city';
        } else if (name.includes('racing') || name.includes('forza') || name.includes('drive')) {
            return 'fas fa-car';
        } else if (name.includes('flight') || name.includes('plane')) {
            return 'fas fa-plane';
        } else if (name.includes('football') || name.includes('fifa') || name.includes('soccer')) {
            return 'fas fa-futbol';
        } else if (name.includes('rpg') || name.includes('fantasy') || name.includes('elder scrolls')) {
            return 'fas fa-dragon';
        } else if (name.includes('horror') || name.includes('resident evil')) {
            return 'fas fa-ghost';
        } else if (name.includes('puzzle')) {
            return 'fas fa-puzzle-piece';
        } else if (name.includes('music') || name.includes('guitar')) {
            return 'fas fa-music';
        } else {
            return 'fas fa-gamepad';
        }
    }

    /**
     * Formata tempo de jogo - VERSÃO CORRIGIDA
     */
    formatPlaytime(minutes) {
        // Debug log
        console.log('🔧 formatPlaytime input:', minutes, 'type:', typeof minutes);

        // Converter para número se não for
        const numMinutes = Number(minutes);

        // Verificar se é um número válido
        if (isNaN(numMinutes)) {
            console.log('❌ formatPlaytime: NaN detectado');
            return 'Tempo inválido';
        }

        // Se for exatamente zero, nunca foi jogado
        if (numMinutes === 0) {
            console.log('⚪ formatPlaytime: 0 minutos = Nunca jogado');
            return 'Nunca jogado';
        }

        // Se for menor que 60 minutos, mostrar em minutos
        if (numMinutes > 0 && numMinutes < 60) {
            console.log('⏱️ formatPlaytime: menos de 1 hora =', numMinutes + 'min');
            return `${numMinutes}min`;
        }

        // Converter para horas com uma casa decimal
        const hours = Math.round(numMinutes / 60 * 10) / 10;
        console.log('⏰ formatPlaytime: conversão para horas =', hours + 'h');
        return `${hours}h`;
    }

    /**
     * Validação visual do Steam ID
     */
    validateSteamIdInput() {
        const steamId = this.elements.steamIdInput.value.trim();
        const inputWrapper = this.elements.steamIdInput.parentElement;

        inputWrapper.classList.remove('valid', 'invalid');

        if (steamId.length === 0) return;

        if (SteamAPI.isValidSteamId(steamId)) {
            inputWrapper.classList.add('valid');
        } else if (steamId.length > 5) { // Só mostra erro após alguns caracteres
            inputWrapper.classList.add('invalid');
        }
    }

    /**
     * Atalhos de teclado
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + Enter para buscar
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            this.elements.searchForm.dispatchEvent(new Event('submit'));
        }

        // Escape para fechar modal
        if (event.key === 'Escape') {
            this.closeHelpModal();
        }

        // F1 para ajuda
        if (event.key === 'F1') {
            event.preventDefault();
            this.openHelpModal();
        }
    }

    // ===== FUNÇÕES DE INTERFACE =====

    setLoading(loading) {
        this.state.isLoading = loading;

        if (loading) {
            this.elements.searchBtn.classList.add('loading');
            this.elements.searchBtn.disabled = true;
        } else {
            this.elements.searchBtn.classList.remove('loading');
            this.elements.searchBtn.disabled = false;
        }
    }

    showMessage(message, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        messageElement.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${this.escapeHtml(message)}</span>
        `;

        this.elements.messageSection.appendChild(messageElement);

        // Auto-remover mensagens de sucesso
        if (type === 'success' && this.config.autoHideSuccessMessages > 0) {
            setTimeout(() => {
                if (messageElement.parentElement) {
                    messageElement.style.opacity = '0';
                    messageElement.style.transform = 'translateY(-20px)';
                    setTimeout(() => messageElement.remove(), 300);
                }
            }, this.config.autoHideSuccessMessages);
        }

        // Scroll para a mensagem
        messageElement.scrollIntoView({
            behavior: this.config.scrollBehavior,
            block: 'center'
        });
    }

    clearMessages() {
        this.elements.messageSection.innerHTML = '';
    }

    showResults() {
        this.elements.resultsSection.style.display = 'block';
        setTimeout(() => {
            this.elements.resultsSection.scrollIntoView({
                behavior: this.config.scrollBehavior,
                block: 'start'
            });
        }, 300);
    }

    hideResults() {
        this.elements.resultsSection.style.display = 'none';
    }

    openHelpModal() {
        this.elements.helpModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeHelpModal() {
        this.elements.helpModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // ===== FUNÇÕES UTILITÁRIAS =====

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== MÉTODOS PÚBLICOS PARA DEBUG =====

    useExampleSteamId(index = 0) {
        const exampleId = this.config.exampleSteamIds[index] || this.config.exampleSteamIds[0];
        this.elements.steamIdInput.value = exampleId;
        this.validateSteamIdInput();
        this.elements.steamIdInput.focus();
    }

    getCurrentGames() {
        return this.state.currentGames;
    }

    getLastSearchParams() {
        return this.state.lastSearchParams;
    }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.steamViewer = new SteamGameViewer();

    // Comandos de console para debug
    console.log(`
🎮 Steam Game Viewer carregado!

Comandos disponíveis no console:
- steamViewer.useExampleSteamId() - Usar Steam ID de exemplo
- steamViewer.getCurrentGames() - Ver jogos carregados
- steamViewer.getLastSearchParams() - Ver última busca
- SteamAPI.testConnection() - Testar conexão com API
    `);
});

// Exportar para acesso global
window.SteamGameViewer = SteamGameViewer;