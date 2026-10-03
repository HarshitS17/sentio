package com.sentio.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

/**
 * Allows the browser to call /api/** from a different origin.
 *
 * During local dev the Next.js frontend runs on localhost:3000.
 * When deployed to Vercel the origin is a vercel.app domain.
 *
 * Allowed origins are controlled via the CORS_ALLOWED_ORIGINS env var
 * (comma-separated). Falls back to localhost:3000 for local development.
 *
 * Example (set in your shell before running the app, or in application.yaml):
 *   CORS_ALLOWED_ORIGINS=http://localhost:3000,https://sentio-ui.vercel.app
 */
@Configuration
public class CorsConfig implements WebFluxConfigurer {

    @Value("${cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")   // allows any origin incl. Vercel previews
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Content-Type", "Cache-Control")
                .maxAge(3600);
    }
}