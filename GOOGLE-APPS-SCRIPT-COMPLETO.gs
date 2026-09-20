const SHEET_NAME = "Invitados";
const DEDICATIONS_SHEET_NAME = "Dedicatorias";
const CLOUDINARY_TAG = "boda-eunice-david";

/* =====================================
   HELPERS
===================================== */

function getSheet() {
  return SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEET_NAME);
}

function getDedicationsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(DEDICATIONS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(DEDICATIONS_SHEET_NAME);
    sheet.appendRow(["fecha", "token", "nombre", "dedicatoria"]);
  }

  return sheet;
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonp(data, callback) {
  const nombre = String(callback || "").replace(/[^a-zA-Z0-9_.$]/g, "");
  if (!nombre) return json(data);
  return ContentService
    .createTextOutput(nombre + "(" + JSON.stringify(data) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function generarToken(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";

  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return token;
}

function getAllRows() {
  return getSheet().getDataRange().getValues();
}

/* =====================================
   GET
===================================== */

function doGet(e) {
  const action = (e.parameter.action || "").toLowerCase();

  switch (action) {
    case "summary":
      return resumen();

    case "list":
      return listarInvitados();

    case "guest":
      return obtenerInvitado(e.parameter.token);

    case "create":
      return crearInvitadoGet(e.parameter);

    case "delete":
      return eliminarInvitadoGet(e.parameter);

    case "confirm":
      return confirmarInvitadoGet(e.parameter);

    case "update":
      return actualizarInvitadoGet(e.parameter);

    case "media_list":
      return listarMultimedia(e.parameter.callback);

    case "media_delete":
      return eliminarMultimedia(e.parameter.resources);

    case "dedication_list":
      return listarDedicatorias();

    case "dedication_add":
      return agregarDedicatoriaGet(e.parameter);

    default:
      return json({
        success: false,
        error: "Acción inválida"
      });
  }
}

/* =====================================
   POST
===================================== */

function doPost(e) {
  try {
    const contenido = e.postData && e.postData.contents ? e.postData.contents : "";
    const tipo = e.postData && e.postData.type ? e.postData.type : "";
    const body = tipo.indexOf("application/json") >= 0
      ? JSON.parse(contenido || "{}")
      : {
          action: e.parameter.action,
          resources: e.parameter.resources
        };

    switch (String(body.action || "").toLowerCase()) {
      case "confirm":
        return confirmarInvitado(body);

      case "media_delete":
        return eliminarMultimedia(body.resources);

      default:
        return json({
          success: false,
          error: "Acción inválida"
        });
    }
  } catch (error) {
    return json({
      success: false,
      error: error.toString()
    });
  }
}

/* =====================================
   DASHBOARD
===================================== */

function resumen() {
  const data = getAllRows();

  let total = 0;
  let confirmados = 0;
  let pendientes = 0;
  let invitadosCeremonia = 0;
  let invitadosFiesta = 0;
  let cupos = 0;
  let confirmadosCantidad = 0;

  for (let i = 1; i < data.length; i++) {
    total++;

    if (String(data[i][3]).toUpperCase() === "SI") invitadosCeremonia++;
    if (String(data[i][4]).toUpperCase() === "SI") invitadosFiesta++;

    cupos += Number(data[i][5]) || 0;
    confirmadosCantidad += Number(data[i][9]) || 0;

    if (data[i][6] || data[i][7] || data[i][8]) {
      confirmados++;
    } else {
      pendientes++;
    }
  }

  return json({
    success: true,
    total,
    confirmados,
    pendientes,
    invitadosCeremonia,
    invitadosFiesta,
    cupos,
    confirmadosCantidad
  });
}

/* =====================================
   LISTAR
===================================== */

function listarInvitados() {
  const data = getAllRows();
  const invitados = [];

  for (let i = 1; i < data.length; i++) {
    invitados.push({
      token: data[i][0],
      nombre: data[i][1],
      telefono: data[i][2],
      invitadoCeremonia: data[i][3],
      invitadoFiesta: data[i][4],
      cantidadPermitida: data[i][5],
      confirmoCivil: data[i][6],
      confirmoCeremonia: data[i][7],
      confirmoFiesta: data[i][8],
      cantidadConfirmada: data[i][9],
      observaciones: data[i][10],
      fechaConfirmacion: data[i][11]
    });
  }

  return json({
    success: true,
    invitados
  });
}

/* =====================================
   BUSCAR INVITADO
===================================== */

function obtenerInvitado(token) {
  const data = getAllRows();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(token)) {
      return json({
        success: true,
        token: data[i][0],
        nombre: data[i][1],
        telefono: data[i][2],
        invitadoCeremonia: data[i][3],
        invitadoFiesta: data[i][4],
        cantidadPermitida: data[i][5],
        confirmoCivil: data[i][6],
        confirmoCeremonia: data[i][7],
        confirmoFiesta: data[i][8],
        cantidadConfirmada: data[i][9],
        observaciones: data[i][10],
        fechaConfirmacion: data[i][11]
      });
    }
  }

  return json({
    success: false,
    error: "Invitado no encontrado"
  });
}

