'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Interfaz para las solicitudes
interface Solicitud {
  id: string;
  nombreRequester: string;
  numero: string;
  servicio: string;
  urlSolicitud: string;
  fecha: string;
}

export default function SimulationHU3() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([
    {
      id: '001',
      nombreRequester: 'Juan Pérez',
      numero: '+59177777777',
      servicio: 'Reparación de plomería',
      urlSolicitud: 'https://servineo.com/solicitud/001',
      fecha: '2025-10-15 10:30'
    },
    {
      id: '002',
      nombreRequester: 'Maria García',
      numero: '+59178888888',
      servicio: 'Instalación eléctrica',
      urlSolicitud: 'https://servineo.com/solicitud/002',
      fecha: '2025-10-15 11:00'
    },
    {
      id: '003',
      nombreRequester: 'Carlos López',
      numero: '+59179999999',
      servicio: 'Reparación de celular',
      urlSolicitud: 'https://servineo.com/solicitud/003',
      fecha: '2025-10-15 12:15'
    },
  ]);

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
    nombreRequester: '',
    numero: '',
    servicio: '',
    urlSolicitud: '',
    fecha: ''
  });

  // Función para mostrar alertas temporales
  const mostrarAlerta = (tipo: 'success' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 3000);
  };

  // Función para abrir modal de edición
  const abrirEdicion = (solicitud: Solicitud) => {
    setEditandoSolicitud(solicitud);
    setFormEdicion({
      id: solicitud.id,
      nombreRequester: solicitud.nombreRequester,
      numero: solicitud.numero,
      servicio: solicitud.servicio,
      urlSolicitud: solicitud.urlSolicitud,
      fecha: solicitud.fecha
    });
    setModalEdicionVisible(true);
  };

  // Función para guardar edición
  const guardarEdicion = () => {
    if (!formEdicion.id.trim() || !formEdicion.nombreRequester.trim() || 
        !formEdicion.numero.trim() || !formEdicion.servicio.trim()) {
      mostrarAlerta('error', '❌ Por favor completa todos los campos obligatorios');
      return;
    }

    setSolicitudes(prev => 
      prev.map(s => 
        s.id === editandoSolicitud?.id 
          ? { 
              id: formEdicion.id.trim(),
              nombreRequester: formEdicion.nombreRequester.trim(),
              numero: formEdicion.numero.trim(),
              servicio: formEdicion.servicio.trim(),
              urlSolicitud: formEdicion.urlSolicitud.trim(),
              fecha: formEdicion.fecha.trim()
            }
          : s
      )
    );

    mostrarAlerta('success', '✅ Solicitud actualizada correctamente');
    setModalEdicionVisible(false);
    setEditandoSolicitud(null);
  };

  // Función para enviar el mensaje - USANDO LA RUTA PAR5
