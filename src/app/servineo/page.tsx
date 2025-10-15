'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Wrench, Bell, Calendar, Sparkles } from 'lucide-react';

export default function ServineoPage() {
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrollY(window.pageYOffset);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGoBack = () => {
    window.location.href = '/';
  };

  const handleOpenTest = (huId: string) => {
    const routes: Record<string, string> = {
      'hu01': 'hu01-testing.html',
      'hu02': 'hu02-testing.html',
      'hu03': 'hu03-testing.html',
      'hu04': 'hu04-testing.html'
    };
    
    alert(`Abriendo testing para ${huId.toUpperCase()}...\n\nRuta: ${routes[huId]}`);
  };

  const cards = [
    {
      id: 'hu01',
      badge: 'HU-01',
      icon: CheckCircle,
      title: 'Registrar Solicitud de Servicio',
      description: 'Como requester, completa el formulario para solicitar servicio y recibe confirmación inmediata de tu solicitud.',
      buttonText: 'Solicitar Servicio',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      id: 'hu02',
      badge: 'HU-02',
      icon: Wrench,
      title: 'Solicitar Trabajo como Fixer',
      description: 'Como fixer, recibe notificaciones cuando un requester te solicita un servicio para responder inmediatamente.',
      buttonText: 'Ver Solicitudes',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      id: 'hu03',
      badge: 'HU-03',
      icon: Bell,
      title: 'Estado de Solicitud',
      description: 'Como requester, recibe notificaciones cuando el Fixer acepte o rechace tu solicitud para mantenerte informado.',
      buttonText: 'Ver Estado',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'hu04',
      badge: 'HU-04',
      icon: Calendar,
      title: 'Gestión de Citas',
      description: 'Como fixer, recibe notificaciones cuando un Requester cancele una cita que habías aceptado para liberar tu agenda.',
      buttonText: 'Ver Agenda',
      gradient: 'from-indigo-500 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Navbar mejorado */}
      <nav className="relative bg-white/80 backdrop-blur-xl px-8 py-5 shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex-1">
            <button
              onClick={handleGoBack}
              className="group flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-[#2B31E0] to-[#5E2BE0] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/50 hover:-translate-x-1 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
              <span>Volver</span>
            </button>
          </div>
          
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-black bg-gradient-to-r from-[#2B31E0] via-purple-600 to-[#2BDDE0] bg-clip-text text-transparent tracking-wider flex items-center justify-center gap-2">
              SERVINEO
            </h1>
          </div>
          
          <div className="flex-1 flex items-center justify-end gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75 animate-pulse"></div>
              <div className="relative w-14 h-14 bg-gradient-to-br from-[#2B31E0] to-[#5E2BE0] rounded-full flex items-center justify-center text-white font-bold shadow-xl transition-transform duration-300 hover:scale-110 cursor-pointer">
                <span className="text-sm">BB</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="font-bold text-gray-800">Byteboys</div>
              <div className="text-sm text-gray-500 flex items-center gap-1">
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section mejorado */}
      <div 
        className="relative text-center px-5 py-16 transition-all duration-300"
        style={{
          transform: `translateY(${scrollY * 0.3}px)`,
          opacity: Math.max(0.3, 1 - (scrollY / 600))
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-purple-100/30 to-cyan-100/50 backdrop-blur-sm"></div>
        
        <div className="relative z-10">
          <div className="inline-block mb-4 px-6 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-purple-200">
            <span className="text-sm font-semibold text-purple-600">✨ Plataforma de Servicios Confiable</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-[#2B31E0] via-purple-600 to-[#2BDDE0] bg-clip-text text-transparent mb-6 leading-tight">
            SERVINEO
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Encuentra servicios o ofrece tus habilidades en nuestra plataforma segura y confiable
          </p>
        </div>
      </div>

      {/* Cards Grid mejorado */}
      <div className="relative max-w-7xl mx-auto px-5 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`group relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl transition-all duration-500 border border-gray-200/50
                  hover:scale-105 hover:-translate-y-3 hover:shadow-2xl hover:shadow-purple-500/30
                  ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{
                  transitionDelay: mounted ? `${index * 150}ms` : '0ms'
                }}
              >
                {/* Borde animado con gradiente */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-xl -z-10`}></div>
                <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r ${card.gradient}`}></div>
                
                <div className="space-y-6">
                  {/* Header con icono y badge */}
                  <div className="flex items-center justify-between">
                    <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                      <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>
                    </div>
                    
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r ${card.gradient} text-white shadow-md`}>
                      {card.badge}
                    </div>
                  </div>
                  
                  {/* Título */}
                  <h3 className="text-2xl font-bold text-gray-800 leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                    {card.title}
                  </h3>
                  
                  {/* Descripción */}
                  <p className="text-gray-600 leading-relaxed text-base">
                    {card.description}
                  </p>
                  
                  {/* Botón mejorado */}
                  <button
                    onClick={() => handleOpenTest(card.id)}
                    className={`w-full py-4 bg-gradient-to-r ${card.gradient} text-white rounded-xl text-lg font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg
                      hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50
                      active:scale-95 group/btn relative overflow-hidden`}
                  >
                    <span className="relative z-10">{card.buttonText}</span>
                    <ArrowLeft className="w-5 h-5 rotate-180 transition-transform duration-300 group-hover/btn:translate-x-1 relative z-10" />
                    
                    {/* Efecto de brillo en hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700"></div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer decorativo */}
      <div className="relative mt-20 py-8 text-center text-gray-600">
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent backdrop-blur-sm"></div>
        <p className="relative z-10 font-medium">Desarrollado por Byteboys</p>
      </div>
    </div>
  );
}