# 🎮 Steam Game Viewer

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.0-brightgreen)
![Maven](https://img.shields.io/badge/Maven-3.x-blue)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

Uma aplicação web moderna para visualizar bibliotecas de jogos Steam. Desenvolvida com Spring Boot no backend e HTML/CSS/JavaScript no frontend, oferece uma interface elegante e responsiva para explorar suas coleções de jogos.

## ✨ Funcionalidades

- 🔍 **Busca por Steam ID**: Insira qualquer Steam ID válido para visualizar a biblioteca
- 📊 **Estatísticas Detalhadas**: Total de jogos, horas jogadas e análises
- 🎯 **Ordenação Inteligente**: Organize por nome ou tempo de jogo
- 🖼️ **Ícones dos Jogos**: Visualização com imagens oficiais da Steam
- 📱 **Design Responsivo**: Interface adaptada para desktop e mobile
- ⚡ **Interface Moderna**: Design inspirado na Steam com animações suaves
- 🔒 **Perfis Públicos**: Funciona apenas com perfis Steam públicos

## 🛠️ Tecnologias Utilizadas

### Backend
- **Java 17** - Linguagem principal
- **Spring Boot 3.5.0** - Framework web
- **Maven** - Gerenciamento de dependências
- **Jackson** - Serialização JSON
- **Spring Web** - API REST

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização moderna com gradientes e animações
- **JavaScript ES6+** - Lógica do cliente
- **Font Awesome** - Ícones
- **Google Fonts (Poppins)** - Tipografia

### APIs Externas
- **Steam Web API** - Dados dos jogos e usuários

## 🚀 Como Executar

### Pré-requisitos

- ☕ **Java 17** ou superior
- 📦 **Maven 3.6+**
- 🔑 **Steam API Key** ([obter aqui](https://steamcommunity.com/dev/apikey))
- 💻 **IntelliJ IDEA** (recomendado)

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd steam-game-viewer
   ```

2. **Configure a Steam API Key**

   Crie o arquivo `src/main/resources/application-local.properties`:
   ```properties
   steam.api.key=SUA_STEAM_API_KEY_AQUI
   logging.level.com.perigosa.steamviewer=DEBUG
   ```

3. **Execute via IntelliJ IDEA**
    - Abra o projeto no IntelliJ
    - Aguarde o Maven baixar as dependências
    - Execute a classe `SteamGameViewerApplication.java`
    - Ou use: `Run → Run 'SteamGameViewerApplication'`

4. **Execute via linha de comando**
   ```bash
   ./mvnw spring-boot:run
   ```

5. **Acesse a aplicação**
    - Backend: http://localhost:8080
    - Frontend: Abra `src/main/resources/static/index.html` no navegador
    - API Test: http://localhost:8080/api/games/test

## 🔧 Configuração

### Variáveis de Ambiente

Você pode configurar a Steam API Key via variável de ambiente:

```bash
export STEAM_API_KEY=sua_chave_aqui
```

### Profiles do Spring

- **local**: Para desenvolvimento (padrão)
- **prod**: Para produção

### Porta do Servidor

Por padrão, a aplicação roda na porta 8080. Para alterar:

```properties
server.port=8081
```

## 📁 Estrutura do Projeto

```
steam-game-viewer/
├── src/
│   ├── main/
│   │   ├── java/com/perigosa/steamviewer/
│   │   │   ├── SteamGameViewerApplication.java    # Classe principal
│   │   │   ├── config/
│   │   │   │   └── CorsConfig.java                # Configuração CORS
│   │   │   ├── controller/
│   │   │   │   └── GameController.java            # API REST
│   │   │   ├── model/
│   │   │   │   ├── Game.java                      # Modelo do jogo
│   │   │   │   └── SteamApiResponse.java          # Mapeamento da API Steam
│   │   │   └── service/
│   │   │       └── SteamService.java              # Lógica de negócio
│   │   └── resources/
│   │       ├── static/                            # Frontend
│   │       │   ├── index.html                     # Interface principal
│   │       │   ├── scripts/
│   │       │   │   ├── api.js                     # Comunicação com API
│   │       │   │   └── main.js                    # Lógica do frontend
│   │       │   └── styles/
│   │       │       └── style.css                  # Estilos modernos
│   │       ├── application.properties             # Configurações gerais
│   │       └── application-local.properties       # Configurações locais
├── pom.xml                                        # Dependências Maven
└── README.md                                      # Este arquivo
```

## 🌐 API Endpoints

### Jogos

- **GET** `/api/games/test` - Teste de conectividade
- **GET** `/api/games/info` - Informações da API
- **GET** `/api/games/{steamId}` - Lista jogos do usuário
- **GET** `/api/games/{steamId}?sortBy=name` - Ordenar por nome
- **GET** `/api/games/{steamId}?sortBy=playtime` - Ordenar por tempo (padrão)

### Exemplo de Resposta

```json
[
  {
    "appId": "730",
    "name": "Counter-Strike 2",
    "playtimeForever": 1234,
    "imgIconUrl": "https://media.steampowered.com/steamcommunity/public/images/apps/730/icon.jpg"
  }
]
```

## 🎯 Como Usar

1. **Obtenha seu Steam ID**
    - Visite [steamid.io](https://steamid.io/)
    - Digite seu nome de usuário Steam
    - Copie o "SteamID64" (17 dígitos)

2. **Torne seu perfil público**
    - Entre na Steam
    - Vá em Perfil → Editar Perfil → Configurações de Privacidade
    - Defina "Detalhes do jogo" como "Público"

3. **Use a aplicação**
    - Cole seu Steam ID no campo
    - Escolha a ordenação
    - Clique em "Buscar Jogos"

## 🛡️ Segurança

- ✅ Steam API Key protegida em arquivos de configuração
- ✅ Validação de entrada nos formulários
- ✅ Tratamento de erros robusto
- ✅ CORS configurado adequadamente
- ⚠️ **Nunca commite** `application-local.properties`

## 🎨 Características do Design

- 🌙 **Tema Escuro**: Interface moderna com cores da Steam
- 🎭 **Animações Suaves**: Transições e efeitos visuais
- 📐 **Layout Responsivo**: Funciona em qualquer dispositivo
- 🖼️ **Ícones Dinâmicos**: Fallback inteligente para jogos sem imagem
- ⚡ **Loading States**: Feedback visual durante carregamentos

## 🔍 Troubleshooting

### Problemas Comuns

**Erro: "Steam ID inválido"**
- Verifique se o Steam ID tem 17 dígitos
- Certifique-se que começa com "765611980"

**Erro: "Nenhum jogo encontrado"**
- Verifique se o perfil Steam está público
- Confirme se o Steam ID está correto

**Erro: "Não foi possível conectar com a API"**
- Verifique se o backend está rodando na porta 8080
- Confirme se a Steam API Key está configurada

**Imagens não carregam**
- Problema conhecido da Steam API
- Ícones de fallback são exibidos automaticamente

### Logs Úteis

Para debug, ative logs detalhados em `application-local.properties`:

```properties
logging.level.com.perigosa.steamviewer=DEBUG
logging.level.org.springframework.web=DEBUG
```


## 📄 Licença

Este projeto é um MVP educacional. Steam é marca registrada da Valve Corporation.

## 🤝 Contribuição

Sinta-se à vontade para contribuir com melhorias:

1. Fork o projeto
2. Crie sua feature branch
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Desenvolvido com ❤️ e ☕ usando Spring Boot + HTML/CSS/JS**