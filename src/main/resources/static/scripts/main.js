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
            gamesList: document.getElementById('gamesList'),

            // Dashboard elements
            dashboardBtn: document.getElementById('dashboardBtn'),
            closeDashboardBtn: document.getElementById('closeDashboardBtn'),
            dashboardSection: document.getElementById('dashboardSection'),

            // Dashboard content elements
            dashTotalGames: document.getElementById('dashTotalGames'),
            dashTotalHours: document.getElementById('dashTotalHours'),
            dashAverageHours: document.getElementById('dashAverageHours'),
            dashStatus: document.getElementById('dashStatus'),
            topGamesList: document.getElementById('topGamesList'),
            recentGameContent: document.getElementById('recentGameContent'),
            playedGamesProgress: document.getElementById('playedGamesProgress'),
            playedGamesText: document.getElementById('playedGamesText'),
            collectorBadge: document.getElementById('collectorBadge'),
            marathonBadge: document.getElementById('marathonBadge'),
            dashboardTimestamp: document.getElementById('dashboardTimestamp')
        };

        // Estado da aplicação
        this.state = {
            isLoading: false,
            currentGames: [],
            lastSearchParams: null,
            isDashboardLoading: false,
            currentDashboard: null,
            dashboardVisible: false
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

        // Eventos do dashboard
        this.elements.dashboardBtn.addEventListener('click', () => this.showDashboard());
        this.elements.closeDashboardBtn.addEventListener('click', () => this.hideDashboard());

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

        // Mostrar botão do dashboard se há jogos
        if (games.length > 0) {
            this.elements.dashboardBtn.style.display = 'flex';
        } else {
            this.elements.dashboardBtn.style.display = 'none';
            this.hideDashboard(); // Ocultar dashboard se não há jogos
        }

        // Mostrar resultados
        this.showResults();
    }

    /**
     * Cria um card para um jogo - VERSÃO CORRIGIDA
     */
    createGameCard(game, stats) {
        const card = document.createElement('div');
        card.className = 'game-card';

        // DEBUG: Log para verificar os dados recebidos
        console.log('🎮 Debug game data:', {
            name: game.name,
            playtimeForever: game.playtimeForever,
            type: typeof game.playtimeForever,
            rawData: game
        });

        // CORREÇÃO: Usar playtimeForever diretamente, não playtime_forever
        const playtime = Number(game.playtimeForever) || 0;
        const hoursText = this.formatPlaytime(playtime);

        console.log('⏰ Playtime processado:', {
            original: game.playtimeForever,
            converted: playtime,
            formatted: hoursText
        });

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
     * Cria o ícone do jogo - VERSÃO CORRIGIDA SEM ONERROR
     */
    createGameIcon(game) {
        // Verificar se tem URL de imagem válida
        if (game.imgIconUrl &&
            game.imgIconUrl.trim() &&
            !game.imgIconUrl.includes('undefined') &&
            game.imgIconUrl.startsWith('http')) {

            return `<img src="${game.imgIconUrl}" alt="${this.escapeHtml(game.name)}" class="game-icon">`;
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
     * @param {number|string} minutes - Minutos de jogo
     * @returns {string} - Tempo formatado
     */
    formatPlaytime(minutes) {
        // Log para debug
        console.log('🔧 formatPlaytime input:', minutes, 'type:', typeof minutes);

        // Converter para número se for string
        let numMinutes;
        if (typeof minutes === 'string') {
            numMinutes = parseInt(minutes, 10);
        } else {
            numMinutes = Number(minutes);
        }

        // Verificar se é um número válido
        if (isNaN(numMinutes) || numMinutes < 0) {
            console.log('❌ formatPlaytime: valor inválido:', minutes);
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
     * Exibe o dashboard com dados agregados
     */
    async showDashboard() {
        if (!this.state.lastSearchParams) {
            this.showMessage('Primeiro, busque os jogos de um usuário.', 'warning');
            return;
        }

        if (this.state.isDashboardLoading) {
            return; // Previne múltiplas requisições
        }

        try {
            this.setDashboardLoading(true);

            const { steamId } = this.state.lastSearchParams;
            const dashboardData = await SteamAPI.getUserDashboard(steamId);

            this.state.currentDashboard = dashboardData;
            this.displayDashboard(dashboardData);

            // Mostrar seção do dashboard
            this.state.dashboardVisible = true;
            this.elements.dashboardSection.style.display = 'block';

            // Scroll suave para o dashboard
            setTimeout(() => {
                this.elements.dashboardSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);

            this.showMessage('Dashboard carregado com sucesso! 📊', 'success');

        } catch (error) {
            console.error('❌ Erro ao carregar dashboard:', error);
            this.showMessage(`Erro ao carregar dashboard: ${error.message}`, 'error');
        } finally {
            this.setDashboardLoading(false);
        }
    }

    /**
     * Oculta o dashboard
     */
    hideDashboard() {
        this.state.dashboardVisible = false;
        this.elements.dashboardSection.style.display = 'none';

        // Scroll de volta para os resultados
        if (this.elements.resultsSection.style.display === 'block') {
            this.elements.resultsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * Exibe os dados do dashboard na interface
     */
    displayDashboard(dashboardData) {
        const formatted = SteamAPI.formatDashboardData(dashboardData);

        // 1. Visão Geral
        this.elements.dashTotalGames.textContent = formatted.totalGames;
        this.elements.dashTotalHours.textContent = formatted.totalHours;
        this.elements.dashAverageHours.textContent = formatted.stats.averageHours;

        // Status badge
        let statusIcon = '📊';
        if (formatted.totalGames === 0) {
            statusIcon = '😴';
        } else if (formatted.totalGames > 100) {
            statusIcon = '🏆';
        } else if (formatted.stats.hasPlaytime) {
            statusIcon = '🎮';
        }
        this.elements.dashStatus.textContent = statusIcon;

        // 2. Top 5 Jogos
        this.displayTop5Games(formatted.top5Games);

        // 3. Jogo Mais Recente
        this.displayRecentGame(formatted.mostRecentGame);

        // 4. Estatísticas
        this.displayGameStats(formatted, dashboardData);

        // 5. Timestamp
        if (formatted.generatedAt) {
            const date = new Date(formatted.generatedAt);
            const dateStr = date.toLocaleString('pt-BR');
            this.elements.dashboardTimestamp.innerHTML = `
                <i class="fas fa-clock"></i>
                Dados gerados em: ${dateStr}
            `;
        }
    }

    /**
     * Exibe o top 5 de jogos mais jogados
     */
    displayTop5Games(top5Games) {
        if (!top5Games || top5Games.length === 0) {
            this.elements.topGamesList.innerHTML = `
                <div class="no-recent-game">
                    <i class="fas fa-ghost"></i>
                    Nenhum jogo com tempo registrado
                </div>
            `;
            return;
        }

        this.elements.topGamesList.innerHTML = '';

        top5Games.forEach((game, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';

            const gameItem = document.createElement('div');
            gameItem.className = 'top-game-item';

            gameItem.innerHTML = `
                <div class="game-rank ${rankClass}">${rank}</div>
                ${this.createDashboardGameIcon(game)}
                <div class="top-game-info">
                    <div class="top-game-name" title="${this.escapeHtml(game.name)}">
                        ${this.truncateText(game.name, 25)}
                    </div>
                    <div class="top-game-time">${game.playtimeText}</div>
                </div>
            `;

            this.elements.topGamesList.appendChild(gameItem);
        });
    }

    /**
     * Exibe o jogo mais recente
     */
    displayRecentGame(mostRecentGame) {
        if (!mostRecentGame) {
            this.elements.recentGameContent.innerHTML = `
                <div class="no-recent-game">
                    <i class="fas fa-question-circle"></i>
                    Não foi possível determinar o jogo mais recente
                </div>
            `;
            return;
        }

        const playtimeText = SteamAPI.formatPlaytimeHours(mostRecentGame.playtimeForever);

        this.elements.recentGameContent.innerHTML = `
            <div class="recent-game-display">
                ${this.createDashboardGameIcon(mostRecentGame, 'recent-game-icon')}
                <div>
                    <div class="recent-game-name" title="${this.escapeHtml(mostRecentGame.name)}">
                        ${this.truncateText(mostRecentGame.name, 30)}
                    </div>
                    <div class="recent-game-id">ID: ${mostRecentGame.appId}</div>
                    <div class="top-game-time">${playtimeText}</div>
                </div>
            </div>
        `;
    }

/**
 * Exibe estatísticas adicionais - CORRIGIDO
 */
displayGameStats(formatted, dashboardData) {
    console.log('📊 DEBUG - displayGameStats iniciado');
    console.log('📊 DEBUG - formatted:', formatted);
    console.log('📊 DEBUG - dashboardData original:', dashboardData);

    // Calcular jogos jogados vs não jogados
    // CORREÇÃO: Usar os dados formatados que já mapearam snake_case
    const playedGames = formatted.top5Games.length;
    const totalGames = formatted.totalGames;

    // Para calcular todos os jogos com playtime (não só top 5), vamos usar os dados originais
    let allPlayedGames = 0;

    // Tentar obter do backend se disponível
    if (dashboardData && dashboardData.top5_most_played) {
        // Se temos dados do backend, contar quantos jogos têm playtime > 0
        // Para isso, vamos usar a proporção baseada no que sabemos
        allPlayedGames = playedGames; // Por enquanto usar só os do top 5
    } else if (this.state.currentGames) {
        // Fallback: usar jogos locais
        allPlayedGames = this.state.currentGames.filter(game =>
            (game.playtimeForever || game.playtime_forever || 0) > 0
        ).length;
    }

    const playedPercentage = totalGames > 0 ? Math.round((allPlayedGames / totalGames) * 100) : 0;

    console.log('📊 DEBUG - Estatísticas calculadas:', {
        playedGames: allPlayedGames,
        totalGames,
        playedPercentage
    });

    // Atualizar barra de progresso
    this.elements.playedGamesProgress.style.width = '0%';
    setTimeout(() => {
        this.elements.playedGamesProgress.style.width = playedPercentage + '%';
    }, 500);

    this.elements.playedGamesText.textContent = `${allPlayedGames} de ${totalGames} jogos`;

    // Badges de conquista
    this.updateAchievementBadges(formatted);
}

    /**
     * Atualiza badges de conquista
     */
    updateAchievementBadges(formatted) {
        // Badge Colecionador
        const isCollector = formatted.totalGames >= 50;
        if (isCollector) {
            this.elements.collectorBadge.classList.add('active');
            this.elements.collectorBadge.title = `Colecionador! ${formatted.totalGames} jogos`;
        } else {
            this.elements.collectorBadge.classList.remove('active');
            this.elements.collectorBadge.title = `Colete 50 jogos (atual: ${formatted.totalGames})`;
        }

        // Badge Maratonista
        const isMarathoner = formatted.totalMinutes >= 6000; // 100+ horas
        if (isMarathoner) {
            this.elements.marathonBadge.classList.add('active');
            this.elements.marathonBadge.title = `Maratonista! ${formatted.totalHours} jogadas`;
        } else {
            this.elements.marathonBadge.classList.remove('active');
            const needed = Math.round((6000 - formatted.totalMinutes) / 60);
            this.elements.marathonBadge.title = `Jogue 100h+ (faltam ${needed}h)`;
        }
    }

    /**
     * Cria ícone de jogo para o dashboard
     */
    createDashboardGameIcon(game, className = 'top-game-icon') {
        if (game.imgIconUrl &&
            game.imgIconUrl.trim() &&
            !game.imgIconUrl.includes('undefined') &&
            game.imgIconUrl.startsWith('http')) {

            return `<img src="${game.imgIconUrl}" alt="${this.escapeHtml(game.name)}" class="${className}">`;
        } else {
            const gameIcon = this.getGameIcon(game.name);
            return `<div class="${className} no-image"><i class="${gameIcon}"></i></div>`;
        }
    }

    /**
     * Controla o estado de loading do dashboard
     */
    setDashboardLoading(loading) {
        this.state.isDashboardLoading = loading;

        if (loading) {
            this.elements.dashboardBtn.classList.add('loading');
            this.elements.dashboardBtn.disabled = true;
        } else {
            this.elements.dashboardBtn.classList.remove('loading');
            this.elements.dashboardBtn.disabled = false;
        }
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
        this.elements.dashboardBtn.style.display = 'none';
        this.hideDashboard();
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