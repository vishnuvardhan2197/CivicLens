package com.civiclens.civiclens.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    private final Environment env;

    public DataSourceConfig(Environment env) {
        this.env = env;
    }

    @Bean
    @Primary
    public DataSource dataSource() {
        // Priority: DATABASE_URL (Render/Neon standard) -> SPRING_DATASOURCE_URL -> spring.datasource.url -> localhost fallback
        String rawUrl = env.getProperty("DATABASE_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("SPRING_DATASOURCE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("spring.datasource.url");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = "jdbc:postgresql://localhost:5432/civiclens";
        }

        // Clean and unquote rawUrl in case environment variable has surrounding quotes
        if (rawUrl != null) {
            rawUrl = rawUrl.trim();
            while ((rawUrl.startsWith("\"") && rawUrl.endsWith("\"")) ||
                   (rawUrl.startsWith("'") && rawUrl.endsWith("'"))) {
                rawUrl = rawUrl.substring(1, rawUrl.length() - 1).trim();
            }
        }

        String username = env.getProperty("SPRING_DATASOURCE_USERNAME");
        String password = env.getProperty("SPRING_DATASOURCE_PASSWORD");

        String maxPoolSizeStr = env.getProperty("DB_MAX_POOL_SIZE", "5");
        int maxPoolSize = 5;
        try {
            maxPoolSize = Integer.parseInt(maxPoolSizeStr);
        } catch (NumberFormatException ignored) {}

        String jdbcUrl = rawUrl;

        // If the URL is in URI format (postgres:// or postgresql:// without jdbc:)
        if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
            try {
                String cleanUri = rawUrl;
                if (cleanUri.startsWith("postgresql://")) {
                    cleanUri = "postgres://" + cleanUri.substring("postgresql://".length());
                }
                URI uri = new URI(cleanUri);

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    if (userInfo.length > 0 && !userInfo[0].isBlank()) {
                        if (username == null || username.isBlank() || "vadlavishnuvaradhanachari".equals(username)) {
                            username = userInfo[0];
                        }
                    }
                    if (userInfo.length > 1 && !userInfo[1].isBlank()) {
                        if (password == null || password.isBlank()) {
                            password = userInfo[1];
                        }
                    }
                }

                String host = uri.getHost();
                int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                String path = uri.getPath();
                if (path == null || path.isEmpty() || path.equals("/")) {
                    path = "/neondb";
                }

                String query = uri.getQuery();
                if (query == null || !query.contains("sslmode")) {
                    query = (query == null || query.isBlank()) ? "sslmode=require" : query + "&sslmode=require";
                }

                jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path + "?" + query;
                log.info("Converted cloud PostgreSQL URI to JDBC URL: {}", maskUrl(jdbcUrl));
            } catch (Exception e) {
                log.warn("Failed to parse PostgreSQL URI, prefixing jdbc: directly: {}", e.getMessage());
                if (!rawUrl.startsWith("jdbc:")) {
                    jdbcUrl = "jdbc:" + rawUrl;
                }
            }
        } else if (rawUrl != null && !rawUrl.startsWith("jdbc:")) {
            jdbcUrl = "jdbc:" + rawUrl;
        }

        // Final fallback for local development if username is still empty
        if (username == null || username.isBlank()) {
            username = env.getProperty("spring.datasource.username", "vadlavishnuvaradhanachari");
        }
        if (password == null) {
            password = env.getProperty("spring.datasource.password", "");
        }

        log.info("Initializing CivicLensHikariPool with JDBC URL: {} and user: {}", maskUrl(jdbcUrl), username);

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setDriverClassName("org.postgresql.Driver");

        if (username != null && !username.isBlank()) {
            config.setUsername(username);
        }
        if (password != null && !password.isBlank()) {
            config.setPassword(password);
        }

        config.setMaximumPoolSize(maxPoolSize);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(300000);
        config.setMaxLifetime(1800000);
        config.setPoolName("CivicLensHikariPool");

        return new HikariDataSource(config);
    }

    private String maskUrl(String url) {
        if (url == null) return "null";
        return url.replaceAll(":[^/@:]+@", ":****@");
    }
}
