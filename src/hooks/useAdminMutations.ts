import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  crearUsuario, 
  crearTrabajador, 
  crearCliente, 
  crearPrestamo,
  type Usuario,
  type Trabajador,
  type Cliente,
  type Prestamo
} from '../config/api';

// Hook para crear administrador
export const useCreateUsuario = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: crearUsuario,
    onSuccess: (data) => {
      // Invalidar y refrescar queries relacionadas si las hay
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      console.log('✅ Administrador creado exitosamente:', {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        fecha: data.created_at
      });
    },
    onError: (error: any) => {
      console.error('❌ Error creando administrador:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
    },
  });
};

// Hook para crear trabajador
export const useCreateTrabajador = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: crearTrabajador,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trabajadores'] });
      console.log('✅ Trabajador creado exitosamente:', {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        phone: data.phone,
        fecha: data.created_at
      });
    },
    onError: (error: any) => {
      console.error('❌ Error creando trabajador:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
    },
  });
};

// Hook para crear cliente
export const useCreateCliente = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: crearCliente,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      console.log('✅ Cliente creado exitosamente:', {
        id: data.id,
        nombre: data.nombre,
        telefono: data.telefono,
        trabajador_id: data.trabajador_id,
        fecha: data.created_at
      });
    },
    onError: (error: any) => {
      console.error('❌ Error creando cliente:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
    },
  });
};

// Hook para crear préstamo
export const useCreatePrestamo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: crearPrestamo,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
      console.log('✅ Préstamo creado exitosamente:', {
        id: data.id,
        monto: data.monto,
        cliente_id: data.cliente_id,
        trabajador_id: data.trabajador_id,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        pago_diario: data.pago_diario,
        es_registro_manual: data.es_registro_manual,
        fecha: data.created_at
      });
    },
    onError: (error: any) => {
      console.error('❌ Error creando préstamo:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
    },
  });
};

// Hook para el registro masivo completo
export const useBulkRegistration = () => {
  const createUsuario = useCreateUsuario();
  const createTrabajador = useCreateTrabajador();
  const createCliente = useCreateCliente();
  const createPrestamo = useCreatePrestamo();

  const executeBulkRegistration = async (data: {
    admin: Usuario;
    trabajadores: Array<Trabajador & { clientes: Array<Cliente & { prestamo: Prestamo }> }>;
  }) => {
    try {
      console.log('🚀 Iniciando registro masivo...');
      
      // 1. Crear el administrador
      console.log('📝 Paso 1/4: Creando administrador...');
      const adminCreado = await createUsuario.mutateAsync(data.admin);
      console.log('✅ Administrador creado exitosamente:', adminCreado.nombre);

      const resultados = [];
      let totalTrabajadores = data.trabajadores.length;
      let totalClientesEsperados = data.trabajadores.reduce((total, t) => total + t.clientes.length, 0);

      // 2. Crear trabajadores y sus clientes
      console.log(`👷 Paso 2/4: Creando ${totalTrabajadores} trabajador(es)...`);
      
      for (let i = 0; i < data.trabajadores.length; i++) {
        const trabajadorData = data.trabajadores[i];
        const { clientes, ...trabajadorInfo } = trabajadorData;
        
        console.log(`   Creando trabajador ${i + 1}/${totalTrabajadores}: ${trabajadorInfo.nombre}...`);
        
        // Asignar el ID del admin creado al trabajador
        trabajadorInfo.usuario_id = adminCreado.id!;
        
        const trabajadorCreado = await createTrabajador.mutateAsync(trabajadorInfo);
        console.log(`   ✅ Trabajador "${trabajadorCreado.nombre}" creado exitosamente`);

        const clientesCreados = [];

        // 3. Crear clientes del trabajador
        console.log(`👥 Paso 3/4: Creando ${clientes.length} cliente(s) para ${trabajadorCreado.nombre}...`);
        
        for (let j = 0; j < clientes.length; j++) {
          const clienteData = clientes[j];
          const { prestamo, ...clienteInfo } = clienteData;
          
          console.log(`      Creando cliente ${j + 1}/${clientes.length}: ${clienteInfo.nombre}...`);
          
          // Asignar el ID del trabajador creado al cliente
          clienteInfo.trabajador_id = trabajadorCreado.id!;
          
          const clienteCreado = await createCliente.mutateAsync(clienteInfo);
          console.log(`      ✅ Cliente "${clienteCreado.nombre}" creado exitosamente`);

          // 4. Crear préstamo del cliente
          console.log(`💰 Paso 4/4: Creando préstamo para ${clienteCreado.nombre}...`);
          const prestamoData = {
            ...prestamo,
            cliente_id: clienteCreado.id!,
            trabajador_id: trabajadorCreado.id!,
          };

          const prestamoCreado = await createPrestamo.mutateAsync(prestamoData);
          console.log(`      ✅ Préstamo de $${prestamoCreado.monto} creado exitosamente (${prestamoCreado.es_registro_manual ? 'Histórico' : 'Futuro'})`);

          clientesCreados.push({
            cliente: clienteCreado,
            prestamo: prestamoCreado,
          });
        }

        resultados.push({
          trabajador: trabajadorCreado,
          clientes: clientesCreados,
        });
        
        console.log(`✅ Completado trabajador ${i + 1}/${totalTrabajadores} con ${clientesCreados.length} cliente(s)`);
      }

      console.log('🎉 ¡Registro masivo completado exitosamente!');
      console.log(`📊 Resumen final: 1 admin, ${totalTrabajadores} trabajadores, ${totalClientesEsperados} clientes y préstamos`);

      return {
        admin: adminCreado,
        trabajadores: resultados,
      };
    } catch (error: any) {
      console.error('❌ Error crítico en registro masivo:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack
      });
      throw error;
    }
  };

  return {
    executeBulkRegistration,
    isLoading: 
      createUsuario.isPending || 
      createTrabajador.isPending || 
      createCliente.isPending || 
      createPrestamo.isPending,
    error: 
      createUsuario.error || 
      createTrabajador.error || 
      createCliente.error || 
      createPrestamo.error,
  };
}; 