function listarDedicatorias() {
  const sheet = getDedicationsSheet();
  const data = sheet.getDataRange().getValues();
  const dedicatorias = [];

  for (let i = 1; i < data.length; i++) {
    const texto = String(data[i][3] || "").trim();
    if (!texto) continue;

    dedicatorias.push({
      fecha: data[i][0],
      nombre: String(data[i][2] || "Invitado").trim() || "Invitado",
      dedicatoria: texto
    });
  }

  return json({
    success: true,
    dedicatorias
  });
}

function agregarDedicatoriaGet(p) {
  const token = String(p.token || "").trim();
  const texto = String(p.dedicatoria || "").trim().slice(0, 500);

  if (!token || !texto) {
    return json({
      success: false,
      error: "Falta la dedicatoria o el código de invitación."
    });
  }

  const data = getAllRows();
  let nombre = "";

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === token) {
      nombre = String(data[i][1] || "Invitado").trim();
      break;
    }
  }

  if (!nombre) {
    return json({
      success: false,
      error: "No se encontró la invitación."
    });
  }

  getDedicationsSheet().appendRow([new Date(), token, nombre, texto]);

  return json({
    success: true,
    nombre,
    dedicatoria: texto
  });
}

/* =====================================
   CREAR INVITADO
===================================== */

function crearInvitadoGet(p) {
  const sheet = getSheet();
  const token = generarToken();

  sheet.appendRow([
    token,
    p.nombre || "",
    p.telefono || "",
    p.invitadoCeremonia || "NO",
    p.invitadoFiesta || "NO",
    Number(p.cantidadPermitida || 1),
    "",
    "",
    "",
    "",
    p.observaciones || "",
    ""
  ]);

  return json({
    success: true,
    token,
    link: "?t=" + token
  });
}

/* =====================================
   ELIMINAR INVITADO
===================================== */

function eliminarInvitadoGet(p) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.token)) {
      sheet.deleteRow(i + 1);
      return json({ success: true });
    }
  }

  return json({
    success: false,
    error: "Invitado no encontrado"
  });
}

/* =====================================
   ACTUALIZAR INVITADO
===================================== */

function actualizarInvitadoGet(p) {
  const sheet = getSheet();
  const data = getAllRows();

  const token = String(p.token || "").trim();
  const nombre = String(p.nombre || "").trim();
  const telefono = String(p.telefono || "").trim();
  const ceremonia = String(p.invitadoCeremonia || "NO").toUpperCase() === "SI" ? "SI" : "NO";
  const fiesta = String(p.invitadoFiesta || "NO").toUpperCase() === "SI" ? "SI" : "NO";
  const cantidad = Math.max(1, Number(p.cantidadPermitida) || 1);
  const observaciones = String(p.observaciones || "").trim();

  if (!token || !nombre) {
    return json({
      success: false,
      error: "Token y nombre son obligatorios"
    });
  }

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === token) {
      const fila = i + 1;

      sheet.getRange(fila, 2, 1, 5).setValues([[
        nombre,
        telefono,
        ceremonia,
        fiesta,
        cantidad
      ]]);

      sheet.getRange(fila, 11).setValue(observaciones);

      return json({
        success: true,
        invitado: {
          token,
          nombre,
          telefono,
          invitadoCeremonia: ceremonia,
          invitadoFiesta: fiesta,
          cantidadPermitida: cantidad,
          confirmoCivil: data[i][6],
          confirmoCeremonia: data[i][7],
          confirmoFiesta: data[i][8],
          cantidadConfirmada: data[i][9],
          observaciones,
          fechaConfirmacion: data[i][11]
        }
      });
    }
  }

  return json({
    success: false,
    error: "Invitado no encontrado"
  });
}

/* =====================================
   CONFIRMAR RSVP
===================================== */

function confirmarInvitadoGet(p) {
  const sheet = getSheet();
  const data = getAllRows();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.token)) {
      sheet.getRange(i + 1, 7).setValue(p.confirmoCivil || "");
      sheet.getRange(i + 1, 8).setValue(p.confirmoCeremonia || "");
      sheet.getRange(i + 1, 9).setValue(p.confirmoFiesta || "");
      sheet.getRange(i + 1, 10).setValue(Number(p.cantidadConfirmada || 0));
      sheet.getRange(i + 1, 12).setValue(new Date());

      return json({ success: true });
    }
  }

  return json({
    success: false,
    error: "Invitado no encontrado"
  });
}

