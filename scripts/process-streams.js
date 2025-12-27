// scripts/process-streams.js
const fs = require('fs');
const path = require('path');

const streamsPath = path.join(__dirname, '../public/streams.json');
const data = JSON.parse(fs.readFileSync(streamsPath, 'utf8'));

// Add proxy_url field for HTTP streams
data.channels = data.channels.map(channel => {
  const needsProxy = channel.url.startsWith('http://');
  
  return {
    ...channel,
    needs_proxy: needsProxy,
    proxy_url: needsProxy 
      ? `/api/proxy?url=${encodeURIComponent(channel.url)}`
      : channel.url,
    is_secure: channel.url.startsWith('https://')
  };
});

// Write back
fs.writeFileSync(streamsPath, JSON.stringify(data, null, 2));
console.log(`Processed ${data.channels.length} channels`);
console.log(`HTTP channels: ${data.channels.filter(c => c.needs_proxy).length}`);
console.log(`HTTPS channels: ${data.channels.filter(c => c.is_secure).length}`);