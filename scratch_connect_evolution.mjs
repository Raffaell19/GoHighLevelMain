// Test and configure Evolution API instance
const EVOLUTION_URL = 'https://evolution-api-kix9.onrender.com';
const API_KEY = 'flowlevel_secret_key_2026';
const INSTANCE_NAME = 'flowlevel_main';
const WEBHOOK_URL = 'https://flowlevel.vercel.app/api/webhooks/whatsapp';

async function main() {
  console.log('--- 1. Testing Evolution API Connectivity ---');
  try {
    const healthRes = await fetch(`${EVOLUTION_URL}`);
    console.log('Root status:', healthRes.status);
    const healthText = await healthRes.text();
    console.log('Root response:', healthText.substring(0, 300));
  } catch (err) {
    console.error('Error contacting Evolution API root:', err.message);
  }

  console.log('\n--- 2. Checking or Creating Instance ---');
  try {
    // Check if instance already exists
    const listRes = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
      headers: { 'apikey': API_KEY }
    });
    console.log('Fetch instances status:', listRes.status);
    const instances = await listRes.json();
    console.log('Existing instances:', JSON.stringify(instances, null, 2));

    const exists = Array.isArray(instances) && instances.some(i => i.name === INSTANCE_NAME);

    if (!exists) {
      console.log(`Creating instance "${INSTANCE_NAME}"...`);
      const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: INSTANCE_NAME,
          token: 'flowlevel_token_2026',
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      });
      console.log('Create instance status:', createRes.status);
      const createData = await createRes.json();
      console.log('Create instance result:', JSON.stringify(createData, null, 2));
    } else {
      console.log(`Instance "${INSTANCE_NAME}" already exists!`);
    }

    console.log('\n--- 3. Configuring Webhook for FlowLevel ---');
    const webhookRes = await fetch(`${EVOLUTION_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: WEBHOOK_URL,
          byEvents: false,
          base64: false,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CONNECTION_UPDATE',
            'QRCODE_UPDATED'
          ]
        }
      })
    });
    console.log('Set webhook status:', webhookRes.status);
    const webhookData = await webhookRes.json();
    console.log('Webhook result:', JSON.stringify(webhookData, null, 2));

    console.log('\n--- 4. Fetching QR Code to Connect Phone ---');
    const qrRes = await fetch(`${EVOLUTION_URL}/instance/connect/${INSTANCE_NAME}`, {
      headers: { 'apikey': API_KEY }
    });
    console.log('Connect/QR status:', qrRes.status);
    const qrData = await qrRes.json();
    console.log('Connect/QR result keys:', Object.keys(qrData));
    if (qrData.base64) {
      console.log('Base64 QR Code received! Length:', qrData.base64.length);
      // Save base64 image as PNG artifact
      const base64Data = qrData.base64.replace(/^data:image\/png;base64,/, '');
      const fs = await import('fs');
      const path = await import('path');
      const qrPath = 'C:\\Users\\rafae\\.gemini\\antigravity-ide\\brain\\f5f56975-9ec1-4af0-ae3e-94bea91884e6\\whatsapp_qrcode.png';
      fs.writeFileSync(qrPath, Buffer.from(base64Data, 'base64'));
      console.log('Saved QR code image to:', qrPath);
    } else if (qrData.code) {
      console.log('QR Code string/pairing code:', qrData.code);
    }
    if (qrData.pairingCode) {
      console.log('Pairing Code (alternate):', qrData.pairingCode);
    }
  } catch (err) {
    console.error('Error during instance operations:', err);
  }
}

main();
