"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { FaUserCog, FaPencilAlt, FaCheck, FaHistory, FaArrowLeft } from "react-icons/fa";
import { Fixer, ClientData, initialFixerState, initialClientState, HistoryItemProps } from './types';
import { parseSolicitud, API_CONFIG } from './utils';
import HistoryItem from './components/HistoryItem';

// Interface para los logs locales
interface LocalLog {
  id: string;
  status: string;
  title: string;
  fixer: string;
  date: string;
  timestamp: number;
}

export default function Par3Page() {
  const [fixer, setFixer] = useState<Fixer>(initialFixerState);
  const [editando, setEditando] = useState<keyof Fixer | null>(null);
  const [resultado, setResultado] = useState<string>("");
  const [logHistory, setLogHistory] = useState<string[]>([]);
  const [isLoadingLog, setIsLoadingLog] = useState<boolean>(false);
  const [logError, setLogError] = useState<string>("");
  const [clientData, setClientData] = useState<ClientData>(initialClientState);
  const [localLogs, setLocalLogs] = useState<LocalLog[]>([]);

  // LÓGICA PARA RECUPERAR EL LOG DEL BACKEND SEPARADO
  const fetchLogHistory = async () => {
    setIsLoadingLog(true);
    setLogError("");
    try {
      const response = await fetch("http://localhost:3001/api/par3/historial");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.parsedLog)) {
          setLogHistory(data.parsedLog);
        } else if (Array.isArray(data)) {
          setLogHistory(data);
        } else if (Array.isArray(data.log)) {
          setLogHistory(data.log);
        } else {
          setLogHistory([]);
        }
      } else {
        setLogError("No se pudo cargar el historial. Backend no disponible.");
        setLogHistory([]);
      }
    } catch (error) {
      setLogError("Error de conexión con el backend.");
      setLogHistory([]);
    } finally {
      setIsLoadingLog(false);
    }
  };

  useEffect(() => {
    fetchLogHistory();
    
    // Cargar logs locales desde localStorage al iniciar
    const savedLogs = localStorage.getItem('servineo-local-logs');
    if (savedLogs) {
      setLocalLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Guardar logs en localStorage cuando cambien
  useEffect(() => {
    if (localLogs.length > 0) {
      localStorage.setItem('servineo-local-logs', JSON.stringify(localLogs));
    }
  }, [localLogs]);

  const handleClientChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setClientData((prev) => ({ ...prev, [id]: value }));
  };

  const habilitarEdicion = (id: keyof Fixer) => setEditando(id);

  const guardarCambio = (id: keyof Fixer) => {
    setEditando(null);
    setResultado(`Campo actualizado: ${fixer[id]}`);
    setTimeout(() => setResultado(""), 2000);
  };

  const handleFixerChange = (id: keyof Fixer, value: string) => {
    setFixer({ ...fixer, [id]: value });
  };

  // Función para agregar un nuevo log local
  const agregarLogLocal = (status: string, titulo: string) => {
    const nuevoLog: LocalLog = {
      id: Date.now().toString(),
      status,
      title: titulo,
      fixer: fixer.fixerNombre,
      date: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: Date.now()
    };

    setLocalLogs(prev => [nuevoLog, ...prev].slice(0, 10)); // Mantener solo los últimos 10 logs
  };

  const enviarNotificacion = async () => {
    const { fixerNombre, fixerProfesion, fixerTelefono } = fixer;
    const { nombreCliente, descripcion, telefonoCliente } = clientData;
    
    const URL_RESPUESTA = "https://tuapp.com/responder-solicitud";

    if (!fixerTelefono || fixerTelefono.trim() === "") {
      setResultado("❌ Error: El campo 'Número Destino' del Fixer es obligatorio y no puede estar vacío.");
      setTimeout(() => setResultado(""), 4000);
      return;
    }

    // Agregar log local inmediatamente (estado "Enviado")
    agregarLogLocal("Enviado", `Solicitud enviada a ${fixerNombre}`);

    const texto = `¡Hola ${fixerNombre}, el ${fixerProfesion}!
Nueva solicitud de servicio.
Cliente: ${nombreCliente || "Cliente sin nombre"}
Teléfono del Cliente: ${telefonoCliente || "N/A"} 
Descripción: "${descripcion || "Servicio no especificado"}"
Enlace para responder: ${URL_RESPUESTA}
Por favor, revisa y responde lo antes posible.`;

    const cuerpo = {
      number: fixerTelefono,
      text: texto,
      logData: {
        fixer: fixer,
        client: clientData,
      },
    };

    try {
      const respuesta = await fetch(API_CONFIG.URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": API_CONFIG.API_KEY,
          "Authorization": API_CONFIG.AUTH_TOKEN
        },
        body: JSON.stringify(cuerpo),
      });

      if (respuesta.ok) {
        setResultado("✅ Notificación enviada correctamente al Fixer: " + fixerTelefono);
        
        // Actualizar el log local a "Completado"
        setLocalLogs(prev => 
          prev.map(log => 
            log.id === prev[0].id 
              ? { ...log, status: "Completado", title: descripcion || "Servicio completado" }
              : log
          )
        );
        
        fetchLogHistory();
      } else {
        const status = respuesta.status;
        let errorMessage = `Error ${status}. Fallo al comunicarse con la API.`;
        try {
          const errorDetails = await respuesta.json();
          if (errorDetails.message) {
            errorMessage = errorDetails.message;
          }
        } catch (e) {
          errorMessage = `Error ${status}. Respuesta de API ilegible.`;
        }
        
        // Actualizar el log local a "Fallido"
        setLocalLogs(prev => 
          prev.map(log => 
            log.id === prev[0].id 
              ? { ...log, status: "Fallido", title: "Error en envío de solicitud" }
              : log
          )
        );
        
        setResultado(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error en la petición a la API:", error);
      
      // Actualizar el log local a "Fallido"
      setLocalLogs(prev => 
        prev.map(log => 
          log.id === prev[0].id 
            ? { ...log, status: "Fallido", title: "Error de conexión" }
            : log
        )
      );
      
      setResultado("⚠️ Error de conexión con la API de WhatsApp.");
    } finally {
      setTimeout(() => setResultado(""), 4000);
    }
  };

  const goBackPlaceholder = () => {
    window.location.href = '/servineo';
  };

  // Función para limpiar logs locales
  const limpiarLogsLocales = () => {
    setLocalLogs([]);
    localStorage.removeItem('servineo-local-logs');
  };

  // Combinar logs del backend con logs locales
  const logsCombinados = [
    ...localLogs.map(log => ({
      status: log.status,
      title: log.title,
      fixer: log.fixer,
      date: log.date
    })),
  ].slice(0, 10); // Mostrar máximo 10 logs

  // Procesar historial visual del backend (código existente)
  let visualLogHistory: HistoryItemProps[] = [];
  if (logHistory.length > 0 && typeof logHistory[0] === "string") {
    for (let i = 0; i < logHistory.length - 1; i++) {
      const solicitudLine = logHistory[i];
      const respuestaLine = logHistory[i + 1];
      if (
        solicitudLine.includes("Solicitud recibida") &&
        respuestaLine.includes("Respuesta de API externa: Status 201")
      ) {
        const datos = parseSolicitud(solicitudLine);
        visualLogHistory.push({
          status: "Completado",
          title: datos.descripcion || "Servicio",
          fixer: datos.fixer,
          date: datos.fecha,
        });
      }
    }
    visualLogHistory = visualLogHistory.slice(-5);
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 font-roboto">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
      `}</style>
      
      <div className="max-w-6xl w-full mx-auto p-6 bg-white rounded-2xl shadow-lg border border-[#D1D5DB]">
        <button
          onClick={goBackPlaceholder}
          className="flex items-center gap-2 px-4 py-2 bg-[#2B31E0] text-white rounded-lg hover:bg-[#2B6AE0] transition duration-300 font-medium mb-6"
          title="Atrás"
        >
          <FaArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMNA IZQUIERDA: HISTORIAL */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-center text-[#111827] py-3 rounded-lg text-xl font-bold flex items-center justify-center gap-2">
                <FaHistory className="text-[#2B31E0]" /> Historial de Servicios
              </h2>
              {localLogs.length > 0 && (
                <button
                  onClick={limpiarLogsLocales}
                  className="text-xs bg-[#EF4444] text-white px-2 py-1 rounded hover:bg-[#DC2626] transition"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="max-h-[500px] overflow-y-auto pr-2">
              {isLoadingLog && <p className="text-center text-[#64748B]">Cargando historial...</p>}
              {logError && (
                <div className="text-center text-[#EF4444] mb-4 text-sm">{logError}</div>
              )}
              
              {/* Mostrar logs combinados */}
              {logsCombinados.length === 0 && !isLoadingLog && (
                <p className="text-center text-[#64748B] mb-4 text-sm">No hay historial de servicios.</p>
              )}
              
              {logsCombinados.map((item, index) => (
                <HistoryItem
                  key={index}
                  status={item.status}
                  title={item.title}
                  fixer={item.fixer}
                  date={item.date}
                />
              ))}
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={fetchLogHistory}
                disabled={isLoadingLog}
                className="flex-1 py-2 text-sm rounded-lg bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB] transition disabled:opacity-50 font-medium border border-[#D1D5DB]"
              >
                {isLoadingLog ? "Refrescando..." : "Recargar Historial"}
              </button>
            </div>
            
            <div className="mt-2 text-xs text-[#64748B] text-center">
              {localLogs.length > 0 && `(${localLogs.length} logs locales)`}
            </div>
          </div>

          {/* ... (el resto del código del formulario se mantiene igual) */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB]">
            <h2 className="text-center text-white bg-[#2B31E0] py-4 rounded-lg text-xl font-bold mb-6">
              Solicitar Servicio PAR3
            </h2>

            <h3 className="text-[#2B31E0] font-bold text-lg mb-4 border-b border-[#E5E7EB] pb-2">
              Datos del Requester
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[#111827] text-sm font-medium mb-2">
                  Número de teléfono <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  id="telefonoCliente"
                  value={clientData.telefonoCliente}
                  onChange={handleClientChange}
                  placeholder="Solo números. Ej: 59133344455"
                  className="w-full p-3 border border-[#D1D5DB] rounded-lg focus:border-[#2B31E0] focus:ring-2 focus:ring-[#2B31E0]/20 text-[#111827] transition"
                />
              </div>

              <div>
                <label className="block text-[#111827] text-sm font-medium mb-2">Nombre del Cliente</label>
                <input
                  type="text"
                  id="nombreCliente"
                  value={clientData.nombreCliente}
                  onChange={handleClientChange}
                  placeholder="Ej: Juan Pérez"
                  className="w-full p-3 border border-[#D1D5DB] rounded-lg focus:border-[#2B31E0] focus:ring-2 focus:ring-[#2B31E0]/20 text-[#111827] transition"
                />
              </div>

              <div>
                <label className="block text-[#111827] text-sm font-medium mb-2">Descripción del servicio</label>
                <input
                  type="text"
                  id="descripcion"
                  value={clientData.descripcion}
                  onChange={handleClientChange}
                  placeholder="Ej: Reparación urgente de equipo TV"
                  className="w-full p-3 border border-[#D1D5DB] rounded-lg focus:border-[#2B31E0] focus:ring-2 focus:ring-[#2B31E0]/20 text-[#111827] transition"
                />
              </div>
            </div>

            <div className="mt-6 p-5 bg-[#759AE0]/10 rounded-xl border border-[#759AE0]/30">
              <h3 className="text-center text-[#2B31E0] font-bold text-lg flex items-center justify-center gap-2 mb-4">
                <FaUserCog className="text-[#2B31E0]" /> Datos del Fixer
              </h3>

              <div className="space-y-4">
                {Object.entries(fixer).map(([key, value]) => (
                  <div key={key} className="flex flex-col space-y-2">
                    <label className="text-[#111827] text-sm font-medium capitalize">
                      {key === "fixerTelefono"
                        ? "Número Destino"
                        : key.replace("fixer", "").replace(/([A-Z])/g, " $1")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={value}
                        disabled={editando !== key}
                        onChange={(e) => handleFixerChange(key as keyof Fixer, e.target.value)}
                        className={`w-full p-3 rounded-lg border text-[#111827] transition ${
                          editando === key 
                            ? "border-[#2B31E0] bg-white shadow-sm" 
                            : "border-[#D1D5DB] bg-white"
                        }`}
                        onKeyDown={(e) => e.key === "Enter" && guardarCambio(key as keyof Fixer)}
                      />
                      {editando === key ? (
                        <button
                          onClick={() => guardarCambio(key as keyof Fixer)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#2B31E0] text-white p-2 rounded-lg text-sm hover:bg-[#2B6AE0] transition"
                        >
                          <FaCheck />
                        </button>
                      ) : (
                        <button
                          onClick={() => habilitarEdicion(key as keyof Fixer)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#2B31E0] transition p-2"
                        >
                          <FaPencilAlt />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={enviarNotificacion}
              className="w-full mt-6 py-3 rounded-lg bg-[#2B31E0] text-white font-bold hover:bg-[#2B6AE0] transition duration-300 shadow-sm"
            >
              Confirmar Solicitud
            </button>

            {resultado && (
              <div
                className={`mt-4 text-center font-medium p-3 rounded-lg border transition-all ${
                  resultado.startsWith("✅")
                    ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/30"
                    : resultado.startsWith("❌")
                    ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                    : "bg-[#FFC857]/10 text-[#FFC857] border-[#FFC857]/30"
                }`}
              >
                {resultado}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}