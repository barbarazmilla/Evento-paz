/**
 * Evento Paz - Apps Script activo
 *
 * Esta copia representa el Apps Script del flujo nuevo basado en:
 * create_lead -> preferencia dinamica -> webhook directo en Apps Script -> Google Sheets.
 */

var SHEET_HEADERS = [
  'created_at',
  'updated_at',
  'lead_id',
  'external_reference',
  'payment_status',
  'payment_status_detail',
  'payment_id',
  'nombre',
  'email',
  'telefono',
  'tipo_entrada',
  'monto_esperado',
  'transaction_amount',
  'currency_id',
  'source',
  'fecha_confirmacion'
];

function doGet() {
  return jsonOutput({ ok: true, service: 'lead-capture', version: 1 });
}

function doPost(e) {
  var payload = getPayload_(e);

  if (isMercadoPagoWebhook_(payload)) {
    return jsonOutput(handleMercadoPagoWebhook_(payload));
  }

  try {
    var action = normalizeAction_(payload.action || 'create_lead');

    if (action === 'create_lead') {
      return jsonOutput(createLead_(payload));
    }

    if (action === 'update_payment') {
      return jsonOutput(updatePayment_(payload));
    }

    throw new Error('unsupported_action');
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message });
  }
}

function createLead_(payload) {
  rejectSpam_(payload);

  var nombre = sanitizeText_(payload.nombre, 120);
  var email = sanitizeEmail_(payload.email);
  var telefono = sanitizeText_(payload.telefono, 40);
  var tipoEntrada = sanitizeText_(payload.tipo_entrada || payload.ticket_type, 80);
  var source = sanitizeText_(payload.source || 'landing_publica', 80);

  if (!nombre) {
    throw new Error('nombre_required');
  }

  if (!email) {
    throw new Error('email_required');
  }

  if (!tipoEntrada) {
    throw new Error('tipo_entrada_required');
  }

  enforceDuplicateWindow_(email, tipoEntrada);

  var leadId = buildId_('lead');
  var externalReference = buildId_('ext');
  var expectedAmount = resolveExpectedAmount_(tipoEntrada);
  var now = new Date().toISOString();

  var row = {
    created_at: now,
    updated_at: now,
    lead_id: leadId,
    external_reference: externalReference,
    payment_status: 'pending',
    payment_status_detail: '',
    payment_id: '',
    nombre: nombre,
    email: email,
    telefono: telefono,
    tipo_entrada: tipoEntrada,
    monto_esperado: expectedAmount,
    transaction_amount: '',
    currency_id: '',
    source: source,
    fecha_confirmacion: ''
  };

  appendRow_(row);

  var preference = createMercadoPagoPreference_(row);

  return {
    ok: true,
    lead_id: leadId,
    external_reference: externalReference,
    preference_id: preference.preference_id,
    init_point: preference.init_point
  };
}

function updatePayment_(payload) {
  assertWebhookSecret_(payload.webhook_secret);

  var updateResult = finalizePaymentUpdate_(payload);

  return {
    ok: true,
    updated: updateResult.updated,
    already_applied: updateResult.already_applied
  };
}

function handleMercadoPagoWebhook_(payload) {
  assertWebhookSecret_(payload.webhook_secret);

  var topic = normalizeAction_(payload.type || payload.topic || 'payment');
  if (topic && topic !== 'payment') {
    return {
      ok: true,
      ignored: 'unsupported_topic',
      topic: topic
    };
  }

  var paymentId = extractPaymentId_(payload);
  if (!paymentId) {
    return {
      ok: true,
      ignored: 'missing_payment_id'
    };
  }

  var payment = fetchMercadoPagoPayment_(paymentId);
  if (!payment || !payment.id) {
    return {
      ok: true,
      ignored: 'payment_not_found',
      payment_id: String(paymentId)
    };
  }

  if (!payment.external_reference) {
    return {
      ok: true,
      ignored: 'missing_external_reference',
      payment_id: String(payment.id)
    };
  }

  var updateResult = finalizePaymentUpdate_({
    external_reference: String(payment.external_reference || ''),
    status: String(payment.status || ''),
    status_detail: String(payment.status_detail || ''),
    payment_id: String(payment.id || ''),
    transaction_amount: String(payment.transaction_amount || ''),
    currency_id: String(payment.currency_id || ''),
    approved_at: String(payment.date_approved || ''),
    webhook_secret: payload.webhook_secret
  });

  return {
    ok: true,
    payment_id: String(payment.id),
    external_reference: String(payment.external_reference),
    status: String(payment.status || ''),
    updated: updateResult.updated,
    already_applied: updateResult.already_applied
  };
}

