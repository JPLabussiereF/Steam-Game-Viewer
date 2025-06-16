package com.perigosa.steamviewer.controller;

import com.perigosa.steamviewer.model.Game;
import com.perigosa.steamviewer.service.SteamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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