const enviarMensaje = async (
  estado: 'aceptada' | 'rechazada',
  solicitud: Solicitud,
  nombreFixer: string,
  motivoRechazo: string
) => {
  setModalLoading(true);

  // 1️⃣ Crear el texto según el estado con el nuevo formato
  let texto = '';
  if (estado === 'aceptada') {
    texto = `Nueva actualización sobre tu solicitud ✔
¡Tu solicitud ha sido aceptada!
Número de solicitud: SOL-${solicitud.id}
Servicio: ${solicitud.servicio}
Fecha y hora de aceptación: ${new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}
Motivo: ${motivoRechazo || 'Solicitud aprobada'}
El Fixer ${nombreFixer} ya está listo para ayudarte.
Puedes contactarlo desde la solicitud: ${solicitud.urlSolicitud}`;
  } else {
    texto = `Nueva actualización sobre tu solicitud ❌
Lamentamos informarte que tu solicitud ha sido rechazada.
Número de solicitud: SOL-${solicitud.id}
Servicio: ${solicitud.servicio}
Fecha y hora de rechazo: ${new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}
Motivo: ${motivoRechazo || 'No especificado'}
Puedes crear una nueva solicitud en: ${solicitud.urlSolicitud}`;
  }

  const cuerpo = {
    number: solicitud.numero.trim(),
    text: texto,
    logData: {
      fixer: nombreFixer,
      client: solicitud.nombreRequester,
      servicio: solicitud.servicio,
      estado,
      motivo: motivoRechazo,
    },
  };

  try {
    console.log('🔍 Enviando a PAR5 endpoint...');
    
    // USANDO LA NUEVA RUTA PAR5
    const respuesta = await fetch('https://servineo-backend.onrender.com/api/par5/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    const data = await respuesta.json();
    console.log('✅ Respuesta de PAR5:', data);

    if (data.success) {
      mostrarAlerta('success', '✅ Mensaje enviado correctamente a través de PAR5');
      setTimeout(() => closeModal(), 1000);
    } else {
      mostrarAlerta('error', data.mensaje || '❌ No se pudo enviar el mensaje');
    }
  } catch (error: any) {
    console.error('❌ Error con PAR5:', error);
    mostrarAlerta('error', 
      `❌ No se pudo conectar con el backend PAR5.\n
      Error: ${error.message}`
    );
  } finally {
    setModalLoading(false);
  }
};

  const openModal = (solicitud: Solicitud, estado: 'aceptada' | 'rechazada') => {
    setSolicitudActual(solicitud);
    setEstadoActual(estado);
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
    <main className="min-h-screen bg-[#F9FAFB] p-6 font-roboto">
      {/* Botón ATRAS en esquina superior izquierda */}
      <button
        onClick={() => router.push('/servineo')}
        className="fixed top-4 left-4 bg-[#2B31E0] text-white px-4 py-2 rounded-lg hover:bg-[#2B6AE0] transition-colors shadow-md z-50 font-medium"
      >
        ← ATRAS
      </button>

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-[#111827] mb-2">
          Panel de Solicitudes
        </h1>
        <p className="text-[#64748B] text-lg">
          Gestiona y envía notificaciones
        </p>
      </div>

      {/* Información del estado del backend */}
      <div className="bg-[#E6EDF3] border border-[#759AE0] rounded-lg p-4 mb-6 max-w-6xl mx-auto">
        <h3 className="font-semibold text-[#2B31E0] mb-2">ℹ️ Backend PAR5</h3>
        <p className="text-[#111827] text-sm">
          Conectado a: <strong>https://servineo-backend.onrender.com/api/par5/enviar</strong>
        </p>
      </div>

      {alerta && (
        <div
          className={`text-center mb-6 p-3 rounded-lg whitespace-pre-line max-w-6xl mx-auto ${
            alerta.tipo === 'success' ? 'bg-[#16A34A] bg-opacity-20 text-[#16A34A]' : 'bg-[#EF4444] bg-opacity-20 text-[#EF4444]'
          }`}
        >
          {alerta.mensaje}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header de sección */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#111827]">
            Solicitudes Pendientes
          </h2>
          <span className="text-[#64748B] font-medium">Historial</span>
        </div>

        {/* Separador */}
        <div className="border-t border-[#E5E7EB] mb-8"></div>

        {/* Grid de solicitudes */}
        <div className="space-y-6">
          {solicitudes.map((solicitud) => (
            <div
              key={solicitud.id}
              className="bg-white p-6 rounded-2xl shadow-lg border border-[#E5E7EB]"
            >
              {/* Header de la solicitud */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#2B31E0] mb-4">
                  SOL-{solicitud.id}
                </h3>
                
                {/* Información en grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#64748B] mb-1">Cliente:</h4>
                    <p className="text-[#111827] font-medium">{solicitud.nombreRequester}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#64748B] mb-1">Servicio:</h4>
                    <p className="text-[#111827] font-medium">{solicitud.servicio}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#64748B] mb-1">Teléfono:</h4>
                    <p className="text-[#111827] font-medium">{solicitud.numero}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#64748B] mb-1">Fecha:</h4>
                    <p className="text-[#111827] font-medium">{solicitud.fecha}</p>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-[#E5E7EB] my-4"></div>

              {/* Botones de acción */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => abrirEdicion(solicitud)}
                  className="bg-[#1AA7ED] text-white px-6 py-2 rounded-lg hover:bg-[#2B6AE0] transition-colors font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => openModal(solicitud, 'aceptada')}
                  className="bg-[#16A34A] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => openModal(solicitud, 'rechazada')}
                  className="bg-[#EF4444] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 font-roboto">
          <div className="bg-white p-6 rounded-2xl shadow-lg relative w-96 max-w-[90vw] border border-[#D1D5DB]">
            <h3 className="text-lg font-bold mb-4 text-[#111827]">
              {estadoActual === 'aceptada' ? 'Aceptar Solicitud' : 'Rechazar Solicitud'}
            </h3>

            {estadoActual === 'rechazada' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Motivo del rechazo:
                </label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Escribe el motivo del rechazo..."
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 resize-none focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                  rows={4}
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="bg-[#E5E7EB] text-[#111827] px-4 py-2 rounded-lg hover:bg-[#D1D5DB] transition-colors font-medium"
              >
                Cancelar
              </button>

              <button
                onClick={() =>
                  enviarMensaje(estadoActual, solicitudActual, 'Fixer ServiNeo', motivoRechazo)
                }
                disabled={modalLoading}
                className={`${
                  estadoActual === 'aceptada'
                    ? 'bg-[#16A34A] hover:bg-opacity-90'
                    : 'bg-[#EF4444] hover:bg-opacity-90'
                } text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center font-medium min-w-[100px]`}
              >
                {modalLoading ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {modalEdicionVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 font-roboto">
          <div className="bg-white p-6 rounded-2xl shadow-lg relative w-96 max-w-[90vw] border border-[#D1D5DB]">
            <h3 className="text-lg font-bold mb-4 text-[#111827]">Editar Solicitud</h3>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">ID</label>
                <input
                  type="text"
                  value={formEdicion.id}
                  onChange={(e) => setFormEdicion(prev => ({...prev, id: e.target.value}))}
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  value={formEdicion.nombreRequester}
                  onChange={(e) => setFormEdicion(prev => ({...prev, nombreRequester: e.target.value}))}
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Número</label>
                <input
                  type="text"
                  value={formEdicion.numero}
                  onChange={(e) => setFormEdicion(prev => ({...prev, numero: e.target.value}))}
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Servicio</label>
                <input
                  type="text"
                  value={formEdicion.servicio}
                  onChange={(e) => setFormEdicion(prev => ({...prev, servicio: e.target.value}))}
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">URL de Solicitud</label>
                <input
                  type="text"
                  value={formEdicion.urlSolicitud}
                  onChange={(e) => setFormEdicion(prev => ({...prev, urlSolicitud: e.target.value}))}
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Fecha</label>
                <input
                  type="text"
                  value={formEdicion.fecha}
                  onChange={(e) => setFormEdicion(prev => ({...prev, fecha: e.target.value}))}
                  className="w-full border border-[#D1D5DB] rounded-lg p-3 focus:ring-2 focus:ring-[#2B31E0] focus:border-[#2B31E0] text-[#111827]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cerrarEdicion}
                className="bg-[#E5E7EB] text-[#111827] px-4 py-2 rounded-lg hover:bg-[#D1D5DB] transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                className="bg-[#2B31E0] text-white px-4 py-2 rounded-lg hover:bg-[#2B6AE0] transition-colors font-medium"
              >
                Guardar
              </button>
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
