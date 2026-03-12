# Offshore Wind Farm Monitor

A full-stack web application for real-time monitoring and control of offshore wind turbines. Displays live telemetry data, alerts, maintenance logs, and allows sending commands to turbines via MQTT.

## Tech Stack

**Server** — .NET 10, ASP.NET Core, Entity Framework Core, PostgreSQL, MQTT (HiveMQ), Server-Sent Events (SSE), JWT authentication

**Client** — React 19, TypeScript, Vite, Recharts, Lucide React, React Router

## Getting Started

### Prerequisites
- .NET 10 SDK
- Node.js 20+
- PostgreSQL (optional — Testcontainers spins one up automatically if not configured)

### Server

```bash
cd server
dotnet run
```

Runs on `http://localhost:5233`.

### Client

```bash
cd client
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## Default Test Account

```
Email:    test@test.com
Password: password123
```

## Features

- Live turbine telemetry via SSE (wind speed, power output, rotor speed, temperatures, etc.)
- Alert system with configurable thresholds
- Send commands to turbines (start, stop, set pitch, set interval)
- Maintenance log
- Command history
- User management
