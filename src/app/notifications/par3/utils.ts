// utils.ts
import { ParsedSolicitud } from './types';

export function parseSolicitud(line: string): ParsedSolicitud {
  const fechaMatch = line.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/);
  const jsonMatch = line.match(/Datos a enviar: (.+)$/);
  let fixer = "Sin asignar";
  let cliente = "Solicitud";
  let descripcion = "";
  
  if (jsonMatch) {
    try {
      const datos = JSON.parse(jsonMatch[1]);
      if (datos.logData) {
        fixer = datos.logData.fixer.fixerNombre || "Sin asignar";
        cliente = datos.logData.client.nombreCliente || "Solicitud";
        descripcion = datos.logData.client.descripcion || "";
      } else {
        fixer = datos.text?.match(/¡Hola ([^,!\n]+)/)?.[1] || "Sin asignar";
        cliente = datos.text?.match(/Cliente: ([^\n]+)/)?.[1] || "Solicitud";
        descripcion = datos.text?.match(/Descripción: "([^"]+)"/)?.[1] || "";
      }
    } catch {}
  }
  
  return {
    fixer,
    cliente,
    descripcion,
    fecha: fechaMatch ? fechaMatch[1] : "",
  };
}

export const API_CONFIG = {
  URL: "https://n8n-evolution-api.oumu0g.easypanel.host/message/sendText/pruebas",
  API_KEY: "429683C4C977415CAAFCCE10F7D57E11",
  AUTH_TOKEN: "Bearer B1719736AF1B-4E77-83D0-DC78E7D578A8"
};