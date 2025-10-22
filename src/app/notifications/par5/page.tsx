'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
//import { API_CONFIG } from './config';


// Interfaces
interface Fixer {
  nombre: string;
  codigoPais: string;
  numero: string;
}

interface Solicitud {
  id: string;
  nombreRequester: string;
  codigoPais: string;
  numero: string;
  servicio: string;
  urlSolicitud: string;
  fecha: string;
  fixer: Fixer; // Fixer asignado a esta solicitud
}

interface LogEntry {
  id: string;
  timestamp: Date;
  tipo: 'envio' | 'error' | 'aceptada' | 'rechazada' | 'edicion' | 'notificacion_administrador' | 'notificacion_fixer';
  solicitudId: string;
  cliente: string;
  servicio: string;
  estado?: 'aceptada' | 'rechazada';
  mensaje: string;
  detalles?: string;
  exito?: boolean;
}

// Constante con información del administrador
const ADMIN_INFO = {
  nombre: 'Administrador ServiNeo',
  codigoPais: '+591',
  numero: '69542509' // Número actualizado del administrador
};

export default function SimulationHU3() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([
    {
      id: '001',
      nombreRequester: 'Juan Pérez',
      codigoPais: '+591',
      numero: '77777777',
      servicio: 'Reparación de plomería',
      urlSolicitud: 'https://servineo.com/solicitud/001',
      fecha: '2025-10-15',
      fixer: {
        nombre: 'Carlos Mendoza',
        codigoPais: '+591',
        numero: '78888888'
      }
    },
    {
      id: '002',
      nombreRequester: 'Maria García',
      codigoPais: '+591',
      numero: '78888888',
      servicio: 'Instalación eléctrica',
      urlSolicitud: 'https://servineo.com/solicitud/002',
      fecha: '2025-10-15',
      fixer: {
        nombre: 'Ana Silva',
        codigoPais: '+591',
        numero: '79999999'
      }
    },
    {
      id: '003',
      nombreRequester: 'Carlos López',
      codigoPais: '+591',
      numero: '79999999',
      servicio: 'Reparación de celular',
      urlSolicitud: 'https://servineo.com/solicitud/003',
      fecha: '2025-10-15',
      fixer: {
        nombre: 'Roberto Paz',
        codigoPais: '+591',
        numero: '76666666'
      }
    },
  ]);

  // Estados principales
  const [modalVisible, setModalVisible] = useState(false);
  const [solicitudActual, setSolicitudActual] = useState<Solicitud | null>(null);
  const [estadoActual, setEstadoActual] = useState<'aceptada' | 'rechazada' | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [alerta, setAlerta] = useState<{ tipo: 'success' | 'error'; mensaje: string } | null>(null);

  // Estados para edición
  const [editandoSolicitud, setEditandoSolicitud] = useState<Solicitud | null>(null);
  const [modalEdicionVisible, setModalEdicionVisible] = useState(false);
  const [formEdicion, setFormEdicion] = useState({
    id: '',
    codigoPais: '+591',
    numero: '',
    urlSolicitud: '',
    fixerCodigoPais: '+591',
    fixerNumero: ''
    // Removido: fixerNombre ya no es editable
  });

  // Estados para logs y reintentos
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [modalLogsVisible, setModalLogsVisible] = useState(false);
  const [reintentoPendiente, setReintentoPendiente] = useState<{solicitud: Solicitud, estado: 'aceptada' | 'rechazada', motivo: string} | null>(null);
  const [reintentosCount, setReintentosCount] = useState<{[key: string]: number}>({});

  // Validaciones
  const validarMotivo = (texto: string): boolean => {
    const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,!?¿¡()\-]*$/;
    return regex.test(texto) && texto.length <= 100; // Cambiado de 500 a 100
  };

  const validarNumero = (numero: string): boolean => {
    const regex = /^\d{1,8}$/;
    return regex.test(numero);
  };

  const validarCodigoPais = (codigo: string): boolean => {
    return ['+591', '+51', '+57', '+58'].includes(codigo);
  };

  const validarFecha = (fecha: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(fecha)) return false;
    
    const date = new Date(fecha);
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Función para agregar logs
  const agregarLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const nuevoLog: LogEntry = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setLogs(prev => [nuevoLog, ...prev].slice(0, 50));
  };

  // Función para mostrar alertas temporales
  const mostrarAlerta = (tipo: 'success' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  // Función para enviar mensaje al administrador después de 3 reintentos
  const enviarMensajeAlAdministrador = async (solicitud: Solicitud, errorCount: number, estado: 'aceptada' | 'rechazada') => {
    const texto = `🚨 ALERTA ADMINISTRADOR: Problema de entrega de mensaje

No se ha podido entregar la notificación al cliente después de ${errorCount} intentos.

📋 Detalles del problema:
• Solicitud: SOL-${solicitud.id}
• Cliente: ${solicitud.nombreRequester}
• Servicio: ${solicitud.servicio}
• Teléfono: ${solicitud.codigoPais}${solicitud.numero}
• Fixer asignado: ${solicitud.fixer.nombre}
• Estado intentado: ${estado === 'aceptada' ? 'Aceptada' : 'Rechazada'}
• Intentos fallidos: ${errorCount}

⚠️ Se requiere intervención manual para notificar al cliente.`;

    const cuerpo = {
      number: ADMIN_INFO.codigoPais + ADMIN_INFO.numero,
      text: texto,
      logData: {
        administrador: ADMIN_INFO.nombre,
        client: solicitud.nombreRequester,
        servicio: solicitud.servicio,
        fixer: solicitud.fixer.nombre,
        intentos: errorCount,
        estado: estado
      },
    };

    try {
      console.log('🔍 Enviando notificación al administrador...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const respuesta = await fetch('https://servineo-backend.onrender.com/api/par5/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }

      const data = await respuesta.json();
      
      if (data.success) {
        agregarLog({
          tipo: 'notificacion_administrador',
          solicitudId: solicitud.id,
          cliente: solicitud.nombreRequester,
          servicio: solicitud.servicio,
          mensaje: `Notificación enviada al administrador después de ${errorCount} intentos fallidos`,
          detalles: `Administrador: ${ADMIN_INFO.nombre} (${ADMIN_INFO.codigoPais}${ADMIN_INFO.numero})`,
          exito: true
        });
        
        console.log('✅ Notificación al administrador enviada correctamente');
        
        // Después de notificar al administrador, notificar al fixer
        enviarMensajeAlFixer(solicitud, estado);
      } else {
        throw new Error(data.mensaje || 'Error en la respuesta del servidor');
      }
    } catch (error: any) {
      console.error('❌ Error al notificar al administrador:', error);
      
      agregarLog({
        tipo: 'notificacion_administrador',
        solicitudId: solicitud.id,
        cliente: solicitud.nombreRequester,
        servicio: solicitud.servicio,
        mensaje: `Error al enviar notificación al administrador`,
        detalles: error.message,
        exito: false
      });
    }
  };

  // Función para enviar mensaje al fixer informando el fallo
  const enviarMensajeAlFixer = async (solicitud: Solicitud, estado: 'aceptada' | 'rechazada') => {
    const estadoTexto = estado === 'aceptada' ? 'aceptación' : 'rechazo';
    
    const texto = `📢 Información importante sobre tu solicitud

No hemos podido notificar al cliente sobre el ${estadoTexto} de su solicitud.

📋 Detalles:
• Solicitud: SOL-${solicitud.id}
• Cliente: ${solicitud.nombreRequester}
• Servicio: ${solicitud.servicio}
• Estado: ${estado === 'aceptada' ? 'Aceptada' : 'Rechazada'}
• Fixer responsable: ${solicitud.fixer.nombre}

ℹ️ El administrador ha sido notificado y se contactará con el cliente manualmente.

Puedes ver los detalles de la solicitud en:
${solicitud.urlSolicitud}`;

    const cuerpo = {
      number: solicitud.fixer.codigoPais + solicitud.fixer.numero,
      text: texto,
      logData: {
        fixer: solicitud.fixer.nombre,
        client: solicitud.nombreRequester,
        servicio: solicitud.servicio,
        estado: estado,
        tipo: 'notificacion_fallo_envio'
      },
    };

    try {
      console.log('🔍 Enviando notificación al fixer...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const respuesta = await fetch('https://servineo-backend.onrender.com/api/par5/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }

      const data = await respuesta.json();
      
      if (data.success) {
        agregarLog({
          tipo: 'notificacion_fixer',
          solicitudId: solicitud.id,
          cliente: solicitud.nombreRequester,
          servicio: solicitud.servicio,
          mensaje: `Notificación de fallo enviada al fixer`,
          detalles: `Fixer: ${solicitud.fixer.nombre} (${solicitud.fixer.codigoPais}${solicitud.fixer.numero})`,
          exito: true
        });
        
        console.log('✅ Notificación al fixer enviada correctamente');
      } else {
        throw new Error(data.mensaje || 'Error en la respuesta del servidor');
      }
    } catch (error: any) {
      console.error('❌ Error al notificar al fixer:', error);
      
      agregarLog({
        tipo: 'notificacion_fixer',
        solicitudId: solicitud.id,
        cliente: solicitud.nombreRequester,
        servicio: solicitud.servicio,
        mensaje: `Error al enviar notificación de fallo al fixer`,
        detalles: error.message,
        exito: false
      });
    }
  };

  // Función para abrir modal de edición (incluyendo datos del fixer)
  const abrirEdicion = (solicitud: Solicitud) => {
    setEditandoSolicitud(solicitud);
    setFormEdicion({
      id: solicitud.id,
      codigoPais: solicitud.codigoPais,
      numero: solicitud.numero,
      urlSolicitud: solicitud.urlSolicitud,
      fixerCodigoPais: solicitud.fixer.codigoPais,
      fixerNumero: solicitud.fixer.numero
      // No incluimos fixerNombre ya que no es editable
    });
    setModalEdicionVisible(true);
    
    agregarLog({
      tipo: 'edicion',
      solicitudId: solicitud.id,
      cliente: solicitud.nombreRequester,
      servicio: solicitud.servicio,
      mensaje: `Inició edición de solicitud SOL-${solicitud.id}`
    });
  };

  // Función para guardar edición (incluyendo datos del fixer)
  const guardarEdicion = () => {
    if (!validarNumero(formEdicion.numero)) {
      mostrarAlerta('error', '❌ Número del cliente inválido. Solo números (máx 8 dígitos)');
      return;
    }

    if (!validarNumero(formEdicion.fixerNumero)) {
      mostrarAlerta('error', '❌ Número del fixer inválido. Solo números (máx 8 dígitos)');
      return;
    }

    if (!validarCodigoPais(formEdicion.codigoPais)) {
      mostrarAlerta('error', '❌ Código de país del cliente no válido');
      return;
    }

    if (!validarCodigoPais(formEdicion.fixerCodigoPais)) {
      mostrarAlerta('error', '❌ Código de país del fixer no válido');
      return;
    }

    if (!formEdicion.urlSolicitud.trim()) {
      mostrarAlerta('error', '❌ URL de solicitud es obligatoria');
      return;
    }

    setSolicitudes(prev => 
      prev.map(s => 
        s.id === editandoSolicitud?.id 
          ? { 
              ...s,
              codigoPais: formEdicion.codigoPais,
              numero: formEdicion.numero,
              urlSolicitud: formEdicion.urlSolicitud.trim(),
              fixer: {
                nombre: s.fixer.nombre, // Mantener el nombre original (no editable)
                codigoPais: formEdicion.fixerCodigoPais,
                numero: formEdicion.fixerNumero
              }
            }
          : s
      )
    );

    agregarLog({
      tipo: 'edicion',
      solicitudId: formEdicion.id,
      cliente: editandoSolicitud?.nombreRequester || '',
      servicio: editandoSolicitud?.servicio || '',
      mensaje: `Editó solicitud SOL-${formEdicion.id} (incluyendo datos del fixer)`,
      exito: true
    });

    mostrarAlerta('success', '✅ Solicitud actualizada correctamente');
    setModalEdicionVisible(false);
    setEditandoSolicitud(null);
  };

  // Función para enviar el mensaje con manejo de errores mejorado
  const enviarMensaje = async (
    estado: 'aceptada' | 'rechazada',
    solicitud: Solicitud,
    motivoRechazo: string
  ) => {
    // Validaciones antes de enviar
    if (estado === 'rechazada' && !motivoRechazo.trim()) {
      mostrarAlerta('error', '❌ Debes especificar un motivo para el rechazo');
      return;
    }

    if (!validarMotivo(motivoRechazo)) {
      mostrarAlerta('error', '❌ Motivo contiene caracteres no permitidos o excede el límite de 100 caracteres');
      return;
    }

    setModalLoading(true);

    // 1️⃣ Crear el texto según el estado
    let texto = '';
    const fechaHora = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    if (estado === 'aceptada') {
      texto = `Nueva actualización sobre tu solicitud ✔
¡Tu solicitud ha sido aceptada!

📋 **Detalles:**
• Número de solicitud: SOL-${solicitud.id}
• Servicio: ${solicitud.servicio}
• Fecha y hora: ${fechaHora}
• Fixer asignado: ${solicitud.fixer.nombre}

🔗 **Enlace de seguimiento:**
${solicitud.urlSolicitud}

El fixer ${solicitud.fixer.nombre} está listo para ayudarte.`;
    } else {
      texto = `Nueva actualización sobre tu solicitud ❌
Lamentamos informarte que tu solicitud ha sido rechazada.

📋 **Detalles:**
• Número: SOL-${solicitud.id}
• Servicio: ${solicitud.servicio}
• Fecha y hora: ${fechaHora}
• Fixer responsable: ${solicitud.fixer.nombre}
• Motivo: ${motivoRechazo}

🔄 **¿Qué puedes hacer?**
• Revisar los detalles en: ${solicitud.urlSolicitud}
• Crear una nueva solicitud ajustando los requerimientos`;
    }

    const cuerpo = {
      number: solicitud.codigoPais + solicitud.numero,
      text: texto,
      logData: {
        fixer: solicitud.fixer.nombre,
        client: solicitud.nombreRequester,
        servicio: solicitud.servicio,
        estado,
        motivo: motivoRechazo,
      },
    };

    try {
      console.log('🔍 Enviando a PAR5 endpoint...');
      
      // Timeout de 10 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const respuesta = await fetch('https://servineo-backend.onrender.com/api/par5/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status} - ${respuesta.statusText}`);
      }

      const data = await respuesta.json();
      console.log('✅ Respuesta de PAR5:', data);

      if (data.success) {
        // Resetear contador de reintentos si es exitoso
        setReintentosCount(prev => {
          const newCounts = { ...prev };
          delete newCounts[solicitud.id];
          return newCounts;
        });

        agregarLog({
          tipo: estado,
          solicitudId: solicitud.id,
          cliente: solicitud.nombreRequester,
          servicio: solicitud.servicio,
          estado,
          mensaje: `Mensaje ${estado} enviado correctamente`,
          detalles: `Destino: ${solicitud.codigoPais}${solicitud.numero} | Fixer: ${solicitud.fixer.nombre}`,
          exito: true
        });
        
        mostrarAlerta('success', '✅ Mensaje enviado correctamente');
        setTimeout(() => closeModal(), 1000);
        setReintentoPendiente(null);
      } else {
        throw new Error(data.mensaje || 'Error en la respuesta del servidor');
      }
    } catch (error: any) {
      console.error('❌ Error con PAR5:', error);
      
      const mensajeError = error.name === 'AbortError' 
        ? '⏰ Tiempo de espera agotado. Verifica tu conexión a internet.'
        : `🌐 Error de conexión: ${error.message}`;

      // Incrementar contador de reintentos
      const currentCount = reintentosCount[solicitud.id] || 0;
      const newCount = currentCount + 1;
      setReintentosCount(prev => ({
        ...prev,
        [solicitud.id]: newCount
      }));

      // Verificar si es el tercer intento fallido
      if (newCount >= 3) {
        console.log(`🚨 3 intentos fallidos para SOL-${solicitud.id}, notificando al administrador...`);
        enviarMensajeAlAdministrador(solicitud, newCount, estado);
        
        // Mostrar alerta especial para el usuario
        mostrarAlerta('error', `❌ No se pudo enviar el mensaje después de ${newCount} intentos. El administrador ha sido notificado.`);
      } else {
        mostrarAlerta('error', mensajeError);
      }

      agregarLog({
        tipo: 'error',
        solicitudId: solicitud.id,
        cliente: solicitud.nombreRequester,
        servicio: solicitud.servicio,
        estado,
        mensaje: `Error al enviar mensaje ${estado} (Intento ${newCount})`,
        detalles: `Fixer: ${solicitud.fixer.nombre} | Error: ${error.message}`,
        exito: false
      });
      
      // Guardar para reintento solo si no hemos llegado a 3 intentos
      if (newCount < 3) {
        setReintentoPendiente({
          solicitud,
          estado,
          motivo: motivoRechazo
        });
      } else {
        // Limpiar reintento pendiente después del 3er intento
        setReintentoPendiente(null);
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Función para reintentar envío
  const reintentarEnvio = () => {
    if (reintentoPendiente) {
      enviarMensaje(
        reintentoPendiente.estado,
        reintentoPendiente.solicitud,
        reintentoPendiente.motivo
      );
    }
  };

  const openModal = (solicitud: Solicitud, estado: 'aceptada' | 'rechazada') => {
    setSolicitudActual(solicitud);
    setEstadoActual(estado);
    setMotivoRechazo('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setSolicitudActual(null);
    setEstadoActual(null);
    setMotivoRechazo('');
    setModalVisible(false);
  };

  const cerrarEdicion = () => {
    setModalEdicionVisible(false);
    setEditandoSolicitud(null);
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] p-4 md:p-6 font-roboto">
      {/* Botón ATRAS */}
      <button
        onClick={() => router.push('/servineo')}
        className="fixed top-4 left-4 bg-[#2B31E0] text-white px-4 py-2 rounded-lg hover:bg-[#2B6AE0] transition-colors shadow-md z-50 font-medium text-sm md:text-base"
      >
        ← ATRAS
      </button>

      {/* Header Responsive */}
      <div className="max-w-6xl mx-auto mb-6 md:mb-8 pt-16 md:pt-0">
        <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2 text-center md:text-left">
          Panel de Solicitudes
        </h1>
        <p className="text-[#64748B] text-sm md:text-lg text-center md:text-left">
          Gestiona y envía notificaciones
        </p>
      </div>

      {/* Botón Ver Logs */}
      <div className="max-w-6xl mx-auto mb-4 flex justify-end">
        <button
          onClick={() => setModalLogsVisible(true)}
          className="bg-[#6B7280] text-white px-4 py-2 rounded-lg hover:bg-[#4B5563] transition-colors text-sm md:text-base"
        >
          📋 Ver Logs ({logs.length})
        </button>
      </div>

      {/* Alerta de Reintento Pendiente */}
      {reintentoPendiente && (
        <div className="max-w-6xl mx-auto mb-4 bg-[#FEF3C7] border border-[#D97706] rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-[#92400E] font-medium">⚠️ Envío pendiente</p>
              <p className="text-[#92400E] text-sm">
                No se pudo enviar el mensaje para SOL-{reintentoPendiente.solicitud.id} 
                (Fixer: {reintentoPendiente.solicitud.fixer.nombre})
                (Intento {reintentosCount[reintentoPendiente.solicitud.id] || 1}/3)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reintentarEnvio}
                className="bg-[#DC2626] text-white px-3 py-1 rounded text-sm hover:bg-[#B91C1C]"
              >
                Reintentar
              </button>
              <button
                onClick={() => setReintentoPendiente(null)}
                className="bg-[#6B7280] text-white px-3 py-1 rounded text-sm hover:bg-[#4B5563]"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información del backend */}
      <div className="bg-[#E6EDF3] border border-[#759AE0] rounded-lg p-3 md:p-4 mb-6 max-w-6xl mx-auto">
        <h3 className="font-semibold text-[#2B31E0] mb-2 text-sm md:text-base">ℹ️ Backend PAR5</h3>
        <p className="text-[#111827] text-xs md:text-sm break-all">
          Conectado a: <strong>https://servineo-backend.onrender.com/api/par5/enviar</strong>
        </p>
        <div className="mt-2 text-xs">
          <div>
            <strong>Administrador:</strong> {ADMIN_INFO.nombre} ({ADMIN_INFO.codigoPais}{ADMIN_INFO.numero})
          </div>
        </div>
      </div>

      {alerta && (
        <div
          className={`text-center mb-6 p-3 rounded-lg whitespace-pre-line max-w-6xl mx-auto text-sm md:text-base ${
            alerta.tipo === 'success' 
              ? 'bg-[#16A34A] text-white shadow-md'
              : 'bg-[#EF4444] text-white shadow-md'
          }`}
        >
          {alerta.mensaje}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Grid de solicitudes responsive */}
        <div className="grid gap-4 md:gap-6">
          {solicitudes.map((solicitud) => (
            <div
              key={solicitud.id}
              className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-[#E5E7EB]"
            >
              {/* Header de la solicitud */}
              <div className="mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-[#2B31E0] mb-3 md:mb-4">
                  SOL-{solicitud.id}
                </h3>
                
                {/* Información en grid responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <h4 className="text-xs md:text-sm font-semibold text-[#64748B] mb-1">Cliente:</h4>
                    <p className="text-[#111827] font-medium text-sm md:text-base">{solicitud.nombreRequester}</p>
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-semibold text-[#64748B] mb-1">Servicio:</h4>
                    <p className="text-[#111827] font-medium text-sm md:text-base">{solicitud.servicio}</p>
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-semibold text-[#64748B] mb-1">Teléfono Cliente:</h4>
                    <p className="text-[#111827] font-medium text-sm md:text-base">
                      {solicitud.codigoPais} {solicitud.numero}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-semibold text-[#64748B] mb-1">Fecha:</h4>
                    <p className="text-[#111827] font-medium text-sm md:text-base">{solicitud.fecha}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-xs md:text-sm font-semibold text-[#64748B] mb-1">Fixer Asignado:</h4>
                    <div className="bg-[#F0F9FF] p-3 rounded-lg border border-[#BAE6FD]">
                      <p className="text-[#111827] font-medium text-sm md:text-base">
                        <strong>{solicitud.fixer.nombre}</strong>
                      </p>
                      <p className="text-[#64748B] text-sm">
                        {solicitud.fixer.codigoPais} {solicitud.fixer.numero}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-[#E5E7EB] my-3 md:my-4"></div>

              {/* Botones de acción responsive */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => abrirEdicion(solicitud)}
                  className="bg-[#1AA7ED] text-white px-4 py-2 rounded-lg hover:bg-[#2B6AE0] transition-colors font-medium text-sm md:text-base flex-1"
                >
                  Editar
                </button>
                <button
                  onClick={() => openModal(solicitud, 'aceptada')}
                  className="bg-[#16A34A] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-medium text-sm md:text-base flex-1"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => openModal(solicitud, 'rechazada')}
                  className="bg-[#EF4444] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-medium text-sm md:text-base flex-1"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Aceptar/Rechazar */}
      {modalVisible && solicitudActual && estadoActual && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 font-roboto p-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg relative w-full max-w-md border border-[#D1D5DB]">
            <h3 className="text-lg font-bold mb-4 text-[#111827]">
              {estadoActual === 'aceptada' ? '✅ Aceptar Solicitud' : '❌ Rechazar Solicitud'}
            </h3>

            {/* Información del Fixer en el modal */}
            <div className="mb-4 bg-[#F0F9FF] p-3 rounded-lg border border-[#BAE6FD]">
              <h4 className="text-sm font-semibold text-[#0369A1] mb-1">Fixer Asignado:</h4>
              <p className="text-[#111827] font-medium">{solicitudActual.fixer.nombre}</p>
              <p className="text-[#64748B] text-sm">
                {solicitudActual.fixer.codigoPais} {solicitudActual.fixer.numero}
              </p>
            </div>

            {estadoActual === 'rechazada' && (
              <div className="mb-4">
                <label htmlFor="motivo-rechazo" className="block text-sm font-medium text-[#111827] mb-2">
                  Motivo del rechazo:
                  <span className="text-xs text-gray-500 ml-1">
                    ({motivoRechazo.length}/100) - Solo letras y números
                  </span>
                </label>
                <textarea
                  id="motivo-rechazo"
                  value={motivoRechazo}
                  onChange={(e) => {
                    if (validarMotivo(e.target.value) || e.target.value === '') {
                      setMotivoRechazo(e.target.value);
                    }
                  }}
                  placeholder="Escribe el motivo del rechazo..."
                  title="Campo para escribir el motivo del rechazo de la solicitud"
                  aria-label="Motivo del rechazo"
                  aria-describedby="motivo-help"
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 resize-none focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827] text-sm"
                  rows={4}
                  maxLength={100}
                />
                <p id="motivo-help" className="text-xs text-gray-500 mt-1">
                  Describe el motivo del rechazo. Solo se permiten letras, números y signos básicos.
                </p>
                {!validarMotivo(motivoRechazo) && motivoRechazo.length > 0 && (
                  <p className="text-red-500 text-xs mt-1" role="alert">
                    Caracteres no permitidos detectados
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={modalLoading}
                className="bg-[#E5E7EB] text-[#111827] px-4 py-2 rounded-lg hover:bg-[#D1D5DB] transition-colors font-medium text-sm flex-1 sm:flex-none order-2 sm:order-1"
              >
                Cancelar
              </button>

              <button
                onClick={() =>
                  enviarMensaje(estadoActual, solicitudActual, motivoRechazo)
                }
                disabled={modalLoading || (estadoActual === 'rechazada' && !motivoRechazo.trim())}
                className={`${
                  estadoActual === 'aceptada'
                    ? 'bg-[#16A34A] hover:bg-opacity-90'
                    : 'bg-[#EF4444] hover:bg-opacity-90'
                } text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center font-medium min-w-[100px] flex-1 sm:flex-none order-1 sm:order-2 ${
                  modalLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {modalLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición (incluyendo datos del fixer) */}
      {modalEdicionVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 font-roboto p-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg relative w-full max-w-md border border-[#D1D5DB] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-[#111827]">✏️ Editar Solicitud</h3>
            <p className="text-sm text-gray-600 mb-4">Puedes editar: Teléfonos y URL (Nombre del fixer no editable)</p>

            <div className="space-y-3 mb-4">
              {/* Campos NO editables */}
              <div>
                <label htmlFor="edit-id" className="block text-sm font-medium text-[#111827] mb-1">
                  ID (No editable)
                </label>
                <input
                  id="edit-id"
                  type="text"
                  value={formEdicion.id}
                  disabled
                  title="ID de la solicitud - Campo no editable"
                  aria-label="ID de la solicitud"
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="display-cliente" className="block text-sm font-medium text-[#111827] mb-1">
                  Cliente (No editable)
                </label>
                <input
                  id="display-cliente"
                  type="text"
                  value={editandoSolicitud?.nombreRequester || ''}
                  disabled
                  title="Nombre del cliente - Campo no editable"
                  aria-label="Nombre del cliente"
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="display-servicio" className="block text-sm font-medium text-[#111827] mb-1">
                  Servicio (No editable)
                </label>
                <input
                  id="display-servicio"
                  type="text"
                  value={editandoSolicitud?.servicio || ''}
                  disabled
                  title="Servicio solicitado - Campo no editable"
                  aria-label="Servicio solicitado"
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="display-fecha" className="block text-sm font-medium text-[#111827] mb-1">
                  Fecha (No editable)
                </label>
                <input
                  id="display-fecha"
                  type="text"
                  value={editandoSolicitud?.fecha || ''}
                  disabled
                  title="Fecha de la solicitud - Campo no editable"
                  aria-label="Fecha de la solicitud"
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Campos editables - Cliente */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-[#111827] mb-3">📞 Datos del Cliente</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label htmlFor="edit-codigo-pais" className="block text-sm font-medium text-[#111827] mb-1">
                      Código País
                    </label>
                    <select
                      id="edit-codigo-pais"
                      value={formEdicion.codigoPais}
                      onChange={(e) => setFormEdicion(prev => ({...prev, codigoPais: e.target.value}))}
                      title="Selecciona el código de país del cliente"
                      aria-label="Código de país del cliente"
                      className="w-full border border-[#D1D5DB] rounded-lg p-3 focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                    >
                      <option value="+591">+591 (BO)</option>
                      <option value="+51">+51 (PE)</option>
                      <option value="+57">+57 (CO)</option>
                      <option value="+58">+58 (VE)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="edit-numero" className="block text-sm font-medium text-[#111827] mb-1">
                      Número Cliente
                      <span className="text-xs text-gray-500 ml-1">(solo números, máx 8 dígitos)</span>
                    </label>
                    <input
                      id="edit-numero"
                      type="text"
                      value={formEdicion.numero}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
                        setFormEdicion(prev => ({...prev, numero: valor}));
                      }}
                      title="Número de teléfono del cliente"
                      aria-label="Número de teléfono del cliente"
                      aria-describedby="numero-help"
                      className="w-full border border-[#D1D5DB] rounded-lg p-3 focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                      placeholder="77777777"
                    />
                    <p id="numero-help" className="text-xs text-gray-500 mt-1">
                      Ingresa solo números, máximo 8 dígitos
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <label htmlFor="edit-url" className="block text-sm font-medium text-[#111827] mb-1">
                    URL de Solicitud
                  </label>
                  <input
                    id="edit-url"
                    type="text"
                    value={formEdicion.urlSolicitud}
                    onChange={(e) => setFormEdicion(prev => ({...prev, urlSolicitud: e.target.value}))}
                    title="URL de la solicitud"
                    aria-label="URL de la solicitud"
                    aria-describedby="url-help"
                    className="w-full border border-[#D1D5DB] rounded-lg p-3 focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                    placeholder="https://servineo.com/solicitud/001"
                  />
                  <p id="url-help" className="text-xs text-gray-500 mt-1">
                    URL completa de la solicitud
                  </p>
                </div>
              </div>

              {/* Campos editables - Fixer */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-[#111827] mb-3">👨‍🔧 Datos del Fixer</h4>
                
                {/* Nombre del Fixer (NO editable) */}
                <div className="mb-3">
                  <label htmlFor="display-fixer-nombre" className="block text-sm font-medium text-[#111827] mb-1">
                    Nombre del Fixer (No editable)
                  </label>
                  <input
                    id="display-fixer-nombre"
                    type="text"
                    value={editandoSolicitud?.fixer.nombre || ''}
                    disabled
                    title="Nombre del fixer asignado - Campo no editable"
                    aria-label="Nombre del fixer"
                    className="w-full border border-[#D1D5DB] rounded-lg p-3 bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label htmlFor="edit-fixer-codigo-pais" className="block text-sm font-medium text-[#111827] mb-1">
                      Código País
                    </label>
                    <select
                      id="edit-fixer-codigo-pais"
                      value={formEdicion.fixerCodigoPais}
                      onChange={(e) => setFormEdicion(prev => ({...prev, fixerCodigoPais: e.target.value}))}
                      title="Selecciona el código de país del fixer"
                      aria-label="Código de país del fixer"
                      className="w-full border border-[#D1D5DB] rounded-lg p-3 focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                    >
                      <option value="+591">+591 (BO)</option>
                      <option value="+51">+51 (PE)</option>
                      <option value="+57">+57 (CO)</option>
                      <option value="+58">+58 (VE)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="edit-fixer-numero" className="block text-sm font-medium text-[#111827] mb-1">
                      Número Fixer
                      <span className="text-xs text-gray-500 ml-1">(solo números, máx 8 dígitos)</span>
                    </label>
                    <input
                      id="edit-fixer-numero"
                      type="text"
                      value={formEdicion.fixerNumero}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
                        setFormEdicion(prev => ({...prev, fixerNumero: valor}));
                      }}
                      title="Número de teléfono del fixer"
                      aria-label="Número de teléfono del fixer"
                      aria-describedby="fixer-numero-help"
                      className="w-full border border-[#D1D5DB] rounded-lg p-3 focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                      placeholder="78888888"
                    />
                    <p id="fixer-numero-help" className="text-xs text-gray-500 mt-1">
                      Ingresa solo números, máximo 8 dígitos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={cerrarEdicion}
                className="bg-[#E5E7EB] text-[#111827] px-4 py-2 rounded-lg hover:bg-[#D1D5DB] transition-colors font-medium text-sm flex-1 sm:flex-none"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                className="bg-[#2B31E0] text-white px-4 py-2 rounded-lg hover:bg-[#2B6AE0] transition-colors font-medium text-sm flex-1 sm:flex-none"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Logs */}
      {modalLogsVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 font-roboto p-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg relative w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#D1D5DB]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#111827]">📋 Historial de Logs</h3>
              <button
                onClick={() => setModalLogsVisible(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Cerrar modal de logs"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh]">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay logs registrados</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border ${
                        log.exito === false
                          ? 'bg-red-50 border-red-200'
                          : log.tipo === 'error'
                          ? 'bg-orange-50 border-orange-200'
                          : log.tipo === 'aceptada'
                          ? 'bg-green-50 border-green-200'
                          : log.tipo === 'rechazada'
                          ? 'bg-red-50 border-red-200'
                          : log.tipo === 'notificacion_administrador'
                          ? 'bg-purple-50 border-purple-200'
                          : log.tipo === 'notificacion_fixer'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-1 rounded ${
                              log.tipo === 'aceptada'
                                ? 'bg-green-100 text-green-800'
                                : log.tipo === 'rechazada'
                                ? 'bg-red-100 text-red-800'
                                : log.tipo === 'error'
                                ? 'bg-orange-100 text-orange-800'
                                : log.tipo === 'notificacion_administrador'
                                ? 'bg-purple-100 text-purple-800'
                                : log.tipo === 'notificacion_fixer'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {log.tipo.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {log.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{log.mensaje}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            SOL-{log.solicitudId} • {log.cliente} • {log.servicio}
                          </p>
                          {log.detalles && (
                            <p className="text-xs text-gray-500 mt-1">{log.detalles}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estilos para la fuente Roboto */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        body {
          font-family: 'Roboto', sans-serif;
        }
      `}</style>
    </main>
  );
}
