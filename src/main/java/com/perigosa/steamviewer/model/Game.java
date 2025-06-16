package com.perigosa.steamviewer.model;

/**
 * Classe que representa um jogo da Steam
 * Esta é nossa entidade principal que vai armazenar as informações básicas de cada jogo
 */
public class Game {

    // ID único do jogo na Steam (cada jogo tem um número identificador)
    private String appId;

    // Nome do jogo (ex: "Counter-Strike 2", "Dota 2")
    private String name;

    // Tempo total jogado em minutos (a Steam API retorna em minutos)
    private int playtimeForever;

    // URL da imagem/ícone do jogo
    private String imgIconUrl;

    // Construtor vazio (necessário para serialização JSON)
    public Game() {
    }

    // Construtor completo para criar um jogo com todos os dados
    public Game(String appId, String name, int playtimeForever, String imgIconUrl) {
        this.appId = appId;
        this.name = name;
        this.playtimeForever = playtimeForever;
        this.imgIconUrl = imgIconUrl;
    }

    // Getters e Setters (métodos para acessar e modificar os atributos)

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
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

    // Método para converter minutos em horas (útil para exibição)
    public double getPlaytimeHours() {
        return playtimeForever / 60.0;
    }

    // Método toString para debug (facilita ver os dados do objeto)
    @Override
    public String toString() {
        return "Game{" +
                "appId='" + appId + '\'' +
                ", name='" + name + '\'' +
                ", playtimeForever=" + playtimeForever +
                ", imgIconUrl='" + imgIconUrl + '\'' +
                '}';
    }
}