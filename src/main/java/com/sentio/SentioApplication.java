package com.sentio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.sentio.config.AppProperties;

// @EnableConfigurationProperties tells Spring to process @ConfigurationProperties beans.
// Without this, AppProperties won't be auto-wired from application.yaml.
@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class SentioApplication {

    public static void main(String[] args) {
        SpringApplication.run(SentioApplication.class, args);
    }

}