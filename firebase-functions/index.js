const functions = require('firebase-functions');
const https = require('https');

// Common CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

// Helper function to make HTTPS requests with timeout
function makeHttpsRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Token Counters Function
exports.tokenCounters = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const address = req.params.address;
  if (!address) {
    return res.status(400).json({ error: 'Address parameter is required' });
  }

  try {
    const apiUrl = `https://explorer-api.somnia.network/api/v2/tokens/${address}/counters`;
    console.log('🔗 Proxying token counters request to:', apiUrl);

    const response = await makeHttpsRequest(apiUrl);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        const jsonData = JSON.parse(response.data);
        console.log('✅ Successfully proxied token counters response');
        return res.status(response.statusCode).json(jsonData);
      } catch (parseError) {
        console.error('❌ Failed to parse API response:', parseError);
        return res.status(500).json({ error: 'Failed to parse API response' });
      }
    } else {
      console.error('❌ API returned error status:', response.statusCode);
      return res.status(response.statusCode).json({
        error: `API returned status ${response.statusCode}`,
        details: response.data
      });
    }
  } catch (error) {
    console.error('❌ Proxy error for token counters:', error);
    return res.status(502).json({
      error: 'Failed to fetch token counters',
      details: error.message
    });
  }
});

// Somnex Volume Function
exports.somnexVolume = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const tokenAddress = req.params.tokenAddress;
  if (!tokenAddress) {
    return res.status(400).json({ error: 'Token address parameter is required' });
  }

  try {
    const apiUrl = `https://api.somniex.com/api/Launchpadv2/5031/launchpad/kline/${tokenAddress}/volume_24h`;
    console.log('🔗 Proxying volume_24h request to:', apiUrl);

    const response = await makeHttpsRequest(apiUrl);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        const jsonData = JSON.parse(response.data);
        console.log('✅ Successfully proxied volume_24h response');
        return res.status(response.statusCode).json(jsonData);
      } catch (parseError) {
        console.error('❌ Failed to parse API response:', parseError);
        return res.status(500).json({ error: 'Failed to parse API response' });
      }
    } else {
      console.error('❌ API returned error status:', response.statusCode);
      return res.status(response.statusCode).json({
        error: `API returned status ${response.statusCode}`,
        details: response.data
      });
    }
  } catch (error) {
    console.error('❌ Proxy error for volume_24h:', error);
    return res.status(502).json({
      error: 'Failed to fetch volume_24h data',
      details: error.message
    });
  }
});

// Somnex Token List Function
exports.somnexTokenList = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const tokenAddress = req.params.tokenAddress;
  if (!tokenAddress) {
    return res.status(400).json({ error: 'Token address parameter is required' });
  }

  try {
    const apiUrl = `https://api.somniex.com/api/Launchpadv2/5031/launchpad/list/${tokenAddress}`;
    console.log('🔗 Proxying token list request to:', apiUrl);

    const response = await makeHttpsRequest(apiUrl);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        const jsonData = JSON.parse(response.data);
        console.log('✅ Successfully proxied token list response');
        return res.status(response.statusCode).json(jsonData);
      } catch (parseError) {
        console.error('❌ Failed to parse API response:', parseError);
        return res.status(500).json({ error: 'Failed to parse API response' });
      }
    } else {
      console.error('❌ API returned error status:', response.statusCode);
      return res.status(response.statusCode).json({
        error: `API returned status ${response.statusCode}`,
        details: response.data
      });
    }
  } catch (error) {
    console.error('❌ Proxy error for token list:', error);
    return res.status(502).json({
      error: 'Failed to fetch token list data',
      details: error.message
    });
  }
});

// SOMNI Price Function
exports.somniPrice = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const somiAddress = req.params.somiAddress;
  if (!somiAddress) {
    return res.status(400).json({ error: 'SOMI address parameter is required' });
  }

  try {
    const apiUrl = `https://api.somniex.com/api/v1/5031/prices/assets/${somiAddress}`;
    console.log('🔗 Proxying SOMNI price request to:', apiUrl);

    const response = await makeHttpsRequest(apiUrl);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        const jsonData = JSON.parse(response.data);
        console.log('✅ Successfully proxied SOMNI price response');
        return res.status(response.statusCode).json(jsonData);
      } catch (parseError) {
        console.error('❌ Failed to parse API response:', parseError);
        return res.status(500).json({ error: 'Failed to parse API response' });
      }
    } else {
      console.error('❌ API returned error status:', response.statusCode);
      return res.status(response.statusCode).json({
        error: `API returned status ${response.statusCode}`,
        details: response.data
      });
    }
  } catch (error) {
    console.error('❌ Proxy error for SOMNI price:', error);
    return res.status(502).json({
      error: 'Failed to fetch SOMNI price data',
      details: error.message
    });
  }
});