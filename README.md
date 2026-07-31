# 🚀 Sentio

> **Real-time Stock Sentiment Analysis Platform** built with **Spring Boot, WebFlux, Apache Kafka, Redis, and VADER Sentiment Analysis**. Sentio continuously ingests financial news, analyzes sentiment in real time, aggregates market insights, and streams live updates to clients using Server-Sent Events (SSE).

![Java](https://img.shields.io/badge/Java-25-orange?style=for-the-badge&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-green?style=for-the-badge&logo=springboot)
![Kafka](https://img.shields.io/badge/Apache_Kafka-Event_Driven-black?style=for-the-badge&logo=apachekafka)
![Redis](https://img.shields.io/badge/Redis-Cache-red?style=for-the-badge&logo=redis)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=for-the-badge&logo=docker)
![WebFlux](https://img.shields.io/badge/Spring-WebFlux-6DB33F?style=for-the-badge)
![Maven](https://img.shields.io/badge/Maven-Build-C71A36?style=for-the-badge&logo=apachemaven)

---

## 📖 Overview

Financial markets react to news within seconds. Sentio provides a **real-time event-driven pipeline** that continuously collects market news, evaluates sentiment using natural language processing, and exposes aggregated insights through REST APIs and live streaming endpoints.

Instead of traditional request-response processing, Sentio leverages **Apache Kafka** to build a scalable asynchronous architecture where every component operates independently.

---

## ✨ Features

- 📰 Live financial news ingestion from Yahoo Finance RSS
- 📊 Real-time stock price polling
- 🧠 VADER-based sentiment analysis
- ⚡ Event-driven architecture powered by Apache Kafka
- 📦 Redis-backed rolling sentiment aggregation
- 📡 Live streaming using Server-Sent Events (SSE)
- 🌐 Reactive REST APIs built with Spring WebFlux
- 🐳 Dockerized infrastructure for Kafka, Redis, and ZooKeeper
- 📈 Interactive dashboard with live market sentiment

---

# 🏗️ Architecture

```text
                    Yahoo Finance RSS
                           │
                           ▼
                  RSS News Scraper
                           │
                           ▼
                  Kafka (raw-news)
                           │
                           ▼
              Sentiment Processor (VADER)
                           │
                           ▼
              Kafka (sentiment-out)
                           │
                           ▼
                 Sentiment Aggregator
                           │
                     Redis Cache
                           │
        ┌──────────────────┴──────────────────┐
        ▼                                     ▼
   REST API                            SSE Stream
        │                                     │
        └──────────── Dashboard ──────────────┘
```

---

# ⚙️ Tech Stack

| Category | Technology |
|----------|------------|
| Language | Java 25 |
| Framework | Spring Boot 4 |
| Reactive Programming | Spring WebFlux |
| Messaging | Apache Kafka |
| Cache | Redis |
| NLP | VADER Sentiment Analysis |
| Data Source | Yahoo Finance RSS |
| Streaming | Server-Sent Events (SSE) |
| Build Tool | Maven |
| Containerization | Docker & Docker Compose |

---

# 🔄 Data Flow

1. RSS Scraper continuously fetches financial news.
2. News articles are published to Kafka (`raw-news` topic).
3. Sentiment Processor consumes articles and computes sentiment using VADER.
4. Processed results are published to Kafka (`sentiment-out` topic).
5. Sentiment Aggregator maintains rolling sentiment statistics in Redis.
6. REST APIs expose historical and aggregated data.
7. SSE streams push live updates directly to connected clients.

---

# 📂 Project Structure

```text
sentio/
│
├── src/
│   ├── main/
│   │   ├── java/com/sentio/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── model/
│   │   │   ├── processor/
│   │   │   ├── scraper/
│   │   │   ├── stream/
│   │   │   └── SentioApplication.java
│   │   └── resources/
│   │       ├── application.yaml
│   │       └── static/
│   │           └── index.html
│   │
│   └── test/
│
├── docker-compose.yml
├── pom.xml
└── README.md
```

---

# 🌐 API Endpoints

## Sentiment APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sentiment/summary` | Overall market sentiment |
| GET | `/api/sentiment/snapshot/{ticker}` | Sentiment snapshot for a stock |
| GET | `/api/sentiment/stream/{ticker}` | Live SSE sentiment updates |

---

## Price APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/price/{ticker}` | Latest stock price |
| GET | `/api/price/full/{ticker}` | Price + sentiment information |

---

# 🚀 Getting Started

## Prerequisites

- Java 25+
- Maven
- Docker Desktop

---

## Clone Repository

```bash
git clone https://github.com/HarshitS17/sentio.git
cd sentio
```

---

## Start Infrastructure

```bash
docker compose up -d
```

This starts:

- Apache Kafka
- ZooKeeper
- Redis

---

## Run the Application

```bash
./mvnw spring-boot:run
```

The application will start on:

```
http://localhost:8080
```

---

# 📡 Live Streaming

Connect to the Server-Sent Events endpoint:

```bash
curl -N http://localhost:8080/api/sentiment/stream/AAPL
```

Example response:

```text
event: sentiment-update
data: {
  "ticker":"AAPL",
  "averageScore":0.74,
  "label":"POSITIVE"
}
```

---

# 🎯 Future Improvements

- Authentication & user watchlists
- Historical sentiment analytics
- Market trend prediction
- Multi-source news aggregation
- AI-powered sentiment classification
- Alert notifications for sentiment changes
- Kubernetes deployment
- Prometheus & Grafana monitoring

---

# ⭐ Why Sentio?

Sentio demonstrates modern backend engineering concepts including:

- Reactive programming with Spring WebFlux
- Event-driven microservice architecture
- Asynchronous processing using Kafka
- Redis caching strategies
- Real-time streaming with SSE
- NLP-based sentiment analysis
- Dockerized distributed systems

It serves as a practical example of building scalable, low-latency backend systems for real-time financial analytics.
