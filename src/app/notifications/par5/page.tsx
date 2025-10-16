'use client';

import React, { useState } from "react";
import "./Simulation.css";

type EstadoSolicitud = "pendiente" | "aceptada" | "rechazada";

type Solicitud = {
  id: string;
  nombreRequester: string;
  numero: string;
  servicio: string;
  fecha: string;
  estado: EstadoSolicitud;
  urlSolicitud?: string;
  nombreFixer?: string;
  motivoRechazo?: string;
};

const initialSolicitudes: Solicitud[] = [
  {
    id: "SOL-001",
    nombreRequester: "Juan Pérez",
    numero: "59177777777",
    servicio: "Reparación de plomería",
    fecha: "2025-10-15 10:30",
    estado: "pendiente",
    urlSolicitud: "https://ejemplo.com/solicitud/001",
  },
  {
    id: "SOL-002",
    nombreRequester: "María García",
    numero: "59178888888",
    servicio: "Instalación eléctrica",
    fecha: "2025-10-15 11:00",
    estado: "pendiente",
    urlSolicitud: "https://ejemplo.com/solicitud/002",
  },
  {
    id: "SOL-003",
    nombreRequester: "Carlos López",
    numero: "59179999999",
    servicio: "Reparación de celular",
    fecha: "2025-10-15 12:15",
    estado: "pendiente",
    urlSolicitud: "https://ejemplo.com/solicitud/003",
  },
];

