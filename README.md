# Panel de Administración - Sistema de Préstamos

Este es un panel de administración web desarrollado con React + Vite + Tailwind CSS para facilitar el registro masivo de datos en el sistema de préstamos.

## 🚀 Características

### ✅ Funcionalidades Implementadas

- **Crear Administradores Individual**: Formulario para crear administradores únicos
- **Registro Masivo**: Crear un administrador con múltiples trabajadores y clientes de una sola vez
- **Interfaz Responsive**: Diseño adaptable para desktop, tablet y móvil
- **Validación de Formularios**: Validación en tiempo real con Zod
- **Cálculo Automático**: Cálculo automático de pagos diarios basado en monto, interés y días
- **Feedback Visual**: Indicadores de éxito, error y carga

### 📋 Estructura del Registro Masivo

1. **Administrador**: 
   - Nombre completo
   - Email único
   - Contraseña

2. **Trabajadores** (múltiples por admin):
   - Nombre completo
   - Email único
   - Teléfono
   - Contraseña

3. **Clientes** (múltiples por trabajador):
   - Datos personales: nombre, teléfono, dirección, ocupación
   - **Préstamo automático**:
     - Monto del préstamo
     - Porcentaje de interés
     - Duración en días
     - Cálculo automático del pago diario
     - Observaciones opcionales

## 🛠️ Tecnologías Utilizadas

- **React 18** - Framework de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite** - Herramienta de construcción rápida
- **Tailwind CSS** - Framework de CSS utilitario
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Lucide React** - Iconos
- **Axios** - Cliente HTTP

## 🏗️ Estructura del Proyecto

```
admin-panel/
├── src/
│   ├── components/
│   │   ├── AdminForm.tsx          # Formulario para crear admin individual
│   │   └── BulkRegistration.tsx   # Formulario de registro masivo
│   ├── config/
│   │   └── api.ts                 # Configuración de API y tipos
│   ├── App.tsx                    # Componente principal
│   └── main.tsx                   # Punto de entrada
├── public/
├── package.json
└── README.md
```

## 🚀 Instalación y Uso

### Prerrequisitos

- Node.js 16+ 
- npm o yarn
- Backend del sistema de préstamos corriendo en `http://localhost:3000`

### Instalación

1. **Clonar o navegar al proyecto**:
   ```bash
   cd admin-panel
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**:
   ```
   http://localhost:5173
   ```

### Construcción para Producción

```bash
npm run build
```

## 📊 Cómo Usar el Panel

### 1. Crear Administrador Individual

1. Ve a la pestaña "**Crear Admin**"
2. Completa el formulario con:
   - Nombre completo
   - Email único
   - Contraseña (mínimo 6 caracteres)
   - Confirmación de contraseña
3. Haz clic en "**Crear Administrador**"

### 2. Registro Masivo

1. Ve a la pestaña "**Registro Masivo**"
2. **Completa datos del administrador** (sección superior)
3. **Agrega trabajadores**:
   - Usa "**Agregar Trabajador**" para añadir más trabajadores
   - Completa nombre, email, teléfono y contraseña de cada trabajador
4. **Agrega clientes a cada trabajador**:
   - Usa "**Agregar Cliente**" en cada trabajador
   - Completa datos personales del cliente
   - **Configura el préstamo**:
     - Monto en pesos
     - Porcentaje de interés
     - Duración en días
     - El **pago diario se calcula automáticamente**
     - Observaciones (opcional)
5. Haz clic en "**Crear Registro Masivo**"

### 💡 Funciones Inteligentes

- **Cálculo Automático**: El pago diario se actualiza en tiempo real basado en: `(monto + (monto * interés / 100)) / días`
- **Validación en Vivo**: Los campos se validan mientras escribes
- **Gestión Dinámica**: Agrega/elimina trabajadores y clientes según necesites
- **Feedback Inmediato**: Notificaciones de éxito/error en tiempo real

## 🔧 Configuración de API

El panel está configurado para conectarse con el backend en `http://localhost:3000`. Si necesitas cambiar la URL, modifica el archivo `src/config/api.ts`:

```typescript
const API_BASE_URL = 'https://tu-backend.com'; // Cambia aquí
```

## 🎯 Ejemplo de Uso Típico

**Escenario**: Crear un admin con 2 trabajadores, cada uno con 3 clientes

1. **Admin**: "Juan Pérez" (admin@empresa.com)
2. **Trabajador 1**: "María García" (maria@empresa.com)
   - **Cliente 1**: Pedro López - Préstamo $1,000, 20%, 30 días = $40/día
   - **Cliente 2**: Ana Torres - Préstamo $1,500, 25%, 45 días = $42/día  
   - **Cliente 3**: Carlos Ruiz - Préstamo $800, 15%, 20 días = $46/día
3. **Trabajador 2**: "Luis Mendoza" (luis@empresa.com)
   - **Cliente 1**: Elena Silva - Préstamo $1,200, 22%, 35 días = $42/día
   - **Cliente 2**: Roberto Flores - Préstamo $2,000, 18%, 50 días = $47/día
   - **Cliente 3**: Carmen Vega - Préstamo $900, 20%, 25 días = $43/día

**Resultado**: 1 admin + 2 trabajadores + 6 clientes + 6 préstamos creados automáticamente.

## 🔗 Integración con Backend

El panel consume las siguientes APIs:

- `POST /auth/register` - Crear administradores
- `POST /workers` - Crear trabajadores  
- `POST /clients` - Crear clientes
- `POST /loans` - Crear préstamos

## 📝 Notas Técnicas

- **Responsive Design**: Optimizado para móviles con Tailwind CSS
- **Type Safety**: TypeScript para mayor seguridad en el código
- **Performance**: Vite para desarrollo rápido y builds optimizados
- **UX/UI**: Interfaz intuitiva con feedback visual claro
- **Error Handling**: Manejo robusto de errores con mensajes descriptivos

## 🎨 Customización

Para personalizar el diseño, modifica las clases de Tailwind en los componentes. El tema principal usa:

- **Colores primarios**: Azul (`blue-600`, `blue-700`)
- **Colores de estado**: Verde (éxito), Rojo (error), Amarillo (advertencia)
- **Tipografía**: Sistema de fuentes por defecto
- **Espaciado**: Sistema de espaciado consistente de Tailwind

---

**¡Panel listo para facilitar el registro masivo de datos del sistema de préstamos!** 🎉
