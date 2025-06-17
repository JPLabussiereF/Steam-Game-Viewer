/**
 * API Module - Comunicação com o backend Spring Boot
 * Responsável por todas as chamadas para a API REST
 */

// Configurações da API
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/games',
    TIMEOUT: 30000, // 30 segundos
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

/**
 * Classe para gerenciar todas as operações da API
 */
class SteamAPI {

    /**
     * Testa se a API está funcionando
     * @returns {Promise<boolean>} - True se API estiver online
     */
    static async testConnection() {
        try {
            console.log('🔍 Testando conexão com a API...');

            const response = await fetch(`${API_CONFIG.BASE_URL}/test`, {
                method: 'GET',
                headers: API_CONFIG.HEADERS,
                signal: AbortSignal.timeout(5000) // 5 segundos para teste
            });

            if (response.ok) {
                const message = await response.text();
                console.log('✅ API conectada:', message);
                return true;
            } else {
                console.error('❌ API respondeu com erro:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro ao conectar com a API:', error.message);
            return false;
        }
    }

    /**
     * Obtém informações sobre a API
     * @returns {Promise<Object>} - Informações da API
     */
    static async getApiInfo() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/info`, {
                method: 'GET',
                headers: API_CONFIG.HEADERS,
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Erro ao obter informações da API:', error);
            throw error;
        }
    }

    /**
     * Busca jogos de um usuário Steam
     * @param {string} steamId - ID do usuário Steam
     * @param {string} sortBy - Critério de ordenação ('name' ou 'playtime')
     * @returns {Promise<Array>} - Lista de jogos
     */
    static async getUserGames(steamId, sortBy = 'playtime') {
        try {
            // Validar parâmetros
            if (!steamId || typeof steamId !== 'string') {
                throw new Error('Steam ID é obrigatório e deve ser uma string');
            }

            if (!['name', 'playtime'].includes(sortBy)) {
                throw new Error('sortBy deve ser "name" ou "playtime"');
            }

            // Construir URL
            const url = `${API_CONFIG.BASE_URL}/${encodeURIComponent(steamId)}?sortBy=${encodeURIComponent(sortBy)}`;

            console.log('🔍 Buscando jogos:', { steamId, sortBy, url });

            // Fazer requisição
            const response = await fetch(url, {
                method: 'GET',
                headers: API_CONFIG.HEADERS,
                signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
            });

            // Verificar resposta
            if (!response.ok) {
                const errorMessage = await this.handleErrorResponse(response);
                throw new Error(errorMessage);
            }

            const games = await response.json();

            // DEBUG: Log da resposta completa
            console.log('📥 Resposta da API (primeiros 2 jogos):', games.slice(0, 2));

            // DEBUG: Verificar estrutura dos dados
            if (games.length > 0) {
                const firstGame = games[0];
                console.log('🔍 Estrutura do primeiro jogo:', {
                    keys: Object.keys(firstGame),
                    playtimeForever: firstGame.playtimeForever,
                    playtimeForeverType: typeof firstGame.playtimeForever,
                    appId: firstGame.appId || firstGame.app_id,
                    name: firstGame.name
                });
            }

            console.log('🎮 Jogos encontrados:', games.length);

            // Validar estrutura dos dados
            if (!Array.isArray(games)) {
                throw new Error('Resposta da API inválida: esperado array de jogos');
            }

            // CORREÇÃO: Normalizar os dados se necessário
            const normalizedGames = games.map(game => {
                // Se a API retorna snake_case, converter para camelCase
                if (game.app_id && !game.appId) {
                    return {
                        appId: game.app_id,
                        name: game.name,
                        playtimeForever: game.playtime_forever || 0,
                        imgIconUrl: game.img_icon_url || ''
                    };
                }
                return game;
            });

            console.log('🔄 Dados normalizados (primeiro jogo):', normalizedGames[0]);

            return normalizedGames;

        } catch (error) {
            console.error('❌ Erro ao buscar jogos:', error);
            throw error;
        }
    }

/**
 * Obtém dados do dashboard de um usuário Steam - VERSÃO CORRIGIDA
 * @param {string} steamId - ID do usuário Steam
 * @returns {Promise<Object>} - Dados do dashboard
 */
static async getUserDashboard(steamId) {
    try {
        console.log('📡 DEBUG - getUserDashboard iniciado para:', steamId);

        // Validar parâmetros
        if (!steamId || typeof steamId !== 'string') {
            throw new Error('Steam ID é obrigatório e deve ser uma string');
        }

        // Construir URL
        const url = `${API_CONFIG.BASE_URL}/${encodeURIComponent(steamId)}/dashboard`;
        console.log('📡 DEBUG - URL:', url);

        // Fazer requisição
        const response = await fetch(url, {
            method: 'GET',
            headers: API_CONFIG.HEADERS,
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
        });

        if (!response.ok) {
            const errorMessage = await this.handleErrorResponse(response);
            throw new Error(errorMessage);
        }

        const dashboard = await response.json();
        console.log('📊 DEBUG - Dashboard recebido (snake_case):', dashboard);

        // CORREÇÃO PRINCIPAL: Converter snake_case para camelCase
        const convertedDashboard = {
            totalGames: dashboard.total_games || 0,
            totalMinutes: dashboard.total_minutes || 0,
            totalHours: dashboard.total_hours || 0,
            top5MostPlayed: (dashboard.top5_most_played || []).map(game => ({
                appId: game.app_id,
                name: game.name,
                playtimeForever: game.playtime_forever,
                imgIconUrl: game.img_icon_url
            })),
            mostRecentGame: dashboard.most_recent_game ? {
                appId: dashboard.most_recent_game.app_id,
                name: dashboard.most_recent_game.name,
                playtimeForever: dashboard.most_recent_game.playtime_forever,
                imgIconUrl: dashboard.most_recent_game.img_icon_url
            } : null,
            generatedAt: dashboard.generated_at
        };

        console.log('✅ DEBUG - Dashboard convertido (camelCase):', convertedDashboard);
        return convertedDashboard;

    } catch (error) {
        console.error('❌ Erro ao buscar dashboard:', error);
        throw error;
    }
}

    /**
     * Formata dados do dashboard para exibição
     * @param {Object} dashboard - Dados brutos do dashboard
     * @returns {Object} - Dados formatados
     */
    static formatDashboardData(dashboard) {
        if (!dashboard) {
            return {
                totalGames: 0,
                totalHours: '0h',
                top5Games: [],
                mostRecentGame: null,
                stats: {
                    hasGames: false,
                    hasPlaytime: false,
                    averageHours: '0h'
                }
            };
        }

        // Formatar horas totais
        const totalHours = dashboard.totalHours || 0;
        const totalHoursText = totalHours < 1 ?
            `${dashboard.totalMinutes || 0}min` :
            `${totalHours}h`;

        // Formatar top 5 jogos
        const top5Games = (dashboard.top5MostPlayed || []).map(game => ({
            ...game,
            playtimeText: this.formatPlaytimeHours(game.playtimeForever)
        }));

        // Calcular estatísticas adicionais
        const hasGames = dashboard.totalGames > 0;
        const hasPlaytime = dashboard.totalMinutes > 0;
        const averageHours = hasGames && hasPlaytime ?
            Math.round((dashboard.totalMinutes / dashboard.totalGames) / 60 * 10) / 10 : 0;

        return {
            totalGames: dashboard.totalGames || 0,
            totalHours: totalHoursText,
            totalMinutes: dashboard.totalMinutes || 0,
            top5Games,
            mostRecentGame: dashboard.mostRecentGame,
            generatedAt: dashboard.generatedAt,
            stats: {
                hasGames,
                hasPlaytime,
                averageHours: averageHours > 0 ? `${averageHours}h` : '0h'
            }
        };
    }

    /**
     * Formata tempo de jogo em horas (método auxiliar)
     * @param {number} minutes - Minutos de jogo
     * @returns {string} - Tempo formatado
     */
    static formatPlaytimeHours(minutes) {
        if (!minutes || minutes === 0) return 'Nunca jogado';

        const hours = Math.round(minutes / 60 * 10) / 10;
        return hours < 1 ? `${minutes}min` : `${hours}h`;
    }

    /**
     * Trata erros de resposta HTTP e retorna mensagem apropriada
     * @param {Response} response - Resposta HTTP
     * @returns {Promise<string>} - Mensagem de erro
     */
    static async handleErrorResponse(response) {
        try {
            const errorData = await response.text();

            switch (response.status) {
                case 400:
                    return 'Requisição inválida. Verifique o Steam ID informado.';
                case 404:
                    return 'Steam ID não encontrado ou perfil inexistente.';
                case 500:
                    return 'Erro interno do servidor. Tente novamente mais tarde.';
                case 503:
                    return 'Serviço temporariamente indisponível.';
                default:
                    return `Erro HTTP ${response.status}: ${errorData || 'Erro desconhecido'}`;
            }
        } catch (e) {
            return `Erro HTTP ${response.status}: Não foi possível processar a resposta do servidor`;
        }
    }

    /**
     * Valida se um Steam ID está no formato correto
     * @param {string} steamId - Steam ID para validar
     * @returns {boolean} - True se válido
     */
    static isValidSteamId(steamId) {
        if (!steamId || typeof steamId !== 'string') {
            return false;
        }

        // Steam ID deve ter 17 dígitos e começar com 765611980
        const steamIdRegex = /^765611980\d{8}$/;

        // Também aceitar IDs com 17 dígitos que começam com 76561198
        const alternativeRegex = /^76561198\d{9}$/;

        return steamIdRegex.test(steamId) || alternativeRegex.test(steamId);
    }

    /**
     * Obtém estatísticas dos jogos
     * @param {Array} games - Lista de jogos
     * @returns {Object} - Estatísticas calculadas
     */
    static calculateGameStats(games) {
        if (!Array.isArray(games) || games.length === 0) {
            return {
                totalGames: 0,
                totalMinutes: 0,
                totalHours: 0,
                averageHours: 0,
                mostPlayedGame: null,
                gamesWithPlaytime: 0
            };
        }

        // Garantir que playtimeForever é sempre um número
        const validGames = games.map(game => ({
            ...game,
            playtimeForever: Number(game.playtimeForever) || 0
        }));

        const totalMinutes = validGames.reduce((sum, game) => sum + game.playtimeForever, 0);
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
        const gamesWithPlaytime = validGames.filter(game => game.playtimeForever > 0).length;
        const averageHours = gamesWithPlaytime > 0 ? Math.round(totalHours / gamesWithPlaytime * 10) / 10 : 0;

        // Encontrar jogo mais jogado
        const mostPlayedGame = validGames.reduce((max, game) =>
            game.playtimeForever > max.playtimeForever ? game : max, validGames[0]
        );

        return {
            totalGames: validGames.length,
            totalMinutes,
            totalHours,
            averageHours,
            mostPlayedGame: mostPlayedGame.playtimeForever > 0 ? mostPlayedGame : null,
            gamesWithPlaytime
        };
    }
}

// Exportar para uso global
window.SteamAPI = SteamAPI;

// Log de inicialização
console.log('📡 SteamAPI module carregado!');