export default function Page() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(initialSolicitudes);
  const [tab, setTab] = useState<"pendientes" | "historial">("pendientes");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalTitleColor, setModalTitleColor] = useState<string>("#111827");
  const [currentSolicitudId, setCurrentSolicitudId] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<"aceptar" | "rechazar" | "editar" | null>(null);

  const [modalNombreFixer, setModalNombreFixer] = useState("");
  const [modalMotivoRechazo, setModalMotivoRechazo] = useState("");
  const [modalEditId, setModalEditId] = useState("");
  const [modalEditNombreRequester, setModalEditNombreRequester] = useState("");
  const [modalEditNumero, setModalEditNumero] = useState("");
  const [modalEditServicio, setModalEditServicio] = useState("");
  const [modalEditUrl, setModalEditUrl] = useState("");
  const [modalAlertMessage, setModalAlertMessage] = useState<string | null>(null);
  const [modalAlertType, setModalAlertType] = useState<"success" | "error" | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const findSolicitud = (id: string) => solicitudes.find((s) => s.id === id) || null;

  const openAcceptModal = (solicitudId: string) => {
    const s = findSolicitud(solicitudId);
    if (!s) return;
    setCurrentSolicitudId(solicitudId);
    setCurrentAction("aceptar");
    setModalTitle("Aceptar Solicitud");
    setModalTitleColor("#16A34A");
    setModalNombreFixer("");
    setModalMotivoRechazo("");
    setModalAlertMessage(null);
    setModalAlertType(null);
    setIsModalOpen(true);
  };

  const openEditModal = (solicitudId: string) => {
    const s = findSolicitud(solicitudId);
    if (!s) return;
    setCurrentSolicitudId(solicitudId);
    setCurrentAction("editar");
    setModalTitle("Editar Solicitud");
    setModalTitleColor("#2BDDE0");
    setModalEditId(s.id);
    setModalEditNombreRequester(s.nombreRequester);
    setModalEditNumero(s.numero);
    setModalEditServicio(s.servicio);
    setModalEditUrl(s.urlSolicitud || "");
    setModalAlertMessage(null);
    setModalAlertType(null);
    setIsModalOpen(true);
  };

  const openRejectModal = (solicitudId: string) => {
    const s = findSolicitud(solicitudId);
    if (!s) return;
    setCurrentSolicitudId(solicitudId);
    setCurrentAction("rechazar");
    setModalTitle("Rechazar Solicitud");
    setModalTitleColor("#EF4444");
    setModalMotivoRechazo("");
    setModalAlertMessage(null);
    setModalAlertType(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSolicitudId(null);
    setCurrentAction(null);
    setModalLoading(false);
    setModalAlertMessage(null);
    setModalAlertType(null);
  };

  const mostrarAlerta = (tipo: "success" | "error", mensaje: string) => {
    setModalAlertType(tipo);
    setModalAlertMessage(mensaje);
  };

  const guardarEdicion = () => {
    if (!modalEditId.trim() || !modalEditNombreRequester.trim() || !modalEditNumero.trim() || !modalEditServicio.trim()) {
      mostrarAlerta("error", "❌ Por favor completa todos los campos obligatorios");
      return;
    }

    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === currentSolicitudId
          ? { ...s, id: modalEditId.trim(), nombreRequester: modalEditNombreRequester.trim(), numero: modalEditNumero.trim(), servicio: modalEditServicio.trim(), urlSolicitud: modalEditUrl.trim() }
          : s
      )
    );

    mostrarAlerta("success", "✅ Solicitud actualizada correctamente");
    setTimeout(() => closeModal(), 1500);
  };

  const procesarSolicitud = async () => {
    if (!currentSolicitudId) return;
    const s = findSolicitud(currentSolicitudId);
    if (!s) return;

    if (currentAction === "aceptar") {
      if (!modalNombreFixer.trim()) {
        mostrarAlerta("error", "❌ Por favor ingresa tu nombre");
        return;
      }

      setSolicitudes((prev) =>
        prev.map((item) =>
          item.id === currentSolicitudId
            ? { ...item, estado: "aceptada", nombreFixer: modalNombreFixer.trim() }
            : item
        )
      );

      await enviarMensaje("aceptada", s, modalNombreFixer.trim(), "");
    } else if (currentAction === "rechazar") {
      if (!modalMotivoRechazo.trim()) {
        mostrarAlerta("error", "❌ Por favor ingresa el motivo del rechazo");
        return;
      }

      setSolicitudes((prev) =>
        prev.map((item) =>
          item.id === currentSolicitudId
            ? { ...item, estado: "rechazada", motivoRechazo: modalMotivoRechazo.trim() }
            : item
        )
      );

      await enviarMensaje("rechazada", s, "", modalMotivoRechazo.trim());
    }
  };

  const enviarMensaje = async (estado: "aceptada" | "rechazada", solicitud: Solicitud, nombreFixer: string, motivoRechazo: string) => {
    setModalLoading(true);

    const body = {
      rol: estado === "aceptada" ? "fixer" : "sistema",
      nombreRequester: solicitud.nombreRequester,
      nombreFixer,
      numero: solicitud.numero,
      nSolicitud: solicitud.id,
      servicio: solicitud.servicio,
      estado,
      motivo: motivoRechazo,
      urlSolicitud: solicitud.urlSolicitud,
    };

    try {
      const response = await fetch("http://localhost:3001/api/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('El servidor respondió con código ${response.status}');

      const data = await response.json();
      if (data.success) {
        mostrarAlerta("success", data.mensaje || "✅ Mensaje enviado correctamente");
        setTimeout(() => closeModal(), 1200);
      } else {
        mostrarAlerta("error", data.mensaje || "❌ No se pudo enviar el mensaje");
      }
    } catch (error: any) {
      mostrarAlerta("error", '❌ Error al enviar mensaje: ${error.message}');
    } finally {
      setModalLoading(false);
    }
  };

  const pendientes = solicitudes.filter((s) => s.estado === "pendiente");
  const completadas = solicitudes.filter((s) => s.estado !== "pendiente");

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        🧩 Panel de Simulación HU3
      </h1>

      {/* --- Tabs --- */}
      <div className="tabs mb-4 flex justify-center">
        <button
          className={'px-4 py-2 rounded-l ${tab === "pendientes" ? "bg-blue-500 text-white" : "bg-gray-200"}'}
          onClick={() => setTab("pendientes")}
        >
          Pendientes
        </button>
        <button
          className={'px-4 py-2 rounded-r ${tab === "historial" ? "bg-blue-500 text-white" : "bg-gray-200"}'}
          onClick={() => setTab("historial")}
        >
          Historial
        </button>
      </div>

      {/* --- Lista de Solicitudes --- */}
      <div>
        {(tab === "pendientes" ? pendientes : completadas).map((s) => (
          <div key={s.id} className="bg-white p-4 rounded shadow mb-2 flex justify-between items-center">
            <div>
              <p><strong>{s.nombreRequester}</strong> - {s.servicio}</p>
              <p>{s.fecha}</p>
            </div>
            <div className="flex gap-2">
              {s.estado === "pendiente" && (
                <>
                  <button className="bg-green-500 text-white px-2 py-1 rounded" onClick={() => openAcceptModal(s.id)}>Aceptar</button>
                  <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => openRejectModal(s.id)}>Rechazar</button>
                  <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => openEditModal(s.id)}>Editar</button>
                </>
              )}
              {s.estado !== "pendiente" && <span className="font-bold">{s.estado.toUpperCase()}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* --- Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96 relative">
            <h2 className="text-xl font-bold mb-4" style={{ color: modalTitleColor }}>{modalTitle}</h2>

            {modalAlertMessage && (
              <div className={'mb-4 p-2 rounded ${modalAlertType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}'}>
                {modalAlertMessage}
              </div>
            )}

            {currentAction === "aceptar" && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={modalNombreFixer}
                  onChange={(e) => setModalNombreFixer(e.target.value)}
                  className="border p-2 rounded"
                />
                <button onClick={procesarSolicitud} className="bg-green-500 text-white px-4 py-2 rounded" disabled={modalLoading}>
                  {modalLoading ? "Procesando..." : "Aceptar"}
                </button>
              </div>
            )}

            {currentAction === "rechazar" && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Motivo del rechazo"
                  value={modalMotivoRechazo}
                  onChange={(e) => setModalMotivoRechazo(e.target.value)}
                  className="border p-2 rounded"
                />
                <button onClick={procesarSolicitud} className="bg-red-500 text-white px-4 py-2 rounded" disabled={modalLoading}>
                  {modalLoading ? "Procesando..." : "Rechazar"}
                </button>
              </div>
            )}

            {currentAction === "editar" && (
              <div className="flex flex-col gap-2">
                <input type="text" placeholder="ID" value={modalEditId} onChange={(e) => setModalEditId(e.target.value)} className="border p-2 rounded" />
                <input type="text" placeholder="Nombre" value={modalEditNombreRequester} onChange={(e) => setModalEditNombreRequester(e.target.value)} className="border p-2 rounded" />
                <input type="text" placeholder="Número" value={modalEditNumero} onChange={(e) => setModalEditNumero(e.target.value)} className="border p-2 rounded" />
                <input type="text" placeholder="Servicio" value={modalEditServicio} onChange={(e) => setModalEditServicio(e.target.value)} className="border p-2 rounded" />
                <input type="text" placeholder="URL" value={modalEditUrl} onChange={(e) => setModalEditUrl(e.target.value)} className="border p-2 rounded" />
                <button onClick={guardarEdicion} className="bg-blue-500 text-white px-4 py-2 rounded">
                  Guardar
                </button>
              </div>
            )}

            <button onClick={closeModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">&times;</button>
          </div>
        </div>
      )}
    </main>
  );
}