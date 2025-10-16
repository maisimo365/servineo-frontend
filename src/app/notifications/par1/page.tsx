// app/page.tsx - VERSION COMPLETA CON BOTÓN ATRÁS IDÉNTICO
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'

// Interfaces y tipos
interface FormData {
  region: string
  numero: string
  nombreRequester: string
  zona: string
  servicio: string
  mensajeUsuario: string
  nombreFixer: string
  trabajaSabado: string
}

interface Solicitud {
  codigoUnico: string
  region: string
  numero: string
  nombreRequester: string
  zona: string
  servicio: string
  descripcion: string
  descripcionTruncada: string
  nombreFixer: string | null
  tieneFixerEspecifico: boolean
  trabajaSabado: boolean
  fechaRegistro: Date
  fechaRegistroStr: string
  fechaEstimada: string
  estado: string
  timestampUnico: string
}

interface FechaHoraRegistro {
  fechaHora: Date
  formato: string
}

interface MensajeAPI {
  number: string
  text: string
}

// Constantes
const SOLICITUDES_KEY = 'solicitudes_registradas'
const ULTIMAS_SOLICITUDES_KEY = 'ultimas_solicitudes'

export default function SistemaSolicitudes() {
  const router = useRouter()
  const [codigoUnico, setCodigoUnico] = useState('-')
  const [estadoSolicitud, setEstadoSolicitud] = useState('-')
  const [fechaRegistro, setFechaRegistro] = useState('-')
  const [fechaEstimada, setFechaEstimada] = useState('-')
  const [mensajeSistema, setMensajeSistema] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [jsonEnviado, setJsonEnviado] = useState('')
  const [respuestaServidor, setRespuestaServidor] = useState('')

  const [formData, setFormData] = useState<FormData>({
    region: '591',
    numero: '69542509',
    nombreRequester: 'Juan Pérez',
    zona: 'La Paz',
    servicio: 'Reparación de laptop',
    mensajeUsuario: 'Necesito reparar la pantalla de mi laptop Dell que se rompió ayer cuando se cayó de la mesa',
    nombreFixer: '',
    trabajaSabado: 'false'
  })

  // Inicializar código único y almacenamiento
  useEffect(() => {
    generarCodigoUnico()
    inicializarAlmacenamiento()
  }, [])

  const inicializarAlmacenamiento = () => {
    if (!localStorage.getItem(SOLICITUDES_KEY)) {
      localStorage.setItem(SOLICITUDES_KEY, JSON.stringify([]))
    }
    if (!localStorage.getItem(ULTIMAS_SOLICITUDES_KEY)) {
      localStorage.setItem(ULTIMAS_SOLICITUDES_KEY, JSON.stringify([]))
    }
  }

  const generarCodigoUnico = (): string => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 11)
    const codigo = `SOL-${timestamp}-${random}`.toUpperCase()
    setCodigoUnico(codigo)
    return codigo
  }

  const obtenerFechaHoraRegistro = (): FechaHoraRegistro => {
    const ahora = new Date()
    const dia = String(ahora.getDate()).padStart(2, '0')
    const mes = String(ahora.getMonth() + 1).padStart(2, '0')
    const anio = ahora.getFullYear()
    const horas = String(ahora.getHours()).padStart(2, '0')
    const minutos = String(ahora.getMinutes()).padStart(2, '0')
    
    return {
      fechaHora: ahora,
      formato: `${dia}/${mes}/${anio} ${horas}:${minutos}`
    }
  }

  const calcularFechaEstimadaRespuesta = (fechaRegistro: Date, trabajaSabado: boolean = false): string => {
    let fecha = new Date(fechaRegistro)
    let diasHabiles = 0
    
    while (diasHabiles < 2) {
      fecha.setDate(fecha.getDate() + 1)
      const diaSemana = fecha.getDay()
      
      if (diaSemana === 0) continue
      if (diaSemana === 6 && !trabajaSabado) continue
      
      diasHabiles++
    }
    
    const dia = String(fecha.getDate()).padStart(2, '0')
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const anio = fecha.getFullYear()
    
    return `${dia}/${mes}/${anio}`
  }

  const truncarDescripcion = (descripcion: string, maxLength: number = 20): string => {
    if (!descripcion || descripcion.trim() === '') {
      return '(sin descripción)'
    }
    
    if (descripcion.length <= maxLength) {
      return descripcion
    }
    
    return descripcion.substring(0, maxLength) + '...'
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const mostrarMensaje = (mensaje: string, tipo: string = 'error', tiempoVisible: number = 0) => {
    setMensajeSistema(mensaje)
    setTipoMensaje(tipo)
    
    if (tiempoVisible > 0) {
      setTimeout(() => {
        setMensajeSistema('')
        setTipoMensaje('')
      }, tiempoVisible)
    }
  }

  const limpiarMensajes = () => {
    setMensajeSistema('')
    setTipoMensaje('')
  }

  // 🔥 FUNCIONES DE VERIFICACIÓN DE DUPLICADOS
  const calcularSimilitud = (str1: string, str2: string): number => {
    if (str1.length === 0 && str2.length === 0) return 1.0;
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    const distance = distanciaLevenshtein(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  const distanciaLevenshtein = (s1: string, s2: string): number => {
    const s1Len = s1.length;
    const s2Len = s2.length;

    // Crear una matriz para almacenar las distancias
    let matrix: number[][] = [];

    // Inicializar la primera columna y la primera fila
    for (let i = 0; i <= s1Len; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2Len; j++) {
      matrix[0][j] = j;
    }

    // Calcular la distancia
    for (let i = 1; i <= s1Len; i++) {
      for (let j = 1; j <= s2Len; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // eliminación
          matrix[i][j - 1] + 1,     // inserción
          matrix[i - 1][j - 1] + cost // sustitución
        );
      }
    }

  return matrix[s1Len][s2Len];
};

  const verificarDuplicados = (solicitud: Solicitud): Solicitud | null => {
    const ultimas24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const solicitudesRecientes = JSON.parse(localStorage.getItem(ULTIMAS_SOLICITUDES_KEY) || '[]')
    
    // Si hay un fixer específico, NO aplicamos verificación de duplicados
    if (solicitud.nombreFixer && solicitud.nombreFixer.trim() !== '') {
      console.log(`Fixer específico "${solicitud.nombreFixer}" detectado - Omite verificación de duplicados`)
      return null
    }
    
    // Solo verificamos duplicados para solicitudes sin fixer específico
    return solicitudesRecientes.find((s: Solicitud) => 
      s.nombreRequester === solicitud.nombreRequester &&
      s.servicio === solicitud.servicio &&
      s.zona === solicitud.zona &&
      // Solo comparar con solicitudes que tampoco tengan fixer específico
      (!s.nombreFixer || s.nombreFixer.trim() === '') &&
      new Date(s.fechaRegistro) > ultimas24Horas &&
      calcularSimilitud(s.descripcion, solicitud.descripcion) > 0.9
    ) || null
  }

  const validarDatos = (): boolean => {
    const camposRequeridos = ['nombreRequester', 'servicio', 'mensajeUsuario']
    return camposRequeridos.every(campo => {
      const valor = formData[campo as keyof FormData]?.toString().trim()
      return valor && valor !== ''
    })
  }

  const prepararSolicitud = (): Solicitud => {
    const fechaRegistroInfo = obtenerFechaHoraRegistro()
    const trabajaSabado = formData.trabajaSabado === 'true'
    const nombreFixer = formData.nombreFixer.trim()
    
    return {
      codigoUnico: codigoUnico,
      region: formData.region,
      numero: formData.numero,
      nombreRequester: formData.nombreRequester,
      zona: formData.zona,
      servicio: formData.servicio,
      descripcion: formData.mensajeUsuario,
      descripcionTruncada: truncarDescripcion(formData.mensajeUsuario),
      nombreFixer: nombreFixer || null,
      tieneFixerEspecifico: !!nombreFixer,
      trabajaSabado: trabajaSabado,
      fechaRegistro: fechaRegistroInfo.fechaHora,
      fechaRegistroStr: fechaRegistroInfo.formato,
      fechaEstimada: calcularFechaEstimadaRespuesta(fechaRegistroInfo.fechaHora, trabajaSabado),
      estado: 'Creada',
      timestampUnico: Date.now() + Math.random().toString(36).substring(2, 11)
    }
  }

  const registrarSolicitud = async (solicitud: Solicitud): Promise<Solicitud> => {
    // Verificar unicidad del código
    const solicitudesExistentes: Solicitud[] = JSON.parse(localStorage.getItem(SOLICITUDES_KEY) || '[]')
    const codigoExiste = solicitudesExistentes.some(s => s.codigoUnico === solicitud.codigoUnico)
    
    if (codigoExiste) {
      const nuevoCodigo = generarCodigoUnico()
      solicitud.codigoUnico = nuevoCodigo
    }

    // Registrar en base de datos
    solicitudesExistentes.push(solicitud)
    localStorage.setItem(SOLICITUDES_KEY, JSON.stringify(solicitudesExistentes))
    
    // Guardar en últimas solicitudes para verificación de duplicados
    const ultimasSolicitudes: Solicitud[] = JSON.parse(localStorage.getItem(ULTIMAS_SOLICITUDES_KEY) || '[]')
    ultimasSolicitudes.push(solicitud)
    
    // Mantener solo las últimas 100 solicitudes para optimizar rendimiento
    if (ultimasSolicitudes.length > 100) {
      ultimasSolicitudes.splice(0, ultimasSolicitudes.length - 100)
    }
    
    localStorage.setItem(ULTIMAS_SOLICITUDES_KEY, JSON.stringify(ultimasSolicitudes))
    
    // Actualizar UI con la información confirmada
    actualizarUI(solicitud)
    
    // Mostrar información específica sobre el fixer en la UI
    if (solicitud.tieneFixerEspecifico) {
      mostrarMensaje(`Solicitud creada con fixer específico: ${solicitud.nombreFixer}`, 'success', 3000)
    }
    
    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return solicitud
  }

  const actualizarUI = (solicitud: Solicitud): void => {
    setEstadoSolicitud(solicitud.estado)
    setFechaRegistro(solicitud.fechaRegistroStr)
    setFechaEstimada(solicitud.fechaEstimada)
    setCodigoUnico(solicitud.codigoUnico)
    
    // Mostrar información del fixer si existe
    if (solicitud.tieneFixerEspecifico) {
      setEstadoSolicitud(`${solicitud.estado} (Fixer: ${solicitud.nombreFixer})`)
    }
  }

  const validarCanal = (numero: string): boolean => {
    const numerosInvalidos = ['123456789', '000000000']
    return !numerosInvalidos.includes(numero)
  }

  const generarMensajeConfirmacion = (solicitud: Solicitud): MensajeAPI => {
    let mensajeBase = `¡Hola ${solicitud.nombreRequester}!\n✅ Tu solicitud ha sido registrada con éxito.\nCódigo: ${solicitud.codigoUnico}\nEstado: ${solicitud.estado}\nTipo de servicio: ${solicitud.servicio}\nDescripción: ${solicitud.descripcionTruncada}\nFecha y hora de registro: ${solicitud.fechaRegistroStr}\nFecha estimada de respuesta: ${solicitud.fechaEstimada}`
    
    // Agregar información del fixer si existe
    if (solicitud.tieneFixerEspecifico) {
      mensajeBase += `\nFixer asignado: ${solicitud.nombreFixer}`
    }
    
    return {
      number: solicitud.region + solicitud.numero,
      text: mensajeBase
    }
  }

  const enviarMensajeAPI = async (mensaje: MensajeAPI, idempotencyKey: string): Promise<string> => {
    try {
      const inicio = Date.now()
      
      // Mostrar JSON que se enviará
      setJsonEnviado(JSON.stringify(mensaje, null, 2))
      
      const res = await fetch("https://n8n-evolution-api.oumu0g.easypanel.host/message/sendText/pruebas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "429683C4C977415CAAFCCE10F7D57E11",
          "Authorization": "Bearer B1719736AF1B-4E77-83D0-DC78E7D578A8",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify(mensaje)
      })

      const tiempoRespuesta = Date.now() - inicio
      const respuesta = await res.text()
      
      setRespuestaServidor(`Código: ${res.status}\nTiempo: ${tiempoRespuesta}ms\n\n${respuesta}`)

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${respuesta}`)
      }

      return respuesta
    } catch (err: any) {
      setRespuestaServidor("Error al enviar: " + err.message)
      throw err
    }
  }

  const enviarMensajes = async (solicitud: Solicitud): Promise<void> => {
    const inicioEnvio = Date.now()
    
    try {
      if (!validarCanal(solicitud.region + solicitud.numero)) {
        throw new Error('El contacto no permite este canal.')
      }

      const mensajeConfirmacion = generarMensajeConfirmacion(solicitud)
      const respuesta = await enviarMensajeAPI(mensajeConfirmacion, solicitud.codigoUnico)
      
      const tiempoEnvio = Date.now() - inicioEnvio
      console.log(`Tiempo de envío: ${tiempoEnvio}ms`)
      
      if (tiempoEnvio > 5000) {
        console.warn('El envío tardó más de 5 segundos')
      }
      
      return
      
    } catch (error: any) {
      // Reintentos
      let intento = 1
      while (intento <= 3) {
        try {
          console.log(`Reintento ${intento}...`)
          await new Promise(resolve => setTimeout(resolve, [5000, 15000, 30000][intento - 1]))
          const mensajeConfirmacion = generarMensajeConfirmacion(solicitud)
          await enviarMensajeAPI(mensajeConfirmacion, solicitud.codigoUnico + '-reintento-' + intento)
          console.log(`Reintento ${intento} exitoso`)
          return
        } catch (errorRetry) {
          console.error(`Reintento ${intento} fallido:`, errorRetry)
          intento++
        }
      }
      
      mostrarMensaje(
        `Solicitud creada (Código ${solicitud.codigoUnico}), pero no pudimos enviar la confirmación. Intenta revisar el estado en la app.`,
        'advertencia'
      )
      throw error
    }
  }

  const procesarSolicitud = async () => {
    setProcesando(true)
    limpiarMensajes()
    setJsonEnviado('')
    setRespuestaServidor('')

    try {
      // 1. Validaciones iniciales
      if (!validarDatos()) {
        throw new Error('Por favor complete todos los campos requeridos')
      }

      // 2. Preparar datos de la solicitud
      const solicitud = prepararSolicitud()
      
      // 3. Verificar duplicados (solo aplica para solicitudes sin fixer específico)
      const duplicado = verificarDuplicados(solicitud)
      if (duplicado) {
        mostrarMensaje(
          `Ya tienes una solicitud similar en curso (Código: ${duplicado.codigoUnico}).`,
          'advertencia'
        )
        setProcesando(false)
        return
      }

      // 4. Registrar solicitud
      const solicitudRegistrada = await registrarSolicitud(solicitud)
      
      // 5. Enviar mensajes SOLO después de confirmar el registro exitoso
      await enviarMensajes(solicitudRegistrada)
      
      mostrarMensaje('✅ Solicitud registrada y mensaje enviado exitosamente!', 'success')
      
    } catch (error: any) {
      mostrarMensaje(error.message, 'error')
    } finally {
      setProcesando(false)
    }
  }

  // Función para volver - usando window.location.href como en el otro código
  const goBack = () => {
    window.location.href = '/servineo';
  }

  return (
    <div className="container" style={{position: 'relative'}}>
      {/* Botón Atrás IDÉNTICO al del otro código */}
      <button
        onClick={goBack}
        className="absolute top-6 left-6 p-3 bg-[#2B3FE0] text-[#2BD0F0] rounded-xl hover:bg-[#1AA7ED] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 z-10"
        title="Atrás"
      >
        <FaArrowLeft className="h-6 w-6" />
        <span className="font-semibold text-lg">Atrás</span>
      </button>

      {/* Header */}
      <div className="header" style={{marginTop: '80px'}}>
        <h1 className="main-title">Sistema de Solicitudes</h1>
        <p className="subtitle">Gestiona solicitudes y comunica con los Fixers fácilmente</p>
      </div>

      {/* Estados del sistema */}
      <div className="status-section">
        <div className="status-item">
          <div className="status-label">Código Único</div>
          <div className="status-value">{codigoUnico}</div>
        </div>
        <div className="status-item">
          <div className="status-label">Estado</div>
          <div className="status-value">{estadoSolicitud}</div>
        </div>
        <div className="status-item">
          <div className="status-label">Fecha Registro</div>
          <div className="status-value">{fechaRegistro}</div>
        </div>
        <div className="status-item">
          <div className="status-label">Fecha Estimada</div>
          <div className="status-value">{fechaEstimada}</div>
        </div>
      </div>

      {/* Mensajes del sistema */}
      {mensajeSistema && (
        <div className={`system-message message-${tipoMensaje}`}>
          {mensajeSistema}
        </div>
      )}

      {/* Formulario de datos del requester */}
      <div className="glass-card">
        <h2 className="card-title">📋 Datos del Requester</h2>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Región</label>
            <input
              type="text"
              id="region"
              value={formData.region}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Ej: 591"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Número</label>
            <input
              type="text"
              id="numero"
              value={formData.numero}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Ej: 69542509"
            />
          </div>
          <div className="form-group" style={{gridColumn: '1 / -1'}}>
            <label className="form-label">Nombre del Cliente *</label>
            <input
              type="text"
              id="nombreRequester"
              value={formData.nombreRequester}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Nombre completo del cliente"
              required
            />
          </div>
          <div className="form-group" style={{gridColumn: '1 / -1'}}>
            <label className="form-label">Zona/Ciudad</label>
            <input
              type="text"
              id="zona"
              value={formData.zona}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Ej: La Paz, Zona Sur"
            />
          </div>
          <div className="form-group" style={{gridColumn: '1 / -1'}}>
            <label className="form-label">Servicio Solicitado *</label>
            <input
              type="text"
              id="servicio"
              value={formData.servicio}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Descripción del servicio requerido"
              required
            />
          </div>
          <div className="form-group" style={{gridColumn: '1 / -1'}}>
            <label className="form-label">Mensaje Adicional *</label>
            <textarea
              id="mensajeUsuario"
              value={formData.mensajeUsuario}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Describe tu problema o requerimiento..."
              rows={4}
              style={{resize: 'vertical', minHeight: '100px'}}
              required
            />
          </div>
        </div>
      </div>

      {/* Información del Fixer */}
      <div className="glass-card">
        <h2 className="card-title">👨‍💼 Datos del Fixer</h2>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nombre del Fixer (opcional)</label>
            <input
              type="text"
              id="nombreFixer"
              value={formData.nombreFixer}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Dejar vacío para asignación automática"
            />
            <small style={{color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px'}}>
              ⚠️ Si asignas un fixer específico, se omitirá la verificación de duplicados
            </small>
          </div>
          <div className="form-group">
            <label className="form-label">¿Trabaja Sábado?</label>
            <select
              id="trabajaSabado"
              value={formData.trabajaSabado}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botón de acción */}
      <div style={{textAlign: 'center', marginTop: '2rem'}}>
        <button 
          onClick={procesarSolicitud}
          disabled={procesando}
          className="button"
          style={{minWidth: '200px'}}
        >
          {procesando ? '⏳ Procesando...' : '🚀 Registrar Solicitud'}
        </button>
      </div>

      {/* Debug información - JSON enviado y respuesta */}
      {(jsonEnviado || respuestaServidor) && (
        <div className="glass-card">
          <h2 className="card-title">🔧 Información de Debug</h2>
          <div className="form-grid">
            {jsonEnviado && (
              <div className="form-group" style={{gridColumn: '1 / -1'}}>
                <label className="form-label">JSON Enviado:</label>
                <pre style={{
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  overflow: 'auto',
                  fontSize: '0.9rem',
                  color: '#e2e8f0'
                }}>
                  {jsonEnviado}
                </pre>
              </div>
            )}
            {respuestaServidor && (
              <div className="form-group" style={{gridColumn: '1 / -1'}}>
                <label className="form-label">Respuesta del Servidor:</label>
                <pre style={{
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  overflow: 'auto',
                  fontSize: '0.9rem',
                  color: '#e2e8f0'
                }}>
                  {respuestaServidor}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}