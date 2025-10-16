// types.ts
export interface Fixer {
  fixerNombre: string;
  fixerProfesion: string;
  fixerTelefono: string;
}

export interface ClientData {
  telefonoCliente: string;
  nombreCliente: string;
  descripcion: string;
}

export interface HistoryItemProps {
  status: string;
  title: string;
  fixer: string;
  date: string;
}

export interface ParsedSolicitud {
  fixer: string;
  cliente: string;
  descripcion: string;
  fecha: string;
}

// Estados iniciales
export const initialFixerState: Fixer = {
  fixerNombre: "María Fixer",
  fixerProfesion: "Técnico",
  fixerTelefono: "59169542509",
};

export const initialClientState: ClientData = {
  telefonoCliente: "59133344455",
  nombreCliente: "Juan Requester",
  descripcion: "Reparación urgente de equipo TV en oficina 3B.",
};