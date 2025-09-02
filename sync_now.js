// Quick script to trigger sync
fetch('https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/execute-sync', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ force: true })
}).then(r => r.json()).then(d => console.log('Sync result:', d));