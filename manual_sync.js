// MANUAL TRIGGER - Run this to sync products now
console.log('🚀 MANUAL SYNC STARTING...');

fetch('https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/execute-sync', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
})
.then(r => r.json())
.then(result => {
  console.log('✅ SYNC RESULT:', result);
  if (result.success && result.verified_count > 0) {
    console.log(`🎉 SUCCESS! ${result.verified_count} products loaded. Refreshing page...`);
    setTimeout(() => window.location.reload(), 1000);
  } else {
    console.error('❌ Sync failed or no products loaded');
  }
})
.catch(e => console.error('❌ Sync error:', e));