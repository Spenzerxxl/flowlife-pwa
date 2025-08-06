// FlowLife API Configuration
// Zentrale Konfiguration für alle Services

const API_CONFIG = {
  // Supabase Configuration
  SUPABASE: {
    URL: 'https://database.frankrath.de',
    ANON_KEY: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0NzA3MzU4MCwiZXhwIjo0OTAyNzQ3MTgwLCJyb2xlIjoiYW5vbiJ9.0l5w0smQh1FDN-nGnfmNbX80smyL-XcQM9C69OwE3Vo',
    SERVICE_ROLE_KEY: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0NzA3MzU4MCwiZXhwIjo0OTAyNzQ3MTgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.urkL3g5E7yposT7qR1-8t_Naikfelx1NzozaL5iT2g8'
  },
  
  // n8n Webhook Endpoints
  N8N_WEBHOOKS: {
    BASE_URL: 'https://automatisierung.frankrath.de/webhook',
    ENDPOINTS: {
      SEND_MAIL: '/flowlife/send-mail',
      PROCESS_VOICE: '/flowlife/process-voice',
      CREATE_TASK: '/flowlife/create-task',
      UPDATE_PROGRESS: '/flowlife/update-progress',
      GENERATE_SUGGESTION: '/flowlife/generate-suggestion'
    }
  },
  
  // Claude API (für direkte Calls aus Frontend)
  CLAUDE: {
    API_URL: 'https://api.anthropic.com/v1/messages',
    MODEL: 'claude-3-haiku-20240307',
    MAX_TOKENS: 1000
  },
  
  // Voice Configuration
  VOICE: {
    LANGUAGE: 'de-DE',
    CONTINUOUS: false,
    INTERIM_RESULTS: false,
    MAX_ALTERNATIVES: 1
  },
  
  // PWA Configuration
  PWA: {
    NAME: 'FlowLife',
    SHORT_NAME: 'FlowLife',
    DESCRIPTION: 'Voice-Powered Life Management System',
    THEME_COLOR: '#2563eb',
    BACKGROUND_COLOR: '#f3f4f6',
    DISPLAY: 'standalone',
    ORIENTATION: 'portrait',
    START_URL: '/',
    SCOPE: '/'
  }
};

// Mail Templates mit verschiedenen Tönen
const MAIL_TEMPLATES = {
  bestatter: {
    subject: 'Beerdigung - Weitere Details besprechen',
    tone: 'formal, respektvoll, professionell',
    prompt: 'Schreibe eine formelle und respektvolle E-Mail an einen Bestatter.'
  },
  family_info: {
    subject: 'Beerdigung - Wichtige Informationen',
    tone: 'warm, informativ, mitfühlend',
    prompt: 'Schreibe eine informative aber warmherzige E-Mail an Familienmitglieder.'
  },
  support_offer: {
    subject: 'Meine Unterstützung in dieser schweren Zeit',
    tone: 'einfühlsam, hilfsbereit, persönlich',
    prompt: 'Schreibe eine einfühlsame E-Mail mit konkreten Hilfsangeboten.'
  },
  birthday_formal: {
    subject: 'Herzlichen Glückwunsch zum Geburtstag!',
    tone: 'herzlich, traditionell, respektvoll',
    prompt: 'Schreibe eine herzliche aber formelle Geburtstagsgratulation.'
  },
  business: {
    subject: 'KI-Implementation - Nächste Schritte',
    tone: 'professionell, konstruktiv, lösungsorientiert',
    prompt: 'Schreibe eine professionelle Business-E-Mail über KI-Implementation.'
  },
  reminder: {
    subject: 'Freundliche Erinnerung',
    tone: 'freundlich, bestimmt, respektvoll',
    prompt: 'Schreibe eine freundliche aber bestimmte Erinnerungs-E-Mail.'
  }
};

module.exports = { API_CONFIG, MAIL_TEMPLATES };
