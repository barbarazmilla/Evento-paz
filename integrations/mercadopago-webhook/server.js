const http = require('http');

const PORT = Number(process.env.PORT || 8080);
const MP_WEBHOOK_PATH = process.env.MP_WEBHOOK_PATH || '/webhooks/mercadopago';

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    return sendJson(res, 200, { ok: true, service: 'mercadopago-webhook' });
  }

  if (req.method === 'POST' && requestUrl.pathname === MP_WEBHOOK_PATH) {
    try {
      const rawBody = await readBody(req);
      const payload = parseJsonSafely(rawBody);
      const paymentId = extractPaymentId(payload, requestUrl);

      if (!paymentId) {
        return sendJson(res, 202, { ok: true, ignored: 'missing_payment_id' });
      }

      const payment = await fetchMercadoPagoPayment(paymentId);
      if (!payment || !payment.id) {
        return sendJson(res, 202, { ok: true, ignored: 'payment_not_found' });
      }

      if (!payment.external_reference) {
        return sendJson(res, 202, { ok: true, ignored: 'missing_external_reference' });
      }

      const appsScriptResponse = await updateAppsScript(payment);

      return sendJson(res, 200, {
        ok: true,
        payment_id: String(payment.id),
        external_reference: String(payment.external_reference),
        status: payment.status,
        apps_script: appsScriptResponse
      });
    } catch (error) {
      console.error('[webhook_error]', error);
      return sendJson(res, 500, { ok: false, error: error.message });
    }
  }

  return sendJson(res, 404, { ok: false, error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`Mercado Pago webhook listening on port ${PORT}`);
});

async function fetchMercadoPagoPayment(paymentId) {
  const accessToken = requireEnv('MP_ACCESS_TOKEN');
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`mercadopago_api_error_${response.status}: ${message}`);
  }

  return response.json();
}

async function updateAppsScript(payment) {
  const appsScriptUrl = requireEnv('APPS_SCRIPT_URL');
  const webhookSecret = requireEnv('APPS_SCRIPT_SHARED_SECRET');

  const payload = {
    action: 'update_payment',
    webhook_secret: webhookSecret,
    external_reference: String(payment.external_reference || ''),
    payment_id: String(payment.id || ''),
    status: String(payment.status || ''),
    status_detail: String(payment.status_detail || ''),
    transaction_amount: String(payment.transaction_amount || ''),
    currency_id: String(payment.currency_id || ''),
    approved_at: String(payment.date_approved || '')
  };

  const response = await fetch(appsScriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const parsed = parseJsonSafely(text);

  if (!response.ok) {
    throw new Error(`apps_script_error_${response.status}: ${text}`);
  }

  if (!parsed.ok) {
    throw new Error(`apps_script_rejected_update: ${text}`);
  }

  return parsed;
}

function extractPaymentId(payload, requestUrl) {
  if (payload && payload.type && String(payload.type) !== 'payment') {
    return '';
  }

  if (payload && payload.data && payload.data.id) {
    return String(payload.data.id);
  }

  if (payload && payload.id) {
    return String(payload.id);
  }

  return requestUrl.searchParams.get('data.id') || requestUrl.searchParams.get('id') || '';
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`missing_env_${key.toLowerCase()}`);
  }
  return value;
}

function parseJsonSafely(value) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('payload_too_large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify(payload));
}