package com.sentio.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

/**
 * Phase 6 — allows the browser to call /api/** from a different origin.
 *
 * The Phase 7 dashboard (index.html) will normally be served as a static
 * resource from this same Spring Boot app, in which case CORS isn't even
 * needed — same-origin requests aren't blocked by the browser. This config
 * matters during local frontend development, e.g. running the dashboard
 * off a separate dev server (Vite, live-server, etc.) on localhost:3000
 * while the backend runs on localhost:8080.
 */
@Configuration
public class CorsConfig implements WebFluxConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000")
                .allowedMethods("GET")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}