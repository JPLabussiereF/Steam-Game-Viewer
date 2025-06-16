package com.perigosa.steamviewer.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Configuração CORS (Cross-Origin Resource Sharing)
 *
 * CORS é necessário porque o browser bloqueia requisições entre diferentes origens
 * por segurança. Como nosso frontend (HTML/JS) vai rodar em uma porta diferente
 * do backend (Spring Boot), precisamos permitir essas requisições.
 *
 * @Configuration indica que esta classe contém configurações do Spring
 */
@Configuration
public class CorsConfig {

    /**
     * Configura as regras CORS da aplicação
     * @Bean indica que este método produz um componente gerenciado pelo Spring
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Permite requisições de qualquer origem (para desenvolvimento)
        // Em produção, você deve especificar apenas as origens permitidas
        configuration.addAllowedOriginPattern("*");

        // Permite todos os métodos HTTP (GET, POST, PUT, DELETE, etc.)
        configuration.addAllowedMethod("*");

        // Permite todos os cabeçalhos
        configuration.addAllowedHeader("*");

        // Permite credenciais (cookies, autenticação, etc.)
        configuration.setAllowCredentials(true);

        // Aplica a configuração para todas as URLs da aplicação
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}