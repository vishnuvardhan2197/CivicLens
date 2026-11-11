package com.civiclens.civiclens.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebConfig.class);

    @Value("${civiclens.upload.dir:uploads}")
    private String uploadBaseDir;

    @Value("${civiclens.cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadBaseDir).toAbsolutePath().normalize();
        String uploadUri = uploadPath.toUri().toString();

        if (!uploadUri.endsWith("/")) {
            uploadUri += "/";
        }

        log.info("Mapping URL path /uploads/** to filesystem location: {}", uploadUri);

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadUri)
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic());
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);

        registry.addMapping("/uploads/**")
                .allowedOriginPatterns(origins)
                .allowedMethods("GET", "OPTIONS")
                .maxAge(3600);
    }
}