function finalizePaymentUpdate_(payload) {

  var externalReference = sanitizeText_(payload.external_reference, 120);
  var paymentStatus = sanitizeText_(payload.status, 40);
  var paymentStatusDetail = sanitizeText_(payload.status_detail, 120);
  var paymentId = sanitizeText_(payload.payment_id, 80);
  var transactionAmount = sanitizeNumberString_(payload.transaction_amount);
  var currencyId = sanitizeText_(payload.currency_id, 10);
  var approvedAt = sanitizeText_(payload.approved_at, 40);

  if (!externalReference) {
    throw new Error('external_reference_required');
  }

  if (!paymentStatus) {
    throw new Error('status_required');
  }

  return updateRowByExternalReference_({
    external_reference: externalReference,
    payment_status: paymentStatus,
    payment_status_detail: paymentStatusDetail,
    payment_id: paymentId,
    transaction_amount: transactionAmount,
    currency_id: currencyId,
    fecha_confirmacion: approvedAt,
    updated_at: new Date().toISOString()
  });

}

function rejectSpam_(payload) {
  var honeypot = sanitizeText_(payload.website || payload.company, 120);
  if (honeypot) {
    throw new Error('spam_detected');
  }
}

function enforceDuplicateWindow_(email, tipoEntrada) {
  var cache = CacheService.getScriptCache();
  var dedupeKey = Utilities.base64EncodeWebSafe(email + '|' + tipoEntrada).slice(0, 100);
  if (cache.get(dedupeKey)) {
    throw new Error('duplicate_submission');
  }
  cache.put(dedupeKey, '1', 120);
}

function appendRow_(rowObject) {
  withSheetLock_(function() {
    var sheet = getSheet_();
    ensureHeaders_(sheet);
    sheet.appendRow(mapRowToHeaders_(rowObject));
  });
}

function updateRowByExternalReference_(changes) {
  return withSheetLock_(function() {
    var sheet = getSheet_();
    ensureHeaders_(sheet);
    var values = sheet.getDataRange().getValues();

    if (values.length < 2) {
      throw new Error('lead_not_found');
    }

    var headers = values[0];
    var externalReferenceIndex = headers.indexOf('external_reference');

    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      if (String(values[rowIndex][externalReferenceIndex]) === changes.external_reference) {
        var nextRow = values[rowIndex].slice();
        var hasChanges = false;

        SHEET_HEADERS.forEach(function(header, headerIndex) {
          if (Object.prototype.hasOwnProperty.call(changes, header)) {
            var nextValue = String(changes[header] || '');
            if (String(nextRow[headerIndex] || '') !== nextValue) {
              nextRow[headerIndex] = nextValue;
              hasChanges = true;
            }
          }
        });

        if (!hasChanges) {
          return {
            updated: false,
            already_applied: true
          };
        }

        sheet.getRange(rowIndex + 1, 1, 1, SHEET_HEADERS.length).setValues([nextRow]);
        return {
          updated: true,
          already_applied: false
        };
      }
    }

    throw new Error('lead_not_found');
  });
}

function withSheetLock_(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    return;
  }

  var firstRow = sheet.getRange(1, 1, 1, SHEET_HEADERS.length).getValues()[0];
  var sameHeaders = SHEET_HEADERS.every(function(header, index) {
    return String(firstRow[index] || '') === header;
  });

  if (!sameHeaders) {
    throw new Error('sheet_headers_mismatch');
  }
}

function getSheet_() {
  var spreadsheetId = getRequiredProperty_('SPREADSHEET_ID');
  var sheetName = PropertiesService.getScriptProperties().getProperty('LEADS_SHEET_NAME') || 'Leads';
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName(sheetName);
  return sheet || spreadsheet.insertSheet(sheetName);
}

function mapRowToHeaders_(rowObject) {
  return SHEET_HEADERS.map(function(header) {
    return rowObject[header] || '';
  });
}

function createMercadoPagoPreference_(row) {
  var ticketDetails = resolveTicketDetails_(row.tipo_entrada);
  var body = {
    items: [{
      id: row.lead_id,
      title: ticketDetails.title,
      description: ticketDetails.description,
      quantity: 1,
      currency_id: 'ARS',
      unit_price: ticketDetails.unit_price
    }],
    payer: {
      name: row.nombre,
      email: row.email
    },
    external_reference: row.external_reference,
    notification_url: buildMercadoPagoNotificationUrl_(),
    metadata: {
      lead_id: row.lead_id,
      source: row.source,
      tipo_entrada: row.tipo_entrada
    }
  };
  var returnUrl = PropertiesService.getScriptProperties().getProperty('MP_RETURN_URL');

  if (row.telefono) {
    body.payer.phone = {
      number: row.telefono
    };
  }

  if (returnUrl) {
    body.back_urls = {
      success: returnUrl,
      pending: returnUrl,
      failure: returnUrl
    };
    body.auto_return = 'approved';
  }

  return postMercadoPagoPreference_(body);
}

function postMercadoPagoPreference_(body) {
  var accessToken = getRequiredProperty_('MP_ACCESS_TOKEN');
  var response = UrlFetchApp.fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  var statusCode = response.getResponseCode();
  var responseText = response.getContentText();
  var parsed = parseJson_(responseText);

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('mercadopago_preference_error_' + statusCode + ': ' + responseText);
  }

  if (!parsed.id || !parsed.init_point) {
    throw new Error('mercadopago_preference_invalid_response');
  }

  return {
    preference_id: String(parsed.id),
    init_point: String(parsed.init_point)
  };
}

