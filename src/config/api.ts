import axios from 'axios';

// const API_BASE_URL = 'http://localhost:3000/admin-panel';
const API_BASE_URL = 'https://prestamos-back.onrender.com/admin-panel';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Exportar tipos por separado para mejor compatibilidad
export type Usuario = {
  id?: number;
  email: string;
  nombre: string;
  role: string;
  password: string;
  status?: string;
  auth_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type Trabajador = {
  id?: number;
  nombre: string;
  email: string;
  usuario_id?: number;
  status?: string;
  phone: string;
  auth_id?: string;
  password: string;
  created_at?: string;
  updated_at?: string;
};

export type Cliente = {
  id?: number;
  nombre: string;
  telefono: string;
  direccion: string;
  ocupacion: string;
  trabajador_id: number;
  created_at?: string;
  updated_at?: string;
};

export type Prestamo = {
  id?: number;
  cliente_id: number;
  trabajador_id: number;
  monto: number;
  interes: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string;
  observaciones?: string;
  pago_diario: number;
  es_registro_manual?: boolean;
  created_at?: string;
  updated_at?: string;
};

// Funciones de API - usando las nuevas rutas del admin panel
export const crearUsuario = async (usuario: Usuario): Promise<Usuario> => {
  const response = await api.post('/admin', usuario);
  return response.data.user;
};

export const crearTrabajador = async (trabajador: Trabajador): Promise<Trabajador> => {
  const response = await api.post('/trabajador', trabajador);
  return response.data.trabajador;
};

export const crearCliente = async (cliente: Cliente): Promise<Cliente> => {
  const response = await api.post('/cliente', cliente);
  return response.data.client;
};

export const crearPrestamo = async (prestamo: Prestamo): Promise<Prestamo> => {
  const response = await api.post('/prestamo', prestamo);
  return response.data.loan;
}; 