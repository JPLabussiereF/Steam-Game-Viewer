package com.perigosa.steamviewer.controller;

import com.perigosa.steamviewer.model.Game;
import com.perigosa.steamviewer.service.SteamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Controller REST que define os endpoints da nossa API
 *
 * @RestController indica que esta classe vai retornar dados JSON diretamente
 * @RequestMapping define o prefixo das URLs (/api/games)
 * @CrossOrigin permite que o frontend (HTML/JS) acesse nossa API
 */
@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*") // Permite requisições de qualquer origem (para desenvolvimento)
public class GameController {

    // Injeta o serviço Steam que criamos
    @Autowired
    private SteamService steamService;

    /**
     * Endpoint principal: GET /api/games/{steamId}
     *
     * Exemplos de uso:
     * - GET /api/games/76561198000000000
     * - GET /api/games/76561198000000000?sortBy=name
     * - GET /api/games/76561198000000000?sortBy=playtime
     *
     * @param steamId ID do usuário Steam
     * @param sortBy Critério de ordenação (opcional): "name" ou "playtime"
     * @return Lista de jogos em JSON
     */
    @GetMapping("/{steamId}")
    public ResponseEntity<List<Game>> getUserGames(
            @PathVariable String steamId,  // Pega o steamId da URL
            @RequestParam(required = false, defaultValue = "playtime") String sortBy) { // Parâmetro opcional

        try {
            // Busca os jogos do usuário
            List<Game> games = steamService.getUserGames(steamId);

            // Se não encontrou jogos, retorna lista vazia com status 200
            if (games.isEmpty()) {
                return ResponseEntity.ok(games);
            }

            // Aplica ordenação conforme solicitado
            List<Game> sortedGames = applySorting(games, sortBy);

            // Retorna a lista ordenada com status 200 (OK)
            return ResponseEntity.ok(sortedGames);

        } catch (Exception e) {
            // Se der erro, retorna status 500 (erro interno)
            System.err.println("Erro no controller: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Endpoint para obter dashboard com dados agregados: GET /api/games/{steamId}/dashboard
     *
     * Retorna métricas consolidadas da biblioteca do usuário:
     * - Total de jogos
     * - Total de horas jogadas
     * - Top 5 jogos mais jogados
     * - Jogo mais recentemente adicionado
     *
     * @param steamId ID do usuário Steam
     * @return Dashboard com estatísticas
     */
    @GetMapping("/{steamId}/dashboard")
    public ResponseEntity<DashboardData> getUserDashboard(@PathVariable String steamId) {
        try {
            // Busca todos os jogos do usuário
            List<Game> games = steamService.getUserGames(steamId);

            if (games.isEmpty()) {
                // Retorna dashboard vazio se não há jogos
                DashboardData emptyDashboard = new DashboardData(
                        0, 0, 0.0,
                        new ArrayList<>(),
                        null,
                        LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                );
                return ResponseEntity.ok(emptyDashboard);
            }

            // Calcula métricas do dashboard
            DashboardData dashboard = steamService.calculateDashboard(games);

            return ResponseEntity.ok(dashboard);

        } catch (Exception e) {
            System.err.println("Erro ao gerar dashboard: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Endpoint de teste: GET /api/games/test
     * Útil para verificar se a API está funcionando
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Steam Game Viewer API está funcionando! 🎮");
    }

    /**
     * Endpoint para obter informações sobre a API: GET /api/games/info
     */
    @GetMapping("/info")
    public ResponseEntity<ApiInfo> getApiInfo() {
        ApiInfo info = new ApiInfo(
                "Steam Game Viewer API",
                "1.0.0",
                "API para visualizar biblioteca de jogos Steam",
                "/api/games/{steamId}?sortBy=name|playtime"
        );
        return ResponseEntity.ok(info);
    }

    /**
     * Aplica a ordenação solicitada na lista de jogos
     */
    private List<Game> applySorting(List<Game> games, String sortBy) {
        switch (sortBy.toLowerCase()) {
            case "name":
                return steamService.sortByName(games);
            case "playtime":
            default:
                return steamService.sortByPlaytime(games);
        }
    }

    /**
     * Classe para dados do dashboard
     */
    public static class DashboardData {
        private int totalGames;
        private int totalMinutes;
        private double totalHours;
        private List<Game> top5MostPlayed;
        private Game mostRecentGame;
        private String generatedAt;

        public DashboardData(int totalGames, int totalMinutes, double totalHours,
                             List<Game> top5MostPlayed, Game mostRecentGame, String generatedAt) {
            this.totalGames = totalGames;
            this.totalMinutes = totalMinutes;
            this.totalHours = totalHours;
            this.top5MostPlayed = top5MostPlayed;
            this.mostRecentGame = mostRecentGame;
            this.generatedAt = generatedAt;
        }

        // Getters
        public int getTotalGames() { return totalGames; }
        public int getTotalMinutes() { return totalMinutes; }
        public double getTotalHours() { return totalHours; }
        public List<Game> getTop5MostPlayed() { return top5MostPlayed; }
        public Game getMostRecentGame() { return mostRecentGame; }
        public String getGeneratedAt() { return generatedAt; }

        // Setters
        public void setTotalGames(int totalGames) { this.totalGames = totalGames; }
        public void setTotalMinutes(int totalMinutes) { this.totalMinutes = totalMinutes; }
        public void setTotalHours(double totalHours) { this.totalHours = totalHours; }
        public void setTop5MostPlayed(List<Game> top5MostPlayed) { this.top5MostPlayed = top5MostPlayed; }
        public void setMostRecentGame(Game mostRecentGame) { this.mostRecentGame = mostRecentGame; }
        public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }
    }

    /**
     * Classe auxiliar para retornar informações da API
     */
    public static class ApiInfo {
        private String name;
        private String version;
        private String description;
        private String usage;

        public ApiInfo(String name, String version, String description, String usage) {
            this.name = name;
            this.version = version;
            this.description = description;
            this.usage = usage;
        }

        // Getters
        public String getName() { return name; }
        public String getVersion() { return version; }
        public String getDescription() { return description; }
        public String getUsage() { return usage; }
    }
}