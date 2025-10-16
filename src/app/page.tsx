'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Bell, CheckCircle, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleIngresar = () => {
    // Navegar a la página principal de Servineo
    router.push('/servineo');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 relative overflow-hidden font-roboto">
      {/* Importar Roboto desde Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
      `}</style>
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-[#2B31E0]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#2BDDE0]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-[#5E2BE0]/10 rounded-full blur-3xl"></div>
        
        {/* Círculos flotantes */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-[#2B31E0]/20 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Card principal */}
      <div 
        className={`relative bg-white rounded-2xl shadow-lg max-w-2xl w-full p-8 transition-all duration-500 border border-[#D1D5DB] ${
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="relative space-y-8">
          {/* Logo/Título */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-[#111827] tracking-tight">
              SERVINEO
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-1 w-12 bg-[#2B31E0] rounded-full"></div>
              <p className="text-base text-[#64748B] font-medium">
                entorno de simulación para pruebas de notificaciones
              </p>
              <div className="h-1 w-12 bg-[#2B31E0] rounded-full"></div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-[#E5E7EB] rounded-xl p-6 border border-[#D1D5DB]">
            <p className="text-[#111827] text-center leading-relaxed text-base font-normal">
              Esta plataforma permite <span className="font-medium text-[#2B31E0]">simular, probar y validar</span> el envío de notificaciones 
              entre requesters y fixers en un entorno controlado. Su objetivo es garantizar 
              la correcta comunicación, trazabilidad y funcionamiento de los mensajes 
              antes de ser implementados en producción.
            </p>
          </div>

          {/* Features rápidos */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#2B31E0] rounded-xl p-4 text-white text-center shadow-sm hover:bg-[#2B6AE0] transition-colors duration-300">
              <Bell className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs font-medium">Notificaciones en Tiempo Real</p>
            </div>
            <div className="bg-[#2B31E0] rounded-xl p-4 text-white text-center shadow-sm hover:bg-[#2B6AE0] transition-colors duration-300">
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs font-medium">Validación Completa</p>
            </div>
            <div className="bg-[#2B31E0] rounded-xl p-4 text-white text-center shadow-sm hover:bg-[#2B6AE0] transition-colors duration-300">
              <Shield className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs font-medium">Entorno Seguro</p>
            </div>
          </div>

          {/* Botón de ingreso */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleIngresar}
              className="group relative px-10 py-4 bg-[#2B31E0] text-white text-lg font-bold rounded-lg shadow-sm hover:bg-[#2B6AE0] active:scale-98 transition-all duration-300"
            >
              <span className="relative flex items-center gap-2">
                INGRESAR
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>
          </div>

          {/* Footer info */}
          <div className="text-center pt-4">
            <p className="text-sm text-[#64748B] font-normal">
              Desarrollado por <span className="font-medium text-[#2B31E0]">Byteboys</span> · v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
