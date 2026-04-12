const http = require('http');

async function run() {
  const fetch = (await import('node-fetch')).default;
  const BASE_URL = 'http://localhost:3000/api/v1';
  
  // 1. Create Report
  let res = await fetch(`${BASE_URL}/public-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nic: '901234567V' })
  });
  let json = await res.json();
  console.log('Create Report:', res.status, json);
  
  if (res.status !== 201) return;
  const reportId = json.data.report._id;
  
  const steps = [
    { waterSource: 'well' },
    {
      location: {
        district: 'Colombo',
        city: 'Nugegoda',
        coordinates: { lat: 6.9, lng: 79.8 }
      }
    },
    { testingMethod: 'observation' },
    { appearance: { value: 'clear', notes: '' }, turbidity: { value: 'clear' } }
  ];
  
  for (let i = 0; i < steps.length; i++) {
    res = await fetch(`${BASE_URL}/public-reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(steps[i])
    });
    json = await res.json();
    console.log(`Update Step ${i}:`, res.status, json);
  }
  
  // Submit Report
  res = await fetch(`${BASE_URL}/public-reports/${reportId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  json = await res.json();
  console.log('Submit Report:', res.status, json);
}

run().catch(console.error);
