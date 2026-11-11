package com.civiclens.civiclens.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:${SPRING_DATASOURCE_URL:${DATABASE_URL:jdbc:postgresql://localhost:5432/civiclens}}}")
    private String rawUrl;

    @Value("${spring.datasource.username:${SPRING_DATASOURCE_USERNAME:}}")
    private String configuredUsername;

    @Value("${spring.datasource.password:${SPRING_DATASOURCE_PASSWORD:}}")
    private String configuredPassword;

    @Value("${spring.datasource.hikari.maximum-pool-size:${DB_MAX_POOL_SIZE:5}}")
    private int maxPoolSize;

    @Bean
    @Primary
    public DataSource dataSource() {
        String jdbcUrl = rawUrl;
        String username = configuredUsername;
        String password = configuredPassword;

        log.info("Configuring DataSource from URL: {}", maskUrl(rawUrl));

        // If the URL starts with postgres:// or postgresql:// (URI format without jdbc:)
        if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
            try {
                String cleanUri = rawUrl;
                if (cleanUri.startsWith("postgresql://")) {
                    cleanUri = "postgres://" + cleanUri.substring("postgresql://".length());
                }
                URI uri = new URI(cleanUri);

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    if (username == null || username.isBlank()) {
                        username = userInfo[0];
                    }
                    if (userInfo.length > 1 && (password == null || password.isBlank())) {
                        password = userInfo[1];
                    }
                }

                String host = uri.getHost();
                int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                String path = uri.getPath();
                if (path == null || path.isEmpty() || path.equals("/")) {
                    path = "/civiclens";
                }

                String query = uri.getQuery();
                // Ensure sslmode=require for cloud PostgreSQL (Neon / Supabase) if not specified
                if (query == null || !query.contains("sslmode")) {
                    query = (query == null || query.isBlank()) ? "sslmode=require" : query + "&sslmode=require";
                }

                jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path + "?" + query;
                log.info("Successfully converted PostgreSQL URI to JDBC URL: {}", maskUrl(jdbcUrl));
            } catch (Exception e) {
                log.warn("Failed to parse PostgreSQL URI, prefixing jdbc: directly: {}", e.getMessage());
                if (!rawUrl.startsWith("jdbc:")) {
                    jdbcUrl = "jdbc:" + rawUrl;
                }
            }
        } else if (rawUrl != null && !rawUrl.startsWith("jdbc:")) {
            jdbcUrl = "jdbc:" + rawUrl;
        }

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
