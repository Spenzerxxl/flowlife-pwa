// claude-api.js - Claude API Integration für FlowLife PWA
const CLAUDE_API_URL = 'https://automatisierung.frankrath.de/webhook/claude-api';

export async function askClaude(prompt) {
    try {
        const response = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        if (data.success) {
            return data.message;
        }
        console.error('Claude Fehler:', data.error);
        return null;
    } catch (error) {
        console.error('Verbindungsfehler:', error);
        return null;
    }
}

export async function voiceToTask(sprachText) {
    const prompt = `Mache aus diesem Text eine Aufgabe: "${sprachText}" - Gib nur den Task-Titel zurück.`;
    return await askClaude(prompt);
}

export async function getTagesplan() {
    const prompt = 'Erstelle 5 wichtige Aufgaben für einen produktiven Tag. Kurz und praktisch.';
    return await askClaude(prompt);
}
