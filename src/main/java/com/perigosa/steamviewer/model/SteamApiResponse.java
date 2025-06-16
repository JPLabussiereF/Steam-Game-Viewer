package com.perigosa.steamviewer.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Classes para mapear a resposta JSON da Steam API
 *
 * A Steam API retorna uma estrutura JSON aninhada como:
 * {
 *   "response": {
 *     "game_count": 123,
 *     "games": [
 *       {
 *         "appid": 730,
 *         "name": "Counter-Strike 2",
 *         "playtime_forever": 1234,
 *         "img_icon_url": "..."
 *       }
 *     ]
 *   }
 * }
 */
public class SteamApiResponse {

    // Mapeia o campo "response" do JSON
    @JsonProperty("response")
    private ResponseData response;

    public ResponseData getResponse() {
        return response;
    }

    public void setResponse(ResponseData response) {
        this.response = response;
    }

    /**
     * Classe interna que representa o conteúdo do campo "response"
     */
    public static class ResponseData {

        // Número total de jogos na biblioteca
        @JsonProperty("game_count")
        private int gameCount;

        // Lista de jogos
        @JsonProperty("games")
        private List<GameData> games;

        public int getGameCount() {
            return gameCount;
        }

        public void setGameCount(int gameCount) {
            this.gameCount = gameCount;
        }

        public List<GameData> getGames() {
            return games;
        }

        public void setGames(List<GameData> games) {
            this.games = games;
        }
    }

    /**
     * Classe que representa cada jogo na resposta da API
     * Usa @JsonProperty para mapear os nomes com underscore do JSON
     * para os nomes em camelCase do Java
     */
    public static class GameData {

        @JsonProperty("appid")
        private int appId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("playtime_forever")
        private int playtimeForever;

        @JsonProperty("img_icon_url")
        private String imgIconUrl;

        // Getters e Setters
        public int getAppId() {
            return appId;
        }

        public void setAppId(int appId) {
            this.appId = appId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getPlaytimeForever() {
            return playtimeForever;
        }

        public void setPlaytimeForever(int playtimeForever) {
            this.playtimeForever = playtimeForever;
        }

        public String getImgIconUrl() {
            return imgIconUrl;
        }

        public void setImgIconUrl(String imgIconUrl) {
            this.imgIconUrl = imgIconUrl;
        }
    }
}