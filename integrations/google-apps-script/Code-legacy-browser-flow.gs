/**
 * Evento Paz - Apps Script legacy
 *
 * Esta copia conserva un segundo Apps Script distinto, basado en:
 * formulario/browser redirect -> webhook directo en Apps Script -> Meta CAPI.
 */

function doPost(e) {
  if (e && e.parameter && e.parameter.action === 'update_status') {
    return actualizarDesdeRedirect(e);
  }

  if (e && e.parameter && e.parameter.nombre) {
    return manejarFormulario(e);
  }

  if (e && e.postData && e.postData.contents) {
    return manejarWebhookMercadoPago(e);
  }

  return ContentService
    .createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function actualizarDesdeRedirect(e) {
  var externalRef = e.parameter.external_reference || '';
  var status = e.parameter.status || '';
  var paymentId = e.parameter.payment_id || '';

  if (externalRef && status) {
    actualizarEstadoPagoEnSheet(externalRef, status, '', paymentId);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, updated: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function manejarFormulario(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var nombre = e.parameter.nombre || '';
  var email = e.parameter.email || '';
  var telefono = e.parameter.telefono || '';
  var tipoEntrada = e.parameter.tipo_entrada || '';
  var fecha = e.parameter.fecha || '';
  var estadoPago = e.parameter.estado_pago || 'Pendiente';

  var leadId = Utilities.getUuid();

  sheet.appendRow([
    nombre,
    email,
    telefono,
    tipoEntrada,
    fecha,
    estadoPago,
    leadId
  ]);

  var preferencia = crearPreferenciaMercadoPago(tipoEntrada, leadId);

  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      lead_id: leadId,
      init_point: preferencia.init_point || '',
      sandbox_init_point: preferencia.sandbox_init_point || '',
      preference_id: preferencia.id || ''
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function manejarWebhookMercadoPago(e) {
  var body = {};

  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput('INVALID_JSON')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  var topic = '';
  var paymentId = '';

  if (body.type) topic = body.type;
  if (body.data && body.data.id) paymentId = String(body.data.id);

  if (!topic && body.topic) topic = body.topic;
  if (!paymentId && body.id && (topic === 'payment' || topic === 'merchant_order')) {
    paymentId = String(body.id);
  }

  if (topic !== 'payment' || !paymentId) {
    return ContentService
      .createTextOutput('IGNORED')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  var pago = obtenerPagoMercadoPago(paymentId);
  var leadId = pago.external_reference || '';
  var status = pago.status || '';
  var statusDetail = pago.status_detail || '';

  if (leadId) {
    actualizarEstadoPagoEnSheet(leadId, status, statusDetail, paymentId);
    maybeEnviarPurchaseAMeta(status, paymentId, leadId, pago);
  }

  return ContentService
    .createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function crearPreferenciaMercadoPago(tipoEntrada, leadId) {
  var accessToken = PropertiesService.getScriptProperties().getProperty('MP_ACCESS_TOKEN');
  if (!accessToken) {
    throw new Error('No existe MP_ACCESS_TOKEN en las propiedades del script');
  }

  var monto = 0;
  var titulo = '';

  if (tipoEntrada && tipoEntrada.toString().indexOf('VIP') !== -1) {
    monto = 100000;
    titulo = 'Entrada VIP - Wine Experience by Paz Cornú';
  } else {
    monto = 70000;
    titulo = 'Entrada General - Wine Experience by Paz Cornú';
  }

  var scriptUrl = ScriptApp.getService().getUrl();

  var payload = {
    items: [
      {
        title: titulo,
        quantity: 1,
        unit_price: monto,
        currency_id: 'ARS'
      }
    ],
    external_reference: leadId,
    notification_url: scriptUrl,
    back_urls: {
      success: 'https://wineexperiencebypazcornu.impulzia.cl/',
      pending: 'https://wineexperiencebypazcornu.impulzia.cl/',
      failure: 'https://wineexperiencebypazcornu.impulzia.cl/'
    },
    auto_return: 'approved'
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch('https://api.mercadopago.com/checkout/preferences', options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('Error Mercado Pago: ' + body);
  }

  return JSON.parse(body);
}

function obtenerPagoMercadoPago(paymentId) {
  var accessToken = PropertiesService.getScriptProperties().getProperty('MP_ACCESS_TOKEN');
  if (!accessToken) {
    throw new Error('No existe MP_ACCESS_TOKEN en las propiedades del script');
  }

  var options = {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch('https://api.mercadopago.com/v1/payments/' + paymentId, options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('Error consultando pago Mercado Pago: ' + body);
  }

  return JSON.parse(body);
}

function actualizarEstadoPagoEnSheet(leadId, status, statusDetail, paymentId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][6] || '') === String(leadId)) {
      sheet.getRange(i + 1, 6).setValue(status || 'unknown');
      sheet.getRange(i + 1, 8).setValue(paymentId || '');
      sheet.getRange(i + 1, 9).setValue(statusDetail || '');
      return true;
    }
  }

  return false;
}

function sha256Hex(value) {
  var raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  );
  return raw.map(function(b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizarTelefonoAR(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function enviarPurchaseAMeta(paymentId, leadId, pago, customerData) {
  var metaAccessToken = PropertiesService.getScriptProperties().getProperty('META_ACCESS_TOKEN');
  if (!metaAccessToken) {
    throw new Error('No existe META_ACCESS_TOKEN en las propiedades del script');
  }

  var testEventCode = PropertiesService.getScriptProperties().getProperty('META_TEST_EVENT_CODE');
  var pixelId = '2394484354369972';
  var value = 0;

  if (pago && pago.transaction_amount) {
    value = Number(pago.transaction_amount);
  }

  var email = normalizarEmail(customerData && customerData.email);
  var phone = normalizarTelefonoAR(customerData && customerData.phone);

  var userData = {
    external_id: sha256Hex(String(leadId || paymentId || Utilities.getUuid()))
  };

  if (email) {
    userData.em = sha256Hex(email);
  }

  if (phone) {
    userData.ph = sha256Hex(phone);
  }

  var payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(new Date().getTime() / 1000),
        action_source: 'website',
        event_source_url: 'https://wineexperiencebypazcornu.impulzia.cl/',
        event_id: String(paymentId || leadId || Utilities.getUuid()),
        user_data: userData,
        custom_data: {
          currency: 'ARS',
          value: value
        }
      }
    ]
  };

  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var url = 'https://graph.facebook.com/v23.0/' + pixelId + '/events?access_token=' + encodeURIComponent(metaAccessToken);
  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('Error enviando Purchase a Meta: ' + body);
  }

  return JSON.parse(body);
}

function maybeEnviarPurchaseAMeta(status, paymentId, leadId, pago) {
  if (String(status).toLowerCase() === 'approved') {
    return enviarPurchaseAMeta(paymentId, leadId, pago, {
      email: '',
      phone: ''
    });
  }
  return null;
}

function probarPreferenciaVIP() {
  var respuesta = crearPreferenciaMercadoPago('Entrada VIP — $100.000', 'test-vip-001');
  Logger.log(JSON.stringify(respuesta));
}

function probarPurchaseMeta() {
  var pagoFalso = {
    transaction_amount: 70000
  };

  var respuesta = enviarPurchaseAMeta(
    'test-payment-001',
    'test-lead-001',
    pagoFalso,
    {
      email: 'test@ejemplo.com',
      phone: '5491123456789'
    }
  );

  Logger.log(JSON.stringify(respuesta));
}