function confirmarInvitado(body) {
  const sheet = getSheet();
  const data = getAllRows();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.token)) {
      sheet.getRange(i + 1, 7).setValue(body.confirmoCivil || "");
      sheet.getRange(i + 1, 8).setValue(body.confirmoCeremonia || "");
      sheet.getRange(i + 1, 9).setValue(body.confirmoFiesta || "");
      sheet.getRange(i + 1, 10).setValue(Number(body.cantidadConfirmada || 0));
      sheet.getRange(i + 1, 12).setValue(new Date());

      return json({ success: true });
    }
  }

  return json({
    success: false,
    error: "Invitado no encontrado"
  });
}

/* =====================================
   CLOUDINARY: CONFIGURACION

   En Apps Script: Configuracion del proyecto > Propiedades
   del script, crear estas propiedades:
  - CLOUDINARY_CLOUD_NAME = h9ziupx4
   - CLOUDINARY_API_KEY = clave privada de Cloudinary
   - CLOUDINARY_API_SECRET = secreto privado de Cloudinary
===================================== */

function getCloudinaryConfig_() {
  const properties = PropertiesService.getScriptProperties();
  const config = {
    cloud: properties.getProperty("CLOUDINARY_CLOUD_NAME"),
    key: properties.getProperty("CLOUDINARY_API_KEY"),
    secret: properties.getProperty("CLOUDINARY_API_SECRET")
  };

  if (!config.cloud || !config.key || !config.secret) {
    throw new Error("Faltan las propiedades de Cloudinary en Apps Script.");
  }

  return config;
}

function cloudinaryRequest_(path, method, payload, contentType) {
  const config = getCloudinaryConfig_();
  const options = {
    method: method || "get",
    headers: {
      Authorization: "Basic " + Utilities.base64Encode(config.key + ":" + config.secret)
    },
    muteHttpExceptions: true
  };

  if (payload !== undefined && payload !== null) {
    options.payload = payload;
    options.contentType = contentType || "application/json";
  }

  const response = UrlFetchApp.fetch(
    "https://api.cloudinary.com/v1_1/" + config.cloud + path,
    options
  );
  const code = response.getResponseCode();
  const text = response.getContentText() || "{}";
  let data;

  try {
    data = JSON.parse(text);
  } catch (error) {
    data = {};
  }

  if (code < 200 || code >= 300) {
    throw new Error(
      data.error && data.error.message
        ? data.error.message
        : "Cloudinary rechazó la operación."
    );
  }

  return data;
}

/* =====================================
   MULTIMEDIA: LISTAR
===================================== */

function listarMultimedia(callback) {
  const config = getCloudinaryConfig_();
  const resources = [];
  let nextCursor = null;

  do {
    const body = {
      expression: "tags=" + CLOUDINARY_TAG,
      max_results: 500,
      sort_by: [{ created_at: "desc" }]
    };

    if (nextCursor) body.next_cursor = nextCursor;

    const data = cloudinaryRequest_(
      "/resources/search",
      "post",
      JSON.stringify(body),
      "application/json"
    );

    (data.resources || []).forEach(resource => {
      resources.push({
        public_id: resource.public_id,
        resource_type: resource.resource_type,
        format: resource.format,
        created_at: resource.created_at,
        url: resource.secure_url || (
          "https://res.cloudinary.com/" +
          config.cloud + "/" +
          resource.resource_type + "/upload/" +
          resource.public_id + "." +
          resource.format
        )
      });
    });

    nextCursor = data.next_cursor || null;
  } while (nextCursor);

  const respuesta = {
    success: true,
    resources
  };

  return jsonp(respuesta, callback);
}

/* =====================================
   MULTIMEDIA: ELIMINAR EN LOTE
===================================== */

function eliminarMultimedia(rawResources) {
  let resources = rawResources;

  if (typeof resources === "string") {
    resources = JSON.parse(resources);
  }

  if (!Array.isArray(resources) || !resources.length || resources.length > 500) {
    return json({
      success: false,
      error: "Selecciona entre 1 y 500 archivos."
    });
  }

  const grouped = {
    image: [],
    video: []
  };

  resources.forEach(resource => {
    if (!resource || typeof resource.public_id !== "string") return;

    const publicId = resource.public_id.trim();
    if (!publicId || publicId.length > 255) return;

    const type = resource.resource_type === "video" ? "video" : "image";
    grouped[type].push(publicId);
  });

  let deleted = 0;

  Object.keys(grouped).forEach(type => {
    const publicIds = grouped[type];
    if (!publicIds.length) return;

    const form = publicIds
      .map(publicId => "public_ids[]=" + encodeURIComponent(publicId))
      .join("&");

    cloudinaryRequest_(
      "/resources/" + type + "/upload",
      "delete",
      form,
      "application/x-www-form-urlencoded"
    );

    deleted += publicIds.length;
  });

  return json({
    success: true,
    deleted
  });
}
