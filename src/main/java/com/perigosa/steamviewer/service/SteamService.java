package com.perigosa.steamviewer.service;

import com.perigosa.steamviewer.model.Game;
import com.perigosa.steamviewer.model.SteamApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
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