function resolveTicketDetails_(tipoEntrada) {
  var normalized = String(tipoEntrada || '').toLowerCase();

  if (normalized.indexOf('vip') !== -1) {
    return {
      title: 'Entrada VIP - Wine Experience by Paz Cornu',
      description: 'Acceso VIP para Wine Experience by Paz Cornu',
      unit_price: 100000
    };
  }

  if (normalized.indexOf('general') !== -1) {
    return {
      title: 'Entrada General - Wine Experience by Paz Cornu',
      description: 'Acceso general para Wine Experience by Paz Cornu',
      unit_price: 70000
    };
  }

  throw new Error('unsupported_ticket_type');
}

function resolveExpectedAmount_(tipoEntrada) {
  return String(resolveTicketDetails_(tipoEntrada).unit_price);
}

function getPayload_(e) {
  var payload = {};

  if (!e) {
    return payload;
  }

  if (e.parameter) {
    Object.keys(e.parameter).forEach(function(key) {
      payload[key] = e.parameter[key];
    });
  }

  if (e.postData && e.postData.contents) {
    var contentType = String(e.postData.type || '').toLowerCase();
    if (contentType.indexOf('application/json') !== -1) {
      var parsed = parseJson_(e.postData.contents);
      Object.keys(parsed).forEach(function(key) {
        payload[key] = parsed[key];
      });
    }
  }

  return payload;
}

function isMercadoPagoWebhook_(payload) {
  if (!payload) {
    return false;
  }

  var action = normalizeAction_(payload.action || '');
  if (action === 'create_lead' || action === 'update_payment') {
    return false;
  }

  if (payload.data && payload.data.id) {
    return true;
  }

  if (payload['data.id']) {
    return true;
  }

  if (action.indexOf('payment.') === 0) {
    return true;
  }

  return normalizeAction_(payload.type || payload.topic || '') === 'payment';
}

function extractPaymentId_(payload) {
  if (payload.data && payload.data.id) {
    return sanitizeText_(payload.data.id, 80);
  }

  if (payload['data.id']) {
    return sanitizeText_(payload['data.id'], 80);
  }

  if (!payload.type && !payload.topic && !payload.action && payload.id) {
    return sanitizeText_(payload.id, 80);
  }

  return '';
}

function fetchMercadoPagoPayment_(paymentId) {
  var accessToken = getRequiredProperty_('MP_ACCESS_TOKEN');
  var response = UrlFetchApp.fetch('https://api.mercadopago.com/v1/payments/' + encodeURIComponent(paymentId), {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    muteHttpExceptions: true
  });
  var statusCode = response.getResponseCode();
  var responseText = response.getContentText();
  var parsed = parseJson_(responseText);

  if (statusCode === 404) {
    return null;
  }

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('mercadopago_payment_error_' + statusCode + ': ' + responseText);
  }

  if (!parsed.id) {
    throw new Error('mercadopago_payment_invalid_response');
  }

  return parsed;
}

function buildMercadoPagoNotificationUrl_() {
  return appendQueryParams_(getRequiredProperty_('MP_NOTIFICATION_URL'), {
    source_news: 'webhooks',
    webhook_secret: getRequiredProperty_('WEBHOOK_SHARED_SECRET')
  });
}

function appendQueryParams_(url, params) {
  var entries = [];

  Object.keys(params).forEach(function(key) {
    var value = params[key];
    if (value !== null && value !== undefined && String(value) !== '') {
      entries.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
    }
  });

  if (!entries.length) {
    return url;
  }

  return url + (url.indexOf('?') === -1 ? '?' : '&') + entries.join('&');
}

function assertWebhookSecret_(receivedSecret) {
  var expectedSecret = getRequiredProperty_('WEBHOOK_SHARED_SECRET');
  if (!receivedSecret || String(receivedSecret) !== expectedSecret) {
    throw new Error('forbidden');
  }
}

function getRequiredProperty_(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error('missing_property_' + key.toLowerCase());
  }
  return value;
}

function sanitizeText_(value, maxLength) {
  var cleaned = String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, maxLength || 255);
}

function sanitizeEmail_(value) {
  var email = sanitizeText_(value, 160).toLowerCase();
  if (!email) {
    return '';
  }
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('email_invalid');
  }
  return email;
}

function sanitizeNumberString_(value) {
  return String(value || '').replace(/[^0-9.,-]/g, '').slice(0, 30);
}

function normalizeAction_(value) {
  return sanitizeText_(value, 40).toLowerCase();
}

function buildId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 20);
}

function parseJson_(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
}

function jsonOutput(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function authorizeServices() {
  SpreadsheetApp.openById(getRequiredProperty_('SPREADSHEET_ID')).getId();
  UrlFetchApp.getRequest('https://api.mercadopago.com');
  return true;
}
