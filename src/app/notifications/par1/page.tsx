// app/page.tsx - VERSION CON VALIDACIÓN DE 8 DÍGITOS Y REINTENTOS CONDICIONALES
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa'

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
  estadoSolicitud: string
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

interface LogReintento {
  intento: number
  timestamp: Date
  tiempoEspera: number
  resultado: string
  tiempoRespuesta?: number
  error?: string
}

interface LogVerificacion {
  timestamp: Date
  tipo: 'verificacion_duplicado' | 'registro_exitoso' | 'error'
  codigoSolicitud: string
  nombreFixer: string
  servicio: string
  mensaje: string
  datosComparados: {
    fixer: string
    servicio: string
    nombreCliente: string
  }
}

// NUEVA INTERFACE PARA ERROR DE CANAL
interface ErrorCanal {
  tipo: 'sin_whatsapp' | 'opt_out' | 'canal_invalido' | 'numero_invalido'
  mensaje: string
  numero: string
}

// Constantes
const SOLICITUDES_KEY = 'solicitudes_registradas'
const ULTIMAS_SOLICITUDES_KEY = 'ultimas_solicitudes'
const LOGS_VERIFICACION_KEY = 'logs_verificacion_duplicados'

export default function SistemaSolicitudes() {
  const router = useRouter()
  const [codigoUnico, setCodigoUnico] = useState('-')
  const [estadoSolicitud, setEstadoSolicitud] = useState('-')
  const [estadoSolicitudPendiente, setEstadoSolicitudPendiente] = useState('') // CAMBIO: Inicialmente vacío
  const [fechaRegistro, setFechaRegistro] = useState('-')
  const [fechaEstimada, setFechaEstimada] = useState('-')
  const [mensajeSistema, setMensajeSistema] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [jsonEnviado, setJsonEnviado] = useState('')
  const [respuestaServidor, setRespuestaServidor] = useState('')
  const [logsReintentos, setLogsReintentos] = useState<LogReintento[]>([])
  const [duplicadoDetectado, setDuplicadoDetectado] = useState<{encontrado: boolean, codigo: string, datos: any} | null>(null)
  const [solicitudCreada, setSolicitudCreada] = useState(false) // NUEVO: Estado para controlar si se ha creado la solicitud

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

  // SOLO inicializar almacenamiento, NO generar código
  useEffect(() => {
    inicializarAlmacenamiento()
  }, [])

  const inicializarAlmacenamiento = () => {
    if (!localStorage.getItem(SOLICITUDES_KEY)) {
      localStorage.setItem(SOLICITUDES_KEY, JSON.stringify([]))
    }
    if (!localStorage.getItem(ULTIMAS_SOLICITUDES_KEY)) {
      localStorage.setItem(ULTIMAS_SOLICITUDES_KEY, JSON.stringify([]))
    }
    if (!localStorage.getItem(LOGS_VERIFICACION_KEY)) {
      localStorage.setItem(LOGS_VERIFICACION_KEY, JSON.stringify([]))
    }
  }

  // FUNCIÓN: Guardar log de verificación
  const guardarLogVerificacion = (log: LogVerificacion) => {
    try {
      const logsExistentes: LogVerificacion[] = JSON.parse(localStorage.getItem(LOGS_VERIFICACION_KEY) || '[]')
      logsExistentes.push(log)
      
      // Mantener solo los últimos 500 logs para optimizar rendimiento
      if (logsExistentes.length > 500) {
        logsExistentes.splice(0, logsExistentes.length - 500)
      }
      
      localStorage.setItem(LOGS_VERIFICACION_KEY, JSON.stringify(logsExistentes))
      console.log('Log de verificación guardado:', log)
    } catch (error) {
      console.error('Error al guardar log de verificación:', error)
    }
  }

  // FUNCIÓN MEJORADA: Verificar duplicados por fixer y servicio
  const verificarDuplicadoFixerServicio = (nombreFixer: string, servicio: string): {encontrado: boolean, codigo: string, solicitud: Solicitud | null} => {
    if (!nombreFixer || nombreFixer.trim() === '') {
      return { encontrado: false, codigo: '', solicitud: null }
    }

    const solicitudesExistentes: Solicitud[] = JSON.parse(localStorage.getItem(SOLICITUDES_KEY) || '[]')
    const ultimas24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Buscar solicitudes con el mismo fixer y servicio en las últimas 24 horas
    const duplicado = solicitudesExistentes.find((solicitud: Solicitud) => {
      const mismaFecha = new Date(solicitud.fechaRegistro) > ultimas24Horas
      const mismoFixer = solicitud.nombreFixer?.toLowerCase().trim() === nombreFixer.toLowerCase().trim()
      const mismoServicio = solicitud.servicio.toLowerCase().trim() === servicio.toLowerCase().trim()
      
      return mismaFecha && mismoFixer && mismoServicio
    })

    // Guardar log de la verificación
    guardarLogVerificacion({
      timestamp: new Date(),
      tipo: duplicado ? 'verificacion_duplicado' : 'registro_exitoso',
      codigoSolicitud: duplicado?.codigoUnico || 'N/A',
      nombreFixer: nombreFixer,
      servicio: servicio,
      mensaje: duplicado 
        ? `Se detectó duplicado con código: ${duplicado.codigoUnico}`
        : 'No se encontraron duplicados',
      datosComparados: {
        fixer: nombreFixer,
        servicio: servicio,
        nombreCliente: formData.nombreRequester
      }
    })

    return {
      encontrado: !!duplicado,
      codigo: duplicado?.codigoUnico || '',
      solicitud: duplicado || null
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

  // FUNCIÓN MODIFICADA: Validar canal WhatsApp SOLO para números de 8 dígitos
  const validarCanal = (numero: string): {valido: boolean, error?: ErrorCanal, requiereReintentos?: boolean} => {
    // Limpiar número (solo dígitos)
    const numeroLimpio = numero.replace(/\D/g, '')
    
    // Casos que ACTIVAN REINTENTOS
    if (!numeroLimpio || numeroLimpio.trim() === '') {
      return {
        valido: false,
        error: {
          tipo: 'numero_invalido',
          mensaje: 'Número no puede estar vacío',
          numero: numero
        },
        requiereReintentos: true // ✅ ACTIVA REINTENTOS
      }
    }
    
    if (numeroLimpio.length < 8) {
      return {
        valido: false,
        error: {
          tipo: 'numero_invalido',
          mensaje: 'Número debe tener al menos 8 dígitos',
          numero: numero
        },
        requiereReintentos: true // ✅ ACTIVA REINTENTOS
      }
    }
    
    if (numeroLimpio.length > 8) {
      return {
        valido: false,
        error: {
          tipo: 'numero_invalido', 
          mensaje: 'Número no puede tener más de 8 dígitos',
          numero: numero
        },
        requiereReintentos: true // ✅ ACTIVA REINTENTOS
      }
    }
    
    // SOLO para números de exactamente 8 dígitos: validar WhatsApp
    if (numeroLimpio.length === 8) {
      // Simulación de detección de números sin WhatsApp
      const numerosSinWhatsApp = ['77480958', '77400598', '77400998', '77400508']
      
      if (numerosSinWhatsApp.includes(numeroLimpio)) {
        return {
          valido: false,
          error: {
            tipo: 'sin_whatsapp',
            mensaje: 'El contacto no permite este canal',
            numero: numeroLimpio
          },
          requiereReintentos: false // ❌ NO ACTIVA REINTENTOS
        }
      }
      
      const numerosInvalidos = ['123456789', '000000000']
      if (numerosInvalidos.includes(numeroLimpio)) {
        return {
          valido: false,
          error: {
            tipo: 'canal_invalido',
            mensaje: 'Número sin WhatsApp',
            numero: numeroLimpio
          },
          requiereReintentos: false // ❌ NO ACTIVA REINTENTOS
        }
      }
    }
    
    // Número válido de 8 dígitos con WhatsApp
    return { 
      valido: true,
      requiereReintentos: true // ✅ ACTIVA REINTENTOS para envío normal
    }
  }

  // FUNCIÓN: Detectar errores de canal desde respuesta
  const detectarErrorCanalDesdeRespuesta = (respuestaError: string): {mensaje: string, requiereReintentos: boolean} => {
    if (respuestaError.includes('exists') && respuestaError.includes('false')) {
      return {
        mensaje: 'El contacto no permite este canal',
        requiereReintentos: false
      }
    }
    
    if (respuestaError.includes('sin WhatsApp') || respuestaError.includes('no tiene WhatsApp')) {
      return {
        mensaje: 'Número sin WhatsApp',
        requiereReintentos: false
      }
    }
    
    if (respuestaError.includes('opt-out') || respuestaError.includes('opt out')) {
      return {
        mensaje: 'Usuario ha optado por no recibir mensajes',
        requiereReintentos: false
      }
    }
    
    // Para otros errores 400, activar reintentos
    return {
      mensaje: 'Error en el envío del mensaje',
      requiereReintentos: true
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))

    // Verificar duplicados en tiempo real cuando se modifica fixer o servicio
    if ((id === 'nombreFixer' || id === 'servicio') && value.trim() !== '') {
      const nombreFixer = id === 'nombreFixer' ? value : formData.nombreFixer
      const servicio = id === 'servicio' ? value : formData.servicio
      
      if (nombreFixer.trim() !== '' && servicio.trim() !== '') {
        const resultado = verificarDuplicadoFixerServicio(nombreFixer, servicio)
        if (resultado.encontrado) {
          setDuplicadoDetectado({
            encontrado: true,
            codigo: resultado.codigo,
            datos: resultado.solicitud
          })
        } else {
          setDuplicadoDetectado(null)
        }
      }
    }
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
    setDuplicadoDetectado(null)
  }

  // FUNCIONES DE VERIFICACIÓN DE DUPLICADOS ORIGINAL
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

    let matrix: number[][] = [];

    for (let i = 0; i <= s1Len; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2Len; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s1Len; i++) {
      for (let j = 1; j <= s2Len; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[s1Len][s2Len];
  };

  const verificarDuplicados = (solicitud: Solicitud): Solicitud | null => {
    const ultimas24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const solicitudesRecientes = JSON.parse(localStorage.getItem(ULTIMAS_SOLICITUDES_KEY) || '[]')
    
    // Si hay un fixer específico, aplicar la nueva verificación
    if (solicitud.nombreFixer && solicitud.nombreFixer.trim() !== '') {
      const resultado = verificarDuplicadoFixerServicio(solicitud.nombreFixer, solicitud.servicio)
      if (resultado.encontrado) {
        return resultado.solicitud
      }
      return null
    }
    
    // Verificación original para solicitudes sin fixer específico
    return solicitudesRecientes.find((s: Solicitud) => 
      s.nombreRequester === solicitud.nombreRequester &&
      s.servicio === solicitud.servicio &&
      s.zona === solicitud.zona &&
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
    
    const codigoGenerado = generarCodigoUnico()
    
    return {
      codigoUnico: codigoGenerado,
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
      estadoSolicitud: 'Pendiente',
      timestampUnico: Date.now() + Math.random().toString(36).substring(2, 11)
    }
  }

  const registrarSolicitud = async (solicitud: Solicitud): Promise<Solicitud> => {
    const solicitudesExistentes: Solicitud[] = JSON.parse(localStorage.getItem(SOLICITUDES_KEY) || '[]')
    const codigoExiste = solicitudesExistentes.some(s => s.codigoUnico === solicitud.codigoUnico)
    
    if (codigoExiste) {
      const nuevoCodigo = generarCodigoUnico()
      solicitud.codigoUnico = nuevoCodigo
    }

    solicitudesExistentes.push(solicitud)
    localStorage.setItem(SOLICITUDES_KEY, JSON.stringify(solicitudesExistentes))
    
    const ultimasSolicitudes: Solicitud[] = JSON.parse(localStorage.getItem(ULTIMAS_SOLICITUDES_KEY) || '[]')
    ultimasSolicitudes.push(solicitud)
    
    if (ultimasSolicitudes.length > 100) {
      ultimasSolicitudes.splice(0, ultimasSolicitudes.length - 100)
    }
    
    localStorage.setItem(ULTIMAS_SOLICITUDES_KEY, JSON.stringify(ultimasSolicitudes))
    
    // Guardar log de registro exitoso
    guardarLogVerificacion({
      timestamp: new Date(),
      tipo: 'registro_exitoso',
      codigoSolicitud: solicitud.codigoUnico,
      nombreFixer: solicitud.nombreFixer || 'Sin fixer específico',
      servicio: solicitud.servicio,
      mensaje: `Solicitud registrada exitosamente - ${solicitud.codigoUnico}`,
      datosComparados: {
        fixer: solicitud.nombreFixer || 'Sin fixer específico',
        servicio: solicitud.servicio,
        nombreCliente: solicitud.nombreRequester
      }
    })
    
    actualizarUI(solicitud)
    
    if (solicitud.tieneFixerEspecifico) {
      mostrarMensaje(`Solicitud creada con fixer específico: ${solicitud.nombreFixer}`, 'success', 3000)
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return solicitud
  }

  const actualizarUI = (solicitud: Solicitud): void => {
    setEstadoSolicitud(solicitud.estado)
    setEstadoSolicitudPendiente(solicitud.estadoSolicitud) // Aquí se actualiza a "Pendiente"
    setFechaRegistro(solicitud.fechaRegistroStr)
    setFechaEstimada(solicitud.fechaEstimada)
    setCodigoUnico(solicitud.codigoUnico)
    setSolicitudCreada(true) // CAMBIO: Marcar que la solicitud se ha creado
    
    if (solicitud.tieneFixerEspecifico) {
      setEstadoSolicitud(`${solicitud.estado} (Fixer: ${solicitud.nombreFixer})`)
    }
  }

  const generarMensajeConfirmacion = (solicitud: Solicitud): MensajeAPI => {
    let mensajeBase = `¡Hola ${solicitud.nombreRequester}!\n✅ Tu solicitud ha sido registrada con éxito.\nCódigo: ${solicitud.codigoUnico}\nEstado: ${solicitud.estado}\nTipo de servicio: ${solicitud.servicio}\nDescripción: ${solicitud.descripcionTruncada}\nFecha y hora de registro: ${solicitud.fechaRegistroStr}\nFecha estimada de respuesta: ${solicitud.fechaEstimada}\nSolicitud: ${solicitud.estadoSolicitud}`
    
    if (solicitud.tieneFixerEspecifico) {
      mensajeBase += `\nFixer asignado: ${solicitud.nombreFixer}`
    }
    
    return {
      number: solicitud.region + solicitud.numero,
      text: mensajeBase
    }
  }

  const agregarLogReintento = (intento: number, tiempoEspera: number, resultado: string, tiempoRespuesta?: number, error?: string) => {
    const nuevoLog: LogReintento = {
      intento,
      timestamp: new Date(),
      tiempoEspera,
      resultado,
      tiempoRespuesta,
      error
    }
    
    setLogsReintentos(prev => [...prev, nuevoLog])
    
    const tiempoFormateado = new Date().toLocaleTimeString()
    const logEntry = `[${tiempoFormateado}] Intento ${intento}: ${resultado} (Espera: ${tiempoEspera}ms${tiempoRespuesta ? `, Respuesta: ${tiempoRespuesta}ms` : ''}${error ? `, Error: ${error}` : ''})`
    
    setRespuestaServidor(prev => prev ? prev + '\n' + logEntry : logEntry)
  }

  const enviarMensajeAPI = async (mensaje: MensajeAPI, idempotencyKey: string): Promise<{respuesta: string, tiempoRespuesta: number}> => {
    const inicio = Date.now()
    
    try {
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
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${respuesta}`)
      }

      return { respuesta, tiempoRespuesta }
    } catch (err: any) {
      const tiempoRespuesta = Date.now() - inicio
      throw new Error(`Error al enviar: ${err.message} (Tiempo: ${tiempoRespuesta}ms)`)
    }
  }

  // FUNCIÓN MODIFICADA: enviarMensajes con reintentos condicionales
  // FUNCIÓN CORREGIDA: enviarMensajes con reintentos condicionales
const enviarMensajes = async (solicitud: Solicitud): Promise<void> => {
  const inicioEnvio = Date.now()
  
  try {
    // Validar el canal ANTES de intentar el envío
    const validacionCanal = validarCanal(solicitud.numero)
    
    if (!validacionCanal.valido) {
      const mensajeError = validacionCanal.error?.mensaje || 'Error de validación del número'
      
      agregarLogReintento(1, 0, `❌ VALIDACIÓN FALLIDA: ${mensajeError}`)
      
      // Si requiere reintentos, LANZAR ERROR para activar el flujo de reintentos
      if (validacionCanal.requiereReintentos) {
        agregarLogReintento(1, 0, `⚠️ Número inválido pero se activarán reintentos`)
        // Lanzar error para que entre en el catch y active los reintentos
        throw new Error(`Validación fallida: ${mensajeError}`)
      } else {
        // No requiere reintentos (errores de WhatsApp)
        mostrarMensaje(`✅ Solicitud registrada (${solicitud.codigoUnico}), pero ${mensajeError.toLowerCase()}`, 'advertencia')
        
        guardarLogVerificacion({
          timestamp: new Date(),
          tipo: 'error',
          codigoSolicitud: solicitud.codigoUnico,
          nombreFixer: solicitud.nombreFixer || 'Sin fixer específico',
          servicio: solicitud.servicio,
          mensaje: `Error de canal: ${mensajeError} - Número: ${solicitud.numero}`,
          datosComparados: {
            fixer: solicitud.nombreFixer || 'Sin fixer específico',
            servicio: solicitud.servicio,
            nombreCliente: solicitud.nombreRequester
          }
        })
        return // Detener el proceso aquí para errores de WhatsApp
      }
    }

    // Si el canal es válido, proceder con el envío normal
    const mensajeConfirmacion = generarMensajeConfirmacion(solicitud)
    
    agregarLogReintento(1, 0, 'Iniciando envío...')
    const { respuesta, tiempoRespuesta } = await enviarMensajeAPI(mensajeConfirmacion, solicitud.codigoUnico)
    
    agregarLogReintento(1, 0, '✅ ENVÍO EXITOSO', tiempoRespuesta)
    
    const tiempoEnvio = Date.now() - inicioEnvio
    console.log(`Tiempo de envío: ${tiempoEnvio}ms`)
    
    mostrarMensaje('✅ Solicitud registrada y mensaje enviado exitosamente!', 'success')
    return
    
  } catch (error: any) {
    // MANEJO MEJORADO DE ERRORES CON REINTENTOS CONDICIONALES
    
    // Si es un error de validación que requiere reintentos, proceder con reintentos
    if (error.message.includes('Validación fallida:')) {
      agregarLogReintento(1, 0, `❌ ERROR VALIDACIÓN: ${error.message}`)
      // Continuar al flujo de reintentos
    }
    else if (error.message.includes('400') || error.message.includes('Bad Request')) {
      const deteccionError = detectarErrorCanalDesdeRespuesta(error.message)
      
      agregarLogReintento(1, 0, `❌ ERROR 400: ${deteccionError.mensaje}`)
      
      if (!deteccionError.requiereReintentos) {
        // No requiere reintentos (errores de WhatsApp)
        mostrarMensaje(`✅ Solicitud registrada (${solicitud.codigoUnico}), pero ${deteccionError.mensaje.toLowerCase()}`, 'advertencia')
        return
      }
      
      // Si requiere reintentos, continuar al flujo de reintentos
      agregarLogReintento(1, 0, `⚠️ Error 400 pero se reintentará`)
    } else {
      agregarLogReintento(1, 0, '❌ FALLÓ', undefined, error.message)
    }
    
    // FLUJO DE REINTENTOS (5s, 15s, 30s) - PARA TODOS LOS ERRORES QUE LLEGAN AQUÍ
    let intento = 2
    const tiemposEspera = [5000, 15000, 30000]
    
    while (intento <= 4) {
      const tiempoEspera = tiemposEspera[intento - 2]
      
      try {
        agregarLogReintento(intento, tiempoEspera, `⏳ Esperando ${tiempoEspera}ms para reintento...`)
        
        await new Promise(resolve => setTimeout(resolve, tiempoEspera))
        
        agregarLogReintento(intento, tiempoEspera, '🔄 Realizando reintento...')
        
        // En cada reintento, validar nuevamente el canal
        if (intento === 2) { // Solo en el primer reintento validar
          const validacionReintento = validarCanal(solicitud.numero)
          if (!validacionReintento.valido && !validacionReintento.requiereReintentos) {
            // Si en el reintento detectamos error de WhatsApp, salir
            agregarLogReintento(intento, tiempoEspera, `❌ CANAL INVÁLIDO EN REINTENTO: ${validacionReintento.error?.mensaje}`)
            mostrarMensaje(`✅ Solicitud registrada (${solicitud.codigoUnico}), pero ${validacionReintento.error?.mensaje?.toLowerCase()}`, 'advertencia')
            return
          }
        }
        
        const mensajeConfirmacion = generarMensajeConfirmacion(solicitud)
        const { respuesta, tiempoRespuesta } = await enviarMensajeAPI(mensajeConfirmacion, solicitud.codigoUnico + '-reintento-' + (intento - 1))
        
        agregarLogReintento(intento, tiempoEspera, '✅ REINTENTO EXITOSO', tiempoRespuesta)
        
        console.log(`Reintento ${intento - 1} exitoso`)
        mostrarMensaje('✅ Solicitud registrada y mensaje enviado exitosamente!', 'success')
        return
        
      } catch (errorRetry: any) {
        agregarLogReintento(intento, tiempoEspera, `❌ REINTENTO FALLIDO`, undefined, errorRetry.message)
        
        console.error(`Reintento ${intento - 1} fallido:`, errorRetry)
        intento++
      }
    }
    
    // Si todos los reintentos fallaron
    const tiempoTotal = Date.now() - inicioEnvio
    const mensajeError = `Solicitud creada (Código ${solicitud.codigoUnico}), pero no pudimos enviar la confirmación después de 3 reintentos. Tiempo total: ${tiempoTotal}ms. Intenta revisar el estado en la app.`
    
    agregarLogReintento(0, tiempoTotal, `💥 TODOS LOS REINTENTOS FALLARON`, undefined, mensajeError)
    
    mostrarMensaje(mensajeError, 'advertencia')
    throw new Error(mensajeError)
  }
}

  const procesarSolicitud = async () => {
    setProcesando(true)
    limpiarMensajes()
    setJsonEnviado('')
    setRespuestaServidor('')
    setLogsReintentos([])

    try {
      // 1. Validaciones iniciales
      if (!validarDatos()) {
        throw new Error('Por favor complete todos los campos requeridos')
      }

      // 2. Verificación específica por fixer y servicio
      if (formData.nombreFixer.trim() !== '') {
        const resultadoDuplicado = verificarDuplicadoFixerServicio(formData.nombreFixer, formData.servicio)
        if (resultadoDuplicado.encontrado) {
          throw new Error(`🚫 Ya existe un registro con el mismo Fixer y Servicio. Código del registro existente: ${resultadoDuplicado.codigo}`)
        }
      }

      // 3. Preparar datos de la solicitud
      const solicitud = prepararSolicitud()
      
      // 4. Verificar duplicados (para casos sin fixer específico)
      const duplicado = verificarDuplicados(solicitud)
      if (duplicado) {
        mostrarMensaje(
          `Ya tienes una solicitud similar en curso (Código: ${duplicado.codigoUnico}).`,
          'advertencia'
        )
        setProcesando(false)
        return
      }

      // 5. Registrar solicitud
      const solicitudRegistrada = await registrarSolicitud(solicitud)
      
      // 6. Intentar enviar mensajes (manejará internamente los errores de canal y reintentos)
      await enviarMensajes(solicitudRegistrada)
      
    } catch (error: any) {
      mostrarMensaje(error.message, 'error')
    } finally {
      setProcesando(false)
    }
  }

  const formatearLogsReintentos = (): string => {
    if (logsReintentos.length === 0) return ''
    
    return logsReintentos.map(log => {
      const tiempo = log.timestamp.toLocaleTimeString()
      const base = `[${tiempo}] Intento ${log.intento}: ${log.resultado}`
      const detalles = []
      
      if (log.tiempoEspera > 0) {
        detalles.push(`Espera: ${log.tiempoEspera}ms`)
      }
      if (log.tiempoRespuesta) {
        detalles.push(`Respuesta: ${log.tiempoRespuesta}ms`)
      }
      if (log.error) {
        detalles.push(`Error: ${log.error}`)
      }
      
      return detalles.length > 0 ? `${base} (${detalles.join(', ')})` : base
    }).join('\n')
  }

  const goBack = () => {
    window.location.href = '/servineo';
  }

  return (
    <div className="container" style={{position: 'relative'}}>
      {/* Botón Atrás */}
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

      {/* Alerta de duplicado detectado en tiempo real */}
      {duplicadoDetectado && duplicadoDetectado.encontrado && (
        <div className="system-message message-advertencia" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          color: '#92400e'
        }}>
          <FaExclamationTriangle className="h-5 w-5" />
          <div>
            <strong>⚠️ Duplicado detectado:</strong> Ya existe un registro con el mismo Fixer y Servicio. 
            <br />
            <strong>Código del registro existente:</strong> {duplicadoDetectado.codigo}
          </div>
        </div>
      )}

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
        
        {/* CAMBIO: Solo mostrar Solicitud cuando se haya creado */}
        {solicitudCreada && (
          <div className="status-item">
            <div className="status-label">Solicitud</div>
            <div className="status-value" style={{color: '#fbbf24', fontWeight: 'bold'}}>
              {estadoSolicitudPendiente}
            </div>
          </div>
        )}
        
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
            <label className="form-label">Número *</label>
            <input
              type="text"
              id="numero"
              value={formData.numero}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Ej: 69542509 (8 dígitos)"
              required
            />
            <small style={{color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px'}}> 
              <br />
              <br />
            </small>
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
              ⚠️ Si asignas un fixer específico, se verificará por duplicados de fixer y servicio
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
          disabled={procesando || (duplicadoDetectado ? duplicadoDetectado.encontrado : false)}
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
            
            {logsReintentos.length > 0 && (
              <div className="form-group" style={{gridColumn: '1 / -1'}}>
                <label className="form-label">📊 Logs de Reintentos:</label>
                <div style={{
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  overflow: 'auto',
                  fontSize: '0.85rem',
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '300px'
                }}>
                  {formatearLogsReintentos()}
                </div>
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
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '300px'
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