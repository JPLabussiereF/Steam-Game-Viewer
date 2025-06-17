package com.perigosa.steamviewer.service;

import com.perigosa.steamviewer.model.Game;
import com.perigosa.steamviewer.model.SteamApiResponse;
import com.perigosa.steamviewer.controller.GameController.DashboardData;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Serviço responsável por comunicar com a Steam API
 * @Service indica que esta classe é um serviço do Spring (componente gerenciado)
 */
@Service
public class SteamService {

    // Chave da Steam API carregada das variáveis de ambiente/configuração
    // NUNCA colocar chaves diretamente no código!
    @Value("${steam.api.key}")
    private String steamApiKey;

    // URL base da Steam API para obter jogos de um usuário
    private static final String STEAM_API_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/";

    // URL base para construir URLs das imagens dos jogos
    private static final String STEAM_MEDIA_URL = "https://media.steampowered.com/steamcommunity/public/images/apps/";

    // RestTemplate é uma classe do Spring para fazer requisições HTTP
    private final RestTemplate restTemplate;

    // Construtor que inicializa o RestTemplate
    public SteamService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Método principal que busca os jogos de um usuário Steam
     * @param steamId ID do usuário Steam (pode ser SteamID64 ou nome customizado)
     * @return Lista de jogos do usuário
     */
    public List<Game> getUserGames(String steamId) {
        try {
            // Monta a URL completa com os parâmetros necessários
            String url = buildApiUrl(steamId);

            // Faz a requisição para a Steam API e mapeia a resposta para nossa classe
            SteamApiResponse response = restTemplate.getForObject(url, SteamApiResponse.class);

            // Verifica se a resposta é válida
            if (response == null || response.getResponse() == null || response.getResponse().getGames() == null) {
                return new ArrayList<>(); // Retorna lista vazia se não encontrou nada
            }

            // Converte os dados da API para nosso modelo Game e retorna
            return convertToGameList(response.getResponse().getGames());

        } catch (RestClientException e) {
            // Se der erro na requisição (usuário não existe, API fora do ar, etc.)
            System.err.println("Erro ao buscar jogos do Steam: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Calcula todas as métricas para o dashboard
     * @param games Lista de jogos do usuário
     * @return Dados consolidados do dashboard
     */
    public DashboardData calculateDashboard(List<Game> games) {
        if (games == null || games.isEmpty()) {
            return new DashboardData(0, 0, 0.0, new ArrayList<>(), null,
                    LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }

        // 1. Total de jogos
        int totalGames = games.size();

        // 2. Total de minutos/horas jogados
        int totalMinutes = games.stream()
                .mapToInt(Game::getPlaytimeForever)
                .sum();
        double totalHours = Math.round(totalMinutes / 60.0 * 10) / 10.0;

        // 3. Top 5 jogos mais jogados
        List<Game> top5MostPlayed = games.stream()
                .filter(game -> game.getPlaytimeForever() > 0) // Apenas jogos com tempo de jogo
                .sorted(Comparator.comparingInt(Game::getPlaytimeForever).reversed())
                .limit(5)
                .collect(Collectors.toList());

        // 4. Jogo mais recentemente adicionado (usando appId como aproximação)
        // Como a Steam API não retorna data de adição, usamos o maior appId como proxy
        Game mostRecentGame = games.stream()
                .max(Comparator.comparing(game -> Long.parseLong(game.getAppId())))
                .orElse(null);

        // 5. Timestamp de geração
        String generatedAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        return new DashboardData(totalGames, totalMinutes, totalHours,
                top5MostPlayed, mostRecentGame, generatedAt);
    }

    /**
     * Obtém estatísticas detalhadas dos jogos (método auxiliar)
     * @param games Lista de jogos
     * @return Mapa com estatísticas detalhadas
     */
    public Map<String, Object> getDetailedStats(List<Game> games) {
        Map<String, Object> stats = new HashMap<>();

        if (games == null || games.isEmpty()) {
            stats.put("totalGames", 0);
            stats.put("gamesWithPlaytime", 0);
            stats.put("gamesNeverPlayed", 0);
            stats.put("averagePlaytime", 0.0);
            stats.put("longestSession", null);
            return stats;
        }

        // Jogos com tempo de jogo
        List<Game> playedGames = games.stream()
                .filter(game -> game.getPlaytimeForever() > 0)
                .collect(Collectors.toList());

        // Jogos nunca jogados
        int neverPlayed = games.size() - playedGames.size();

        // Tempo médio de jogo (apenas jogos jogados)
        double averagePlaytime = playedGames.stream()
                .mapToInt(Game::getPlaytimeForever)
                .average()
                .orElse(0.0);
        averagePlaytime = Math.round(averagePlaytime / 60.0 * 10) / 10.0; // Converter para horas

        // Jogo com mais horas
        Game longestSession = playedGames.stream()
                .max(Comparator.comparingInt(Game::getPlaytimeForever))
                .orElse(null);

        stats.put("totalGames", games.size());
        stats.put("gamesWithPlaytime", playedGames.size());
        stats.put("gamesNeverPlayed", neverPlayed);
        stats.put("averagePlaytime", averagePlaytime);
        stats.put("longestSession", longestSession);

        return stats;
    }

    /**
     * Obtém jogos por categorias de tempo de jogo
     * @param games Lista de jogos
     * @return Mapa com jogos categorizados por tempo
     */
    public Map<String, List<Game>> categorizeGamesByPlaytime(List<Game> games) {
        Map<String, List<Game>> categories = new HashMap<>();

        if (games == null || games.isEmpty()) {
            categories.put("neverPlayed", new ArrayList<>());
            categories.put("casual", new ArrayList<>());
            categories.put("regular", new ArrayList<>());
            categories.put("hardcore", new ArrayList<>());
            return categories;
        }

        // Categorizar jogos por tempo de jogo
        List<Game> neverPlayed = new ArrayList<>();    // 0 minutos
        List<Game> casual = new ArrayList<>();         // 1-180 minutos (1-3h)
        List<Game> regular = new ArrayList<>();        // 181-1200 minutos (3-20h)
        List<Game> hardcore = new ArrayList<>();       // >1200 minutos (>20h)

        for (Game game : games) {
            int playtime = game.getPlaytimeForever();

            if (playtime == 0) {
                neverPlayed.add(game);
            } else if (playtime <= 180) {
                casual.add(game);
            } else if (playtime <= 1200) {
                regular.add(game);
            } else {
                hardcore.add(game);
            }
        }

        categories.put("neverPlayed", neverPlayed);
        categories.put("casual", casual);
        categories.put("regular", regular);
        categories.put("hardcore", hardcore);

        return categories;
    }

    /**
     * Constrói a URL completa para chamar a Steam API
     */
    private String buildApiUrl(String steamId) {
        return STEAM_API_URL +
                "?key=" + steamApiKey +  // Agora usa a variável injetada
                "&steamid=" + steamId +
                "&include_appinfo=true" +  // Inclui informações do app (nome, etc.)
                "&format=json";            // Resposta em JSON
    }

    /**
     * Converte a lista de GameData (formato da API) para lista de Game (nosso modelo)
     */
    private List<Game> convertToGameList(List<SteamApiResponse.GameData> gameDataList) {
        return gameDataList.stream()
                .map(this::convertToGame)  // Converte cada GameData em Game
                .collect(Collectors.toList());
    }

    /**
     * Converte um GameData individual em Game
     */
    private Game convertToGame(SteamApiResponse.GameData gameData) {
        // Constrói a URL completa da imagem
        String fullImageUrl = buildImageUrl(gameData.getAppId(), gameData.getImgIconUrl());

        return new Game(
                String.valueOf(gameData.getAppId()),
                gameData.getName(),
                gameData.getPlaytimeForever(),
                fullImageUrl
        );
    }

    /**
     * Constrói a URL completa da imagem do jogo
     */
    private String buildImageUrl(int appId, String imgIconUrl) {
        // Verificar se imgIconUrl é válido
        if (imgIconUrl == null || imgIconUrl.trim().isEmpty() || "undefined".equals(imgIconUrl)) {
            return ""; // Retorna vazio se não tem imagem válida
        }

        // Usar a URL correta da Steam para ícones
        // Formato: https://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{hash}.jpg
        return STEAM_MEDIA_URL + appId + "/" + imgIconUrl.trim() + ".jpg";
    }

    /**
     * Ordena a lista de jogos por horas jogadas (decrescente)
     */
    public List<Game> sortByPlaytime(List<Game> games) {
        return games.stream()
                .sorted(Comparator.comparingInt(Game::getPlaytimeForever).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Ordena a lista de jogos por nome (alfabética)
     */
    public List<Game> sortByName(List<Game> games) {
        return games.stream()
                .sorted(Comparator.comparing(Game::getName))
                .collect(Collectors.toList());
    }
}