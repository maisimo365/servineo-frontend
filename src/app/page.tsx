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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Círculos flotantes */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-white/20 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Card principal */}
      <div 
        className={`relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full p-12 transition-all duration-700 ${
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Brillo decorativo en el borde */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse"></div>
        
        <div className="relative space-y-8">
          {/* Logo/Título */}
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
              SERVINEO
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
              <p className="text-lg text-blue-600 font-semibold">
                entorno de simulación para pruebas de notificaciones
              </p>
              <div className="h-1 w-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-inner">
            <p className="text-gray-700 text-center leading-relaxed text-lg">
              Esta plataforma permite <span className="font-bold text-blue-600">simular, probar y validar</span> el envío de notificaciones 
              entre requesters y fixers en un entorno controlado. Su objetivo es garantizar 
              la correcta comunicación, trazabilidad y funcionamiento de los mensajes 
              antes de ser implementados en producción.
            </p>
          </div>

          {/* Features rápidos */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white text-center shadow-lg hover:scale-105 transition-transform duration-300">
              <Bell className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Notificaciones en Tiempo Real</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white text-center shadow-lg hover:scale-105 transition-transform duration-300">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Validación Completa</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-4 text-white text-center shadow-lg hover:scale-105 transition-transform duration-300">
              <Shield className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Entorno Seguro</p>
            </div>
          </div>

          {/* Botón de ingreso */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleIngresar}
              className="group relative px-12 py-5 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
            >
              {/* Efecto de brillo deslizante */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <span className="relative flex items-center gap-3">
                INGRESAR
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </button>
          </div>

          {/* Footer info */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Desarrollado por <span className="font-bold text-blue-600">Byteboys</span> · v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Decoración inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500"></div>
    </div>
  );
}