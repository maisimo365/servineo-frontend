// app/page.tsx

'use client'; 

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// Define la interfaz para el estado de los datos del formulario
interface FormData {
    nombreFixer: string;
    regionTelefono: string;
    numeroTelefono: string; 
    nombreRequester: string;
    titulo: string;
    descripcion: string;
    enlace: string;
}

// ----------------------------------------------------------------------
// CONFIGURACIÓN FIJA DE EVOLUTION API
// ----------------------------------------------------------------------
const EVOLUTION_API_URL = 'https://n8n-evolution-api.oumu0g.easypanel.host';
const EVOLUTION_INSTANCE_NAME = 'pruebas';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const ENDPOINT = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;

/**
 * Función que realiza la llamada a la Evolution API.
 */
async function sendWhatsAppMessage(formData: FormData) {
    
    const fullPhoneNumber = formData.regionTelefono + formData.numeroTelefono;
    
    // genera id de cita
    function generarIDUnico() {
        return 'CITA-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
    const IDunico = generarIDUnico();

    // genera fecha
    function obtenerFechaHora() {
        return new Date().toLocaleString(); // Ej: "15/10/2025 18:45"
    }
    const fechaHora = obtenerFechaHora();

    const destinationNumber = fullPhoneNumber.replace('+', ''); 

    const whatsappMessage = `
CANCELACIÓN DE SOLICITUD

Hola ${formData.nombreFixer}👋
Lamentamos infomarte que ${formData.nombreRequester} cancelo su cita con ID: ${IDunico}
🔧Título de Solicitud: ${formData.titulo}
Descripción: ${formData.descripcion}
Estado actual: Cancelada
Fecha y hora: ${fechaHora}

Enlace: ${formData.enlace || 'N/A'}
    `.trim();
    
    const evolutionPayload = {
        number: destinationNumber, 
        text: whatsappMessage,
    };
    
    console.log('--- Payload enviado a Evolution API ---');
    console.log('Endpoint:', ENDPOINT);
    console.log('Destinatario:', destinationNumber);
    console.log('Datos:', JSON.stringify(evolutionPayload));
    
    if (!destinationNumber) {
        return { success: false, message: 'El número de teléfono del Fixer es obligatorio.' };
    }

    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY, 
            },
            body: JSON.stringify(evolutionPayload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Evolution API Error:', response.status, errorText);
            return { 
                success: false, 
                message: `Error ${response.status} de la Evolution API. Revisa la consola y tu instancia.`, 
                details: errorText 
            };
        }

        const data = await response.json();
        return { success: true, message: '✅ Mensaje de WhatsApp enviado con éxito al Fixer.', data };
        
    } catch (error) {
        console.error('Error de red/servidor al conectar con Evolution API:', error);
        return { success: false, message: '❌ Error de conexión (red o CORS). Verifica que tu servidor esté accesible.' };
    }
}

// ----------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------
export default function Home() {
    
    const router = useRouter();

    const [formData, setFormData] = useState<FormData>({
        nombreFixer: '',
        regionTelefono: '',
        numeroTelefono: '',
        nombreRequester: '',
        titulo: '',
        descripcion: '',
        enlace: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting || !formData.regionTelefono || !formData.numeroTelefono) {
             alert('Por favor, completa los campos de Teléfono del Fixer.');
             return;
        }

        setIsSubmitting(true);
        const result = await sendWhatsAppMessage(formData);
        
        if (result.success) {
            alert(result.message);
        } else {
            console.error('Fallo en el envío:', result.details || result.message);
            alert(`Fallo en el envío: ${result.message}`);
        }

        setIsSubmitting(false);
    };

    const handleGoHome = () => {
        router.push('/'); // Navega a la página principal
    };

    return (
        <main className="flex min-h-screen items-start justify-center p-4 sm:p-8 bg-gray-50 relative">
            
            <div className="w-full max-w-xl mx-auto my-8 p-6 sm:p-8 bg-white shadow-2xl rounded-xl border border-gray-100">
                <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b pb-2">
                    Cancelación de Solicitud
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Sección Fixer */}
                    <fieldset className="border border-indigo-200 p-4 rounded-lg space-y-4">
                        <legend className="px-2 text-indigo-600 font-semibold text-lg">
                            Datos del Fixer (Destinatario de WhatsApp)
                        </legend>
                        
                        <div className="flex flex-col">
                            <label htmlFor="nombreFixer" className="mb-1 font-medium text-gray-700">Nombre Fixer:</label>
                            <input
                                type="text"
                                id="nombreFixer"
                                name="nombreFixer"
                                value={formData.nombreFixer}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                required
                            />
                        </div>
                        
                        <div className="flex space-x-4">
                            <div className="flex flex-col w-1/4">
                                <label htmlFor="regionTelefono" className="mb-1 font-medium text-gray-700">Región:</label>
                                <input
                                    type="text"
                                    id="regionTelefono"
                                    name="regionTelefono"
                                    value={formData.regionTelefono}
                                    onChange={handleChange}
                                    placeholder="+XX"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                    required
                                />
                            </div>
                            <div className="flex flex-col w-3/4">
                                <label htmlFor="numeroTelefono" className="mb-1 font-medium text-gray-700">Número de Teléfono:</label>
                                <input
                                    type="tel"
                                    id="numeroTelefono"
                                    name="numeroTelefono"
                                    value={formData.numeroTelefono}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                    required
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Sección Requester y Solicitud */}
                    <fieldset className="border border-purple-200 p-4 rounded-lg space-y-4">
                        <legend className="px-2 text-purple-600 font-semibold text-lg">
                            Datos del Requester y Solicitud
                        </legend>
                        
                        <div className="flex flex-col">
                            <label htmlFor="nombreRequester" className="mb-1 font-medium text-gray-700">Nombre Requester:</label>
                            <input
                                type="text"
                                id="nombreRequester"
                                name="nombreRequester"
                                value={formData.nombreRequester}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150"
                                required
                            />
                        </div>
                        
                        <div className="flex flex-col">
                            <label htmlFor="titulo" className="mb-1 font-medium text-gray-700">Título:</label>
                            <input
                                type="text"
                                id="titulo"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150"
                                required
                            />
                        </div>
                        
                        <div className="flex flex-col">
                            <label htmlFor="descripcion" className="mb-1 font-medium text-gray-700">Descripción:</label>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150"
                                required
                            />
                        </div>
                        
                        <div className="flex flex-col">
                            <label htmlFor="enlace" className="mb-1 font-medium text-gray-700">Enlace (URL):</label>
                            <input
                                type="url"
                                id="enlace"
                                name="enlace"
                                value={formData.enlace}
                                onChange={handleChange}
                                placeholder="https://ejemplo.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150"
                            />
                        </div>
                    </fieldset>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </form>
            </div>

            {/* Botón flotante para volver a la página principal */}
            <button
                onClick={handleGoHome}
                className="fixed bottom-6 right-6 bg-indigo-600 text-white font-bold py-3 px-5 rounded-full shadow-lg hover:bg-indigo-700 transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
                Volver a Principal
            </button>
        </main>
    )
}