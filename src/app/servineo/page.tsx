'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  Bell, 
  CheckCircle, 
  Shield, 
  ClipboardList, 
  ArrowLeft 
} from 'lucide-react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTesting = (huId: string) => {
    const routes: Record<string, string> = {
      'hu01': '/notifications/par1',
      'hu02': '/notifications/par3',
      'hu03': '/notifications/par5',
      'hu04': '/notifications/par4',
    };
    const route = routes[huId];
    if (route) router.push(route);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f9f9ff] text-gray-800 flex flex-col">
      
      {/* Encabezado superior */}
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white shadow-sm">
        <button
          // 👉 Este botón vuelve a la página principal del módulo servineo
          onClick={() => router.push('/')}
          className="flex items-center space-x-2 text-white bg-[#3B82F6] hover:bg-[#2563EB] px-4 py-2 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <h1 className="text-2xl font-bold text-[#3B82F6]">SERVINEO</h1>

        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white font-semibold">
            BB
          </div>
          <div className="text-sm text-gray-500 leading-tight">
            <p className="font-semibold text-gray-800">Byteboys</p>
            <p>Equipo</p>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto px-6 py-16 text-center">
        <span className="inline-block px-4 py-1 bg-[#f1f3ff] text-[#3B82F6] font-medium text-sm rounded-full mb-4">
          Plataforma de Servicios Confiable
        </span>
        <h2 className="text-4xl font-extrabold text-[#1a1a2e] mb-3">SERVINEO</h2>
        <p className="text-gray-600 mb-12">
          Encuentra servicios u ofrece tus habilidades en nuestra plataforma segura y confiable.
        </p>

        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 text-left">
          
          {/* HU01 */}
          <div className="relative bg-white shadow-md rounded-2xl p-8 hover:shadow-lg transition border border-gray-100">
            <div className="absolute top-4 right-4 bg-blue-100 text-[#3B82F6] text-xs font-semibold px-3 py-1 rounded-full">
              HU-01
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-[#3B82F6] p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a1a2e]">
                Registrar Solicitud de Servicio
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Como requester, completa el formulario para solicitar servicio y recibe confirmación inmediata de tu solicitud.
            </p>
            <button
              onClick={() => handleTesting('hu01')}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium px-5 py-3 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <span>Solicitar Servicio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* HU02 */}
          <div className="relative bg-white shadow-md rounded-2xl p-8 hover:shadow-lg transition border border-gray-100">
            <div className="absolute top-4 right-4 bg-purple-100 text-purple-600 text-xs font-semibold px-3 py-1 rounded-full">
              HU-02
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-[#3B82F6] p-3 rounded-xl">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a1a2e]">
                Solicitar Trabajo como Fixer
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Como fixer, recibe notificaciones cuando un requester te solicita un servicio para responder inmediatamente.
            </p>
            <button
              onClick={() => handleTesting('hu02')}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium px-5 py-3 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <span>Ver Solicitudes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* HU03 */}
          <div className="relative bg-white shadow-md rounded-2xl p-8 hover:shadow-lg transition border border-gray-100">
            <div className="absolute top-4 right-4 bg-sky-100 text-sky-600 text-xs font-semibold px-3 py-1 rounded-full">
              HU-03
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-[#3B82F6] p-3 rounded-xl">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a1a2e]">
                Estado de Solicitud
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Como requester, recibe notificaciones cuando el fixer acepte o rechace tu solicitud para mantenerte informado.
            </p>
            <button
              onClick={() => handleTesting('hu03')}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium px-5 py-3 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <span>Ver Estado</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* HU04 */}
          <div className="relative bg-white shadow-md rounded-2xl p-8 hover:shadow-lg transition border border-gray-100">
            <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full">
              HU-04
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-[#3B82F6] p-3 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a1a2e]">
                Gestión de Citas
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Como fixer, recibe notificaciones cuando un requester cancele una cita que habías aceptado para liberar tu agenda.
            </p>
            <button
              onClick={() => handleTesting('hu04')}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium px-5 py-3 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <span>Ver Agenda</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
