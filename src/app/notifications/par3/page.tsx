"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { FaUserCog, FaPencilAlt, FaCheck, FaHistory, FaArrowLeft } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { Fixer, ClientData, initialFixerState, initialClientState } from './types';
import { API_CONFIG } from './utils';
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
  const router = useRouter();
  const [fixer, setFixer] = useState<Fixer>(initialFixerState);
  const [editando, setEditando] = useState<keyof Fixer | null>(null);
  const [clientData, setClientData] = useState<ClientData>(initialClientState);
  const [localLogs, setLocalLogs] = useState<LocalLog[]>([]);
  const [logMessage, setLogMessage] = useState<string>("");

  // Cargar logs locales desde localStorage al iniciar
  useEffect(() => {
    const savedLogs = localStorage.getItem('servineo-par3-local-logs');
    if (savedLogs) {
      setLocalLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Guardar logs en localStorage cuando cambien
  useEffect(() => {
    if (localLogs.length > 0) {
      localStorage.setItem('servineo-par3-local-logs', JSON.stringify(localLogs));
    }
  }, [localLogs]);

  const handleClientChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setClientData((prev) => ({ ...prev, [id]: value }));
  };

  const habilitarEdicion = (id: keyof Fixer) => setEditando(id);

  const guardarCambio = (id: keyof Fixer) => {
    setEditando(null);
    // Cambiado a alert nativo
    alert(`Campo actualizado: ${fixer[id]}`);
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

    setLocalLogs(prev => [nuevoLog, ...prev].slice(0, 10));
  };

  const enviarNotificacion = async () => {
    const { fixerNombre, fixerProfesion, fixerTelefono } = fixer;
    const { nombreCliente, descripcion, telefonoCliente } = clientData;
    
    const URL_RESPUESTA = "https://tuapp.com/responder-solicitud";

    // Validaciones - cambiadas a alert nativo
    if (!fixerTelefono || fixerTelefono.trim() === "") {
      alert("❌ Error: El campo 'Número Destino' del Fixer es obligatorio");
      return;
    }

    if (!telefonoCliente || telefonoCliente.trim() === "") {
      alert("❌ Error: El teléfono del cliente es obligatorio");
      return;
    }

    if (!descripcion || descripcion.trim() === "") {
      alert("❌ Error: La descripción del servicio es obligatoria");
      return;
    }

    // Agregar log local inmediatamente
    agregarLogLocal("Enviando", `Solicitud: ${descripcion.substring(0, 30)}...`);

    const texto = `¡Hola ${fixerNombre}, el ${fixerProfesion}!
Nueva solicitud de servicio.
Cliente: ${nombreCliente || "Cliente sin nombre"}
Teléfono del Cliente: ${telefonoCliente} 
Descripción: "${descripcion}"
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
        // Cambiado a alert nativo
        alert("✅ Notificación enviada correctamente al Fixer: " + fixerTelefono);
        
        // Actualizar log local a exitoso
        setLocalLogs(prev => 
          prev.map((log, index) => 
            index === 0 
              ? { ...log, status: "Completado", title: descripcion }
              : log
          )
        );
        
        // Limpiar formulario
        setClientData(initialClientState);
        
      } else {
        const errorText = await respuesta.text();
        console.error("Error response:", errorText);
        
        setLocalLogs(prev => 
          prev.map((log, index) => 
            index === 0 
              ? { ...log, status: "Fallido" }
              : log
          )
        );
        
        // Cambiado a alert nativo
        alert(`❌ Error: El número del Fixer no existe`);
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      
      setLocalLogs(prev => 
        prev.map((log, index) => 
          index === 0 
            ? { ...log, status: "Error Conexión" }
            : log
        )
      );
      
      // Cambiado a alert nativo
      alert("⚠️ Error de conexión con el servicio");
    }
  };

  // Función para limpiar logs locales
  const limpiarLogsLocales = () => {
    setLocalLogs([]);
    localStorage.removeItem('servineo-par3-local-logs');
    // Cambiado a alert nativo
    alert("🗑️ Historial local limpiado");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 font-roboto">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
      `}</style>
      
      <div className="max-w-6xl w-full mx-auto p-6 bg-white rounded-2xl shadow-lg border border-[#D1D5DB]">
        {/* Botón ATRAS */}
        <button
          onClick={() => router.push('/servineo')}
          className="flex items-center gap-2 px-4 py-2 bg-[#2B31E0] text-white rounded-lg hover:bg-[#2B6AE0] transition duration-300 font-medium mb-6"
        >
          <FaArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMNA IZQUIERDA: HISTORIAL */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#111827] text-xl font-bold flex items-center gap-2">
                <FaHistory className="text-[#2B31E0]" /> Historial
              </h2>
              {localLogs.length > 0 && (
                <button
                  onClick={limpiarLogsLocales}
                  className="text-xs bg-[#EF4444] text-white px-3 py-1 rounded-lg hover:bg-[#DC2626] transition font-medium"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Mensaje temporal - eliminado ya que usaremos alerts */}
            {logMessage && (
              <div className={`mb-4 p-2 rounded-lg text-sm font-medium text-center ${
                logMessage.includes("✅") 
                  ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30"
                  : "bg-[#FFC857]/10 text-[#FFC857] border border-[#FFC857]/30"
              }`}>
                {logMessage}
              </div>
            )}

            <div className="max-h-[500px] overflow-y-auto pr-2">
              {localLogs.length === 0 ? (
                <div className="text-center text-[#64748B] py-8">
                  <FaHistory className="mx-auto text-4xl mb-2 opacity-50" />
                  <p>No hay historial de servicios</p>
                  <p className="text-sm mt-1">Los servicios aparecerán aquí después de enviarlos</p>
                </div>
              ) : (
                localLogs.map((item) => (
                  <HistoryItem
                    key={item.id}
                    status={item.status}
                    title={item.title}
                    fixer={item.fixer}
                    date={item.date}
                  />
                ))
              )}
            </div>
            
            <div className="mt-2 text-xs text-[#64748B] text-center">
              {localLogs.length > 0 && `Mostrando ${localLogs.length} servicios locales`}
            </div>
          </div>

          {/* COLUMNA DERECHA: FORMULARIO */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB]">
            <h2 className="text-center text-white bg-[#2B31E0] py-4 rounded-lg text-xl font-bold mb-6">
              Solicitar Servicio
            </h2>

            <h3 className="text-[#2B31E0] font-bold text-lg mb-4 border-b border-[#E5E7EB] pb-2">
              Datos del Cliente
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
                <label className="block text-[#111827] text-sm font-medium mb-2">
                  Descripción del servicio <span className="text-[#EF4444]">*</span>
                </label>
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
                        ? "Número Destino *"
                        : key.replace("fixer", "").replace(/([A-Z])/g, " $1")}
                      {key === "fixerTelefono" && <span className="text-[#EF4444]"> *</span>}
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
              Solicitar
            </button>

            {/* Eliminado el componente de notificación estilizado */}
          </div>
        </div>
      </div>
    </div>
  );
}
