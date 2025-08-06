# FlowLife Deployment Plan

## 🗂️ Projektstruktur
```
/home/frank/flowlife/
├── supabase_schema.sql      ✅ Erstellt
├── n8n_workflow_mail_sender.json ✅ Erstellt  
├── api_config.js            ✅ Erstellt
├── deploy_plan.md           ✅ Erstellt
├── client/                  🔜 React PWA Build
│   ├── build/              
│   ├── public/
│   └── src/
├── docker-compose.yml       🔜 Für Deployment
└── nginx.conf              🔜 Für Reverse Proxy
```

## 📋 Nächste Schritte

### 1. Supabase Schema aktivieren
- [ ] In Supabase Dashboard einloggen (https://database.frankrath.de)
- [ ] SQL Editor öffnen
- [ ] Schema ausführen
- [ ] Test-User anlegen

### 2. n8n Workflows importieren  
- [ ] In n8n einloggen (https://automatisierung.frankrath.de)
- [ ] Workflow importieren
- [ ] Gmail Credentials einrichten
- [ ] Claude API Key hinterlegen
- [ ] Webhook-URLs notieren

### 3. React PWA Build
- [ ] Production Build erstellen
- [ ] Service Worker konfigurieren
- [ ] Manifest.json anpassen
- [ ] Icons generieren

### 4. Deployment via Docker
- [ ] Docker Container erstellen
- [ ] Nginx Reverse Proxy
- [ ] SSL via Let's Encrypt
- [ ] Domain: flowlife.frankrath.de

### 5. Testing
- [ ] Voice Input Test (Desktop + Mobile)
- [ ] Mail-Versand Test
- [ ] Offline-Funktionalität
- [ ] PWA Installation

## 🔗 URLs nach Deployment
- **App:** https://flowlife.frankrath.de
- **API:** https://automatisierung.frankrath.de/webhook/flowlife/*
- **Database:** https://database.frankrath.de (Supabase)
- **Monitoring:** Via Coolify Dashboard

## 🔐 Credentials benötigt
- [ ] Gmail OAuth2 Client ID & Secret
- [ ] Claude API Key
- [ ] Neue Supabase Projekt-Keys (falls separates Projekt)
- [ ] Domain DNS Einträge

## 📱 PWA Features
- ✅ Installierbar auf Mobile/Desktop
- ✅ Offline-fähig mit Service Worker
- ✅ Push Notifications für Deadlines
- ✅ Voice Input optimiert
- ✅ Responsive Design

## 🚀 Launch Checklist
- [ ] Alle APIs verbunden
- [ ] Workflows getestet
- [ ] Mobile Tests erfolgreich
- [ ] Backup-Strategie definiert
- [ ] Monitoring eingerichtet
