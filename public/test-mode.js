
// Temporärer Test-Modus ohne echte Google Auth
window.testMode = true;
window.mockCalendarEvents = [
  {
    id: '1',
    summary: 'Test Meeting',
    start: { dateTime: new Date().toISOString() },
    end: { dateTime: new Date(Date.now() + 3600000).toISOString() }
  }
];

