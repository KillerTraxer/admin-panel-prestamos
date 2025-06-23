import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, Trash2, AlertCircle, CheckCircle, Calculator, Loader2, Calendar } from 'lucide-react';
import { useBulkRegistration } from '../hooks/useAdminMutations';
import moment from 'moment-timezone';

const trabajadorSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Teléfono requerido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
});

const prestamoSchema = z.object({
  monto: z.number().min(1000, 'Monto mínimo $1,000'),
  plazo: z.enum(['15', '20', '23', '28'], {
    errorMap: () => ({ message: 'Selecciona un plazo válido' })
  }),
  observaciones: z.string().optional(),
  useCustomStartDate: z.boolean().optional(),
  customStartDate: z.string().optional(),
});

const clienteSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  telefono: z.string().min(10, 'Teléfono requerido'),
  direccion: z.string().min(1, 'Dirección requerida'),
  ocupacion: z.string().min(2, 'Ocupación requerida'),
  prestamo: prestamoSchema,
});

const bulkRegistrationSchema = z.object({
  admin: z.object({
    nombre: z.string().min(2, 'Nombre del admin requerido'),
    email: z.string().email('Email del admin inválido'),
    password: z.string().min(6, 'Contraseña del admin mínimo 6 caracteres'),
  }),
  trabajadores: z.array(trabajadorSchema.extend({
    clientes: z.array(clienteSchema)
  })).min(1, 'Al menos un trabajador requerido'),
});

type BulkRegistrationData = z.infer<typeof bulkRegistrationSchema>;

interface BulkRegistrationProps {
  onLoadingChange: (loading: boolean) => void;
}

