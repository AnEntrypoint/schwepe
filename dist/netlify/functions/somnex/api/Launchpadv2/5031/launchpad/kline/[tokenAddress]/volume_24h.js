const https = require('https');

// Netlify function to proxy Somnex DEX volume_24h API calls
exports.handler = async function(event, context) {
  const { tokenAddress } = event.pathParameters;

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const apiUrl = `https://api.somniex.com/api/Launchpadv2/5031/launchpad/kline/${tokenAddress}/volume_24h`;

    console.log('🔗 Proxying volume_24h request to:', apiUrl);

    const response = await new Promise((resolve, reject) => {
      const req = https.get(apiUrl, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonData = JSON.parse(data);
              resolve({
                statusCode: res.statusCode,
                headers,
                body: JSON.stringify(jsonData)
              });
            } catch (parseError) {
              resolve({
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to parse API response' })
              });
            }
          } else {
            resolve({
              statusCode: res.statusCode,
              headers,
              body: JSON.stringify({
                error: `API returned status ${res.statusCode}`,
                details: data
              })
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Request failed:', error);
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    console.log('✅ Successfully proxied volume_24h response');
    return response;

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch volume_24h data',
        details: error.message
      })
    };
  }
};