const BulkRegistration: React.FC<BulkRegistrationProps> = ({ onLoadingChange }) => {
  const [registrationResults, setRegistrationResults] = useState<any>(null);
  const bulkRegistration = useBulkRegistration();

  // Función de cálculo exacta de la app original
  const calculateLoanDetails = (monto: number, plazo: string) => {
    const amount = monto || 0;
    const duration = parseInt(plazo) || 15;

    // Tabla de cuotas diarias totales por cada $1,000 prestados (igual que en la app)
    const cuotaDiariaPorMil = {
      15: 92,
      20: 65,
      23: 60,
    };

    const blocksDeMil = amount / 1000;

    if (duration === 28) {
      // NUEVA lógica para 4 semanas: 350 por semana × 4 semanas
      const weeklyPayment = 350 * blocksDeMil;
      const totalPayment = weeklyPayment * 4;
      const totalInterest = totalPayment - amount;
      const interestRate = totalInterest / amount;
      const weeklyFine = 120 * blocksDeMil; // Multa semanal: 120 por cada $1000

      return {
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        dailyPayment: Math.round((totalPayment / 28) * 100) / 100, // aproximado diario para compatibilidad
        weeklyPayment: Math.round(weeklyPayment * 100) / 100, // pago semanal real
        interestRate: Math.round(interestRate * 10000) / 10000,
        finePerDay: Math.round(weeklyFine / 7), // aproximado diario para compatibilidad
        weeklyFine: Math.round(weeklyFine) // multa semanal real
      };
    }

    const cuotaPorMil = cuotaDiariaPorMil[duration as keyof typeof cuotaDiariaPorMil];
    if (!cuotaPorMil) {
      return {
        totalInterest: 0,
        totalPayment: 0,
        dailyPayment: 0,
        weeklyPayment: 0,
        interestRate: 0,
        finePerDay: 0,
        weeklyFine: 0
      };
    }

    const dailyPayment = blocksDeMil * cuotaPorMil;
    const totalPayment = dailyPayment * duration;
    const totalInterest = totalPayment - amount;
    const interestRate = totalInterest / amount; // Tasa de interés como decimal
    const finePerDay = Math.round(amount / 1000 * 20); // $20 por cada $1000

    return {
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      dailyPayment: Math.round(dailyPayment * 100) / 100,
      weeklyPayment: Math.round(dailyPayment * 7 * 100) / 100, // para otros plazos, semanal = diario × 7
      interestRate: Math.round(interestRate * 10000) / 10000, // 4 decimales
      finePerDay,
      weeklyFine: Math.round(finePerDay * 7) // para otros plazos, semanal = diario × 7
    };
  };

  // Función para formatear números con comas (igual que en la app)
  const formatNumberWithCommas = (number: string | number) => {
    const parts = number.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<BulkRegistrationData>({
    resolver: zodResolver(bulkRegistrationSchema),
    defaultValues: {
      admin: {
        nombre: '',
        email: '',
        password: ''
      },
      trabajadores: [
        {
          nombre: '',
          email: '',
          phone: '',
          password: '',
          clientes: [
            {
              nombre: '',
              telefono: '',
              direccion: '',
              ocupacion: '',
              prestamo: {
                monto: 1000,
                plazo: '15',
                observaciones: '',
                useCustomStartDate: false,
                customStartDate: moment.tz('America/Mexico_City').format('YYYY-MM-DD')
              }
            }
          ]
        }
      ]
    }
  });

  const {
    fields: trabajadoresFields,
    append: appendTrabajador,
    remove: removeTrabajador
  } = useFieldArray({
    control,
    name: "trabajadores"
  });

  const addTrabajador = () => {
    appendTrabajador({
      nombre: '',
      email: '',
      phone: '',
      password: '',
      clientes: [
        {
          nombre: '',
          telefono: '',
          direccion: '',
          ocupacion: '',
          prestamo: {
            monto: 1000,
            plazo: '15',
            observaciones: '',
            useCustomStartDate: false,
            customStartDate: moment.tz('America/Mexico_City').format('YYYY-MM-DD')
          }
        }
      ]
    });
  };

  const onSubmit = async (data: BulkRegistrationData) => {
    try {
      onLoadingChange(true);

      // Validar que no haya emails vacíos antes del envío
      if (!data.admin.email || data.admin.email.trim() === '') {
        alert('❌ Error de validación\n\nEl email del administrador es requerido.');
        onLoadingChange(false);
        return;
      }

      for (let i = 0; i < data.trabajadores.length; i++) {
        if (!data.trabajadores[i].email || data.trabajadores[i].email.trim() === '') {
          alert(`❌ Error de validación\n\nEl email del trabajador ${i + 1} (${data.trabajadores[i].nombre || 'Sin nombre'}) es requerido.`);
          onLoadingChange(false);
          return;
        }
      }

      // Preparar datos para el hook de bulk registration
      const bulkData = {
        admin: {
          nombre: data.admin.nombre.trim(),
          email: data.admin.email.trim(),
          password: data.admin.password,
          role: 'admin' as const
        },
        trabajadores: data.trabajadores.map(trabajadorData => ({
          nombre: trabajadorData.nombre.trim(),
          email: trabajadorData.email.trim(),
          phone: trabajadorData.phone.trim(),
          password: trabajadorData.password,
          status: 'active' as const,
          clientes: trabajadorData.clientes.map(clienteData => {
            const loanDetails = calculateLoanDetails(clienteData.prestamo.monto, clienteData.prestamo.plazo);

            // Determinar la fecha de inicio usando horario de México
            let fechaInicio: moment.Moment;
            if (clienteData.prestamo.useCustomStartDate && clienteData.prestamo.customStartDate) {
              // Usar la fecha personalizada
              fechaInicio = moment.tz(clienteData.prestamo.customStartDate, 'America/Mexico_City');
            } else {
              // Obtener ahora en hora de Ciudad de México y usar mañana como fecha de inicio
              const mexicoNow = moment.tz('America/Mexico_City');
              fechaInicio = mexicoNow.clone().add(1, 'day');
            }

            // Calcular la fecha de fin (siempre automática basada en duración)
            const fechaFin = fechaInicio.clone().add(parseInt(clienteData.prestamo.plazo) - 1, 'days');

            // Calcular si es_registro_manual basado en si el préstamo está en el rango futuro
            const mexicoToday = moment.tz('America/Mexico_City').startOf('day');
            const fechaFinMoment = fechaFin.clone().startOf('day');

            // Si la fecha de fin del préstamo es posterior a hoy, es un préstamo futuro (false)
            // Si la fecha de fin ya pasó, es un registro histórico (true)
            const isHistoricalRecord = fechaFinMoment.isBefore(mexicoToday);

            return {
              nombre: clienteData.nombre,
              telefono: clienteData.telefono,
              direccion: clienteData.direccion,
              ocupacion: clienteData.ocupacion,
              trabajador_id: 0, // Se asignará automáticamente en el hook
              prestamo: {
                cliente_id: 0, // Se asignará automáticamente en el hook
                trabajador_id: 0, // Se asignará automáticamente en el hook
                monto: clienteData.prestamo.monto,
                interes: loanDetails.interestRate,
                fecha_inicio: fechaInicio.format('YYYY-MM-DD'),
                fecha_fin: fechaFin.format('YYYY-MM-DD'),
                pago_diario: clienteData.prestamo.plazo === '28' ? loanDetails.weeklyPayment : loanDetails.dailyPayment,
                observaciones: clienteData.prestamo.observaciones || '',
                es_registro_manual: isHistoricalRecord,
                estado: 'activo' as const,
                plazo_cuatro_semanas: clienteData.prestamo.plazo === '28'
              }
            };
          })
        }))
      };

      const results = await bulkRegistration.executeBulkRegistration(bulkData);

      // Preparar resultados para mostrar
      const displayResults = {
        admin: results.admin,
        trabajadores: results.trabajadores,
        totalClientes: results.trabajadores.reduce((total, t) => total + t.clientes.length, 0),
        totalPrestamos: results.trabajadores.reduce((total, t) => total + t.clientes.length, 0)
      };

      setRegistrationResults(displayResults);

      // Alerta de éxito detallada
      const successMessage = `🎉 ¡Registro masivo completado exitosamente!\n\n` +
        `📊 RESUMEN DE CREACIÓN:\n` +
        `👤 Administrador: ${results.admin.nombre} (${results.admin.email})\n` +
        `👷 Trabajadores creados: ${results.trabajadores.length}\n` +
        `👥 Clientes creados: ${displayResults.totalClientes}\n` +
        `💰 Préstamos creados: ${displayResults.totalPrestamos}\n\n` +
        `📋 DETALLE POR TRABAJADOR:\n` +
        results.trabajadores.map((t, index) =>
          `${index + 1}. ${t.trabajador.nombre} - ${t.clientes.length} cliente(s)`
        ).join('\n') +
        `\n\n✅ Todos los datos han sido guardados correctamente en el sistema.`;

      alert(successMessage);
      reset();
    } catch (error: any) {
      console.error('Error en el registro masivo:', error);

      // Alertas específicas según el tipo de error
      if (error?.response?.data?.error) {
        const errorMsg = error.response.data.error;
        const errorDetails = error.response.data.details || error.response.data.message;

        if (errorMsg.includes('ya registrado') || errorMsg.includes('already exists')) {
          alert(`❌ Email duplicado detectado\n\n` +
            `Uno de los emails que ingresó ya está registrado en el sistema.\n` +
            `Detalles: ${errorDetails}\n\n` +
            `Por favor, verifique todos los emails e inténtelo nuevamente.`);
        } else if (errorMsg.includes('Auth') || errorMsg.includes('autenticación')) {
          alert(`❌ Error de autenticación\n\n` +
            `Hubo un problema con el sistema de autenticación durante el registro.\n` +
            `Detalles: ${errorDetails}\n\n` +
            `Por favor, inténtelo nuevamente.`);
        } else if (errorMsg.includes('validation') || errorMsg.includes('validación') || errorMsg.includes('requerido')) {
          alert(`❌ Error de validación\n\n` +
            `Algunos datos no cumplen con los requisitos:\n` +
            `${errorDetails}\n\n` +
            `Por favor, verifique todos los campos y corríjalos.`);
        } else {
          alert(`❌ Error durante el registro masivo\n\n` +
            `Error: ${errorMsg}\n` +
            `${errorDetails ? `Detalles: ${errorDetails}\n` : ''}` +
            `\n⚠️ IMPORTANTE: Es posible que algunos registros se hayan creado parcialmente.\n` +
            `Verifique el estado del sistema antes de intentar nuevamente.`);
        }
      } else if (error?.message) {
        if (error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
          alert(`❌ Error de conexión\n\n` +
            `No se pudo conectar con el servidor durante el registro masivo.\n` +
            `Verifique su conexión a internet y que el servidor esté funcionando.\n\n` +
            `⚠️ IMPORTANTE: Es posible que algunos registros se hayan creado parcialmente.\n` +
            `Error técnico: ${error.message}`);
        } else if (error.message.includes('timeout')) {
          alert(`❌ Tiempo de espera agotado\n\n` +
            `El registro masivo tardó demasiado tiempo en completarse.\n` +
            `Esto puede ser debido a la cantidad de datos o problemas de conectividad.\n\n` +
            `⚠️ IMPORTANTE: Es posible que algunos registros se hayan creado parcialmente.\n` +
            `Por favor, verifique el estado y reinténtelo con menos datos.`);
        } else {
          alert(`❌ Error inesperado\n\n` +
            `Mensaje: ${error.message}\n\n` +
            `⚠️ IMPORTANTE: Es posible que algunos registros se hayan creado parcialmente.\n` +
            `Verifique el estado del sistema antes de intentar nuevamente.`);
        }
      } else {
        alert(`❌ Error desconocido en registro masivo\n\n` +
          `Ocurrió un error inesperado durante el proceso de registro masivo.\n` +
          `⚠️ IMPORTANTE: Es posible que algunos registros se hayan creado parcialmente.\n\n` +
          `Recomendaciones:\n` +
          `• Verifique si algunos datos fueron creados\n` +
          `• Revise los emails para duplicados\n` +
          `• Inténtelo nuevamente con menos datos\n` +
          `• Contacte al soporte técnico si persiste`);
      }
    } finally {
      onLoadingChange(false);
    }
  };

  const watchedData = watch();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <Users className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-lg font-medium text-gray-900">
            Registro Masivo de Datos
          </h2>
        </div>

        {registrationResults && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Registro masivo completado exitosamente
                </h3>
                <div className="text-sm text-green-700 mt-1">
                  <p>• Admin creado: {registrationResults.admin?.nombre}</p>
                  <p>• Trabajadores creados: {registrationResults.trabajadores?.length}</p>
                  <p>• Clientes creados: {registrationResults.totalClientes}</p>
                  <p>• Préstamos creados: {registrationResults.totalPrestamos}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {bulkRegistration.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error en el registro masivo
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {bulkRegistration.error?.message || 'Error desconocido en el registro masivo'}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Sección del Admin */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Datos del Administrador
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  {...register('admin.nombre')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del admin"
                />
                {errors.admin?.nombre && (
                  <p className="text-red-600 text-sm mt-1">{errors.admin.nombre.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...register('admin.email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@ejemplo.com"
                />
                {errors.admin?.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.admin.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  {...register('admin.password')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contraseña"
                />
                {errors.admin?.password && (
                  <p className="text-red-600 text-sm mt-1">{errors.admin.password.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sección de Trabajadores */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Trabajadores y sus Clientes
              </h3>
              <button
                type="button"
                onClick={addTrabajador}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Trabajador
              </button>
            </div>

            {trabajadoresFields.map((trabajador, trabajadorIndex) => (
              <TrabajadorSection
                key={trabajador.id}
                trabajadorIndex={trabajadorIndex}
                register={register}
                control={control}
                errors={errors}
                onRemove={() => removeTrabajador(trabajadorIndex)}
                canRemove={trabajadoresFields.length > 1}
                watchedData={watchedData}
                calculateLoanDetails={calculateLoanDetails}
                formatNumberWithCommas={formatNumberWithCommas}
              />
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={bulkRegistration.isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {bulkRegistration.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{bulkRegistration.isLoading ? 'Procesando...' : 'Crear Registro Masivo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente para cada trabajador y sus clientes
const TrabajadorSection: React.FC<{
  trabajadorIndex: number;
  register: any;
  control: any;
  errors: any;
  onRemove: () => void;
  canRemove: boolean;
  watchedData: any;
  calculateLoanDetails: (monto: number, plazo: string) => any;
  formatNumberWithCommas: (number: string | number) => string;
}> = ({ trabajadorIndex, register, control, errors, onRemove, canRemove, watchedData, calculateLoanDetails, formatNumberWithCommas }) => {
  const {
    fields: clientesFields,
    append: appendCliente,
    remove: removeCliente
  } = useFieldArray({
    control,
    name: `trabajadores.${trabajadorIndex}.clientes`
  });

  const addCliente = () => {
    appendCliente({
      nombre: '',
      telefono: '',
      direccion: '',
      ocupacion: '',
      prestamo: {
        monto: 1000,
        plazo: '15',
        observaciones: '',
        useCustomStartDate: false,
        customStartDate: moment.tz('America/Mexico_City').format('YYYY-MM-DD')
      }
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-medium text-gray-900">
          Trabajador #{trabajadorIndex + 1}
        </h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Datos del trabajador */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            {...register(`trabajadores.${trabajadorIndex}.nombre`)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="Nombre trabajador"
          />
          {errors.trabajadores?.[trabajadorIndex]?.nombre && (
            <p className="text-red-600 text-sm mt-1">
              {errors.trabajadores[trabajadorIndex].nombre.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            {...register(`trabajadores.${trabajadorIndex}.email`)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="trabajador@ejemplo.com"
          />
          {errors.trabajadores?.[trabajadorIndex]?.email && (
            <p className="text-red-600 text-sm mt-1">
              {errors.trabajadores[trabajadorIndex].email.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="text"
            {...register(`trabajadores.${trabajadorIndex}.phone`)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="5551234567"
            maxLength={10}
          />
          {errors.trabajadores?.[trabajadorIndex]?.phone && (
            <p className="text-red-600 text-sm mt-1">
              {errors.trabajadores[trabajadorIndex].phone.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            {...register(`trabajadores.${trabajadorIndex}.password`)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="Contraseña"
          />
          {errors.trabajadores?.[trabajadorIndex]?.password && (
            <p className="text-red-600 text-sm mt-1">
              {errors.trabajadores[trabajadorIndex].password.message}
            </p>
          )}
        </div>
      </div>

      {/* Clientes del trabajador */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-medium text-gray-700">
            Clientes ({clientesFields.length})
          </h5>
          <button
            type="button"
            onClick={addCliente}
            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
          >
            <Plus className="h-3 w-3 mr-1" />
            Agregar Cliente
          </button>
        </div>

        {clientesFields.map((cliente, clienteIndex) => (
          <div key={cliente.id} className="bg-white border border-gray-200 rounded p-3">
            <div className="flex justify-between items-start mb-3">
              <h6 className="text-sm font-medium text-gray-800">
                Cliente #{clienteIndex + 1}
              </h6>
              {clientesFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCliente(clienteIndex)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  {...register(`trabajadores.${trabajadorIndex}.clientes.${clienteIndex}.nombre`)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre cliente"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  {...register(`trabajadores.${trabajadorIndex}.clientes.${clienteIndex}.telefono`)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5551234567"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  {...register(`trabajadores.${trabajadorIndex}.clientes.${clienteIndex}.direccion`)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección completa"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Ocupación
                </label>
                <input
                  type="text"
                  {...register(`trabajadores.${trabajadorIndex}.clientes.${clienteIndex}.ocupacion`)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ocupación"
                />
              </div>
            </div>

            {/* Datos del préstamo */}
            <div className="bg-blue-50 p-3 rounded">
              <h6 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                <Calculator className="h-3 w-3 mr-1" />
                Datos del Préstamo
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Monto ($)
                  </label>
                  <input
                    type="number"
                    {...register(`trabajadores.${trabajadorIndex}.clientes.${clienteIndex}.prestamo.monto`, {
                      valueAsNumber: true
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Plazo
                  </label>
                  <select
                    {...register(`trabajadores.${trabajadorIndex}.clientes.${clienteIndex}.prestamo.plazo`)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="15">15 días</option>
                    <option value="20">20 días</option>
                    <option value="23">23 días</option>
                    <option value="28">4 semanas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {(() => {
                      const plazo = watchedData?.trabajadores?.[trabajadorIndex]?.clientes?.[clienteIndex]?.prestamo?.plazo || '15';
                      return plazo === '28' ? 'Pago Semanal' : 'Pago Diario';
                    })()}
                  </label>
                  <div className="bg-gray-100 px-2 py-1 text-sm rounded text-gray-700 font-medium">
                    ${(() => {
                      const monto = watchedData?.trabajadores?.[trabajadorIndex]?.clientes?.[clienteIndex]?.prestamo?.monto || 0;
                      const plazo = watchedData?.trabajadores?.[trabajadorIndex]?.clientes?.[clienteIndex]?.prestamo?.plazo || '15';
                      const details = calculateLoanDetails(monto, plazo);
                      return formatNumberWithCommas(plazo === '28' ? details.weeklyPayment || details.dailyPayment : details.dailyPayment);
                    })()}
                  </div>
                </div>
              </div>

              {/* Resumen del préstamo */}
              <div className="bg-white p-2 rounded border border-gray-200">
                <h6 className="text-xs font-semibold text-gray-700 mb-2">Resumen del Préstamo</h6>
                {(() => {
                  const monto = watchedData?.trabajadores?.[trabajadorIndex]?.clientes?.[clienteIndex]?.prestamo?.monto || 0;
                  const plazo = watchedData?.trabajadores?.[trabajadorIndex]?.clientes?.[clienteIndex]?.prestamo?.plazo || '15';
                  const details = calculateLoanDetails(monto, plazo);

                  return (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cantidad Principal:</span>
                        <span className="font-medium">${formatNumberWithCommas(monto)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total de Interés:</span>
                        <span className="font-medium">${formatNumberWithCommas(details.totalInterest)}</span>
                      </div>
                      <div className="border-t border-gray-200 my-1"></div>
                      <div className="flex justify-between font-semibold">
                        <span>Total de Repago:</span>
                        <span>${formatNumberWithCommas(details.totalPayment)}</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>{plazo === '28' ? 'Pago Semanal:' : 'Pago Diario:'}</span>
                        <span className="font-semibold">
                          ${formatNumberWithCommas(plazo === '28' ? details.weeklyPayment : details.dailyPayment)}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>{plazo === '28' ? 'Multa por semana:' : 'Multa por día:'}</span>
                        <span className="font-semibold">
                          ${formatNumberWithCommas(plazo === '28' ? details.weeklyFine : details.finePerDay)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Fecha personalizada */}
              <div className="mt-3">
                <label className="flex items-center space-x-2 text-xs">
                  <input
                    type="checkbox"
                    {...register(`trabajadores.${trabajadorIndex}.clientes.${clienteIndex}.prestamo.useCustomStartDate`)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">Ingresar fecha de inicio personalizada</span>
                </label>

                {watchedData?.trabajadores?.[trabajadorIndex]?.clientes?.[clienteIndex]?.prestamo?.useCustomStartDate && (
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      {...register(`trabajadores.${trabajadorIndex}.clientes.${clienteIndex}.prestamo.customStartDate`)}
                      max={moment.tz('America/Mexico_City').format('YYYY-MM-DD')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {(() => {
                      const useCustomDate = watchedData?.trabajadores?.[trabajadorIndex]?.clientes?.[clienteIndex]?.prestamo?.useCustomStartDate;
                      const customDate = watchedData?.trabajadores?.[trabajadorIndex]?.clientes?.[clienteIndex]?.prestamo?.customStartDate;
                      const plazo = watchedData?.trabajadores?.[trabajadorIndex]?.clientes?.[clienteIndex]?.prestamo?.plazo || '15';

                      if (useCustomDate && customDate) {
                        const startDate = moment(customDate);
                        const endDate = startDate.clone().add(parseInt(plazo) - 1, 'days');
                        const mexicoToday = moment.tz('America/Mexico_City').startOf('day');
                        const isHistorical = endDate.isBefore(mexicoToday);

                        return (
                          <div className="mt-1 text-xs">
                            <span className="text-gray-600">Tipo de registro: </span>
                            <span className={`font-medium ${isHistorical ? 'text-red-600' : 'text-green-600'}`}>
                              {isHistorical ? 'Histórico' : 'Futuro'}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Observaciones
                </label>
                <input
                  type="text"
                  {...register(`trabajadores.${trabajadorIndex}.clientes.${clienteIndex}.prestamo.observaciones`)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observaciones adicionales (opcional)"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BulkRegistration; 