import React, { useState, useEffect, useCallback } from 'react';
import { Users, BookOpen, X, Plus, PauseCircle, RotateCcw, Search, CheckCircle, AlertCircle, FileDown } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import CycleSelector, { CycleStatusNotice } from '../../components/admin/CycleSelector';
import { useAcademicCycles } from '../../hooks/useAcademicCycles';
import ModalExportarPlanilla from '../../components/ModalExportarPlanilla';
import { crearNominaClase } from '../../utils/exportadores/planillasAcademicas.js';

// Importamos las funciones REALES de tu api.js
import { 
  getTodasLasClases,      // Trae todas las clases del sistema
  getAlumnosPorCurso,     // Trae todos los alumnos de un año/división (para llenar "disponibles")
  getAlumnosDeClase,      // Trae los inscritos en una materia específica
  asignarAlumnoAClase,    // POST para inscribir
  cambiarEstadoAlumnoDeClase
} from '../../api/api';

// ----------------------------------------------------------------------
// 1. COMPONENTE MODAL (El popup para agregar/quitar alumnos)
// ----------------------------------------------------------------------

const ModalGestionAlumnos = ({ clase, isOpen, onClose, onUpdateSuccess, cycleId, cycleAnio, readOnly }) => {
  const [inscritos, setInscritos] = useState([]);
  const [suspendidos, setSuspendidos] = useState([]);
  const [disponibles, setDisponibles] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState(null);
  const [nominaAbierta, setNominaAbierta] = useState(false);
  const [documentoNomina, setDocumentoNomina] = useState(null);

  const cargarListas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const claseId = clase._id || clase.id;

      // A. Obtener los alumnos YA inscritos en esta clase
      // Nota: Ajustamos según si tu API devuelve { data: [...] } o [...] directo
      const resInscritos = await getAlumnosDeClase(claseId);
      const dataInscritos = resInscritos.data || resInscritos; 

      // B. Obtener TODOS los alumnos del curso (Año y División de la materia)
      // Esto nos sirve para saber a quiénes podemos agregar
      const resCurso = await getAlumnosPorCurso(clase.anio, clase.division, cycleId);
      const dataCurso = resCurso.data || resCurso;

      const inscripciones = Array.isArray(dataInscritos) ? dataInscritos : [];
      setInscritos(inscripciones.filter(a => a.isActive));
      setSuspendidos(inscripciones.filter(a => !a.isActive));

      // C. Evitar duplicados, incluidas las inscripciones suspendidas.
      if (Array.isArray(dataCurso) && Array.isArray(dataInscritos)) {
          const inscritosIds = new Set(dataInscritos.map(a => String(a._id || a.id)));
          const disponiblesCalculados = dataCurso.filter(a => !inscritosIds.has(String(a._id || a.id)));
          setDisponibles(disponiblesCalculados);
      } else {
          setDisponibles([]);
      }

    } catch (err) {
      console.error("Error cargando listas:", err);
      setError("Error al cargar los alumnos. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }, [clase, cycleId]);

  // Cargar datos cada vez que se abre el modal con una clase nueva
  useEffect(() => {
    if (isOpen && clase) {
      cargarListas();
    }

    return () => {
      setBusqueda('');
      setError(null);
      setInscritos([]);
      setSuspendidos([]);
      setDisponibles([]);
    };
  }, [isOpen, clase, cargarListas]);

  useEffect(() => {
    setNominaAbierta(false);
    setDocumentoNomina(null);
  }, [isOpen, clase?._id, clase?.id]);

  const handleAsignar = async (alumno) => {
    if (readOnly) return;
    try {
      // 1. Actualización Optimista (Visualmente instantáneo)
      setInscritos([...inscritos, { ...alumno, isActive: true }]);
      setDisponibles(disponibles.filter(a => a._id !== alumno._id));
      
      // 2. Llamada a la API
      const claseId = clase._id || clase.id;
      await asignarAlumnoAClase(claseId, alumno._id);
      
      // 3. Avisar al padre para que actualice el contador de la tarjeta (opcional)
      if (onUpdateSuccess) onUpdateSuccess(); 

      // Pequeña notificación no intrusiva
      const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
      });
      Toast.fire({ icon: 'success', title: 'Alumno inscrito' });

    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo inscribir al alumno', 'error');
      cargarListas(); // Revertir cambios recargando
    }
  };

  const handleSuspender = async (alumno) => {
    if (readOnly) return;
    const result = await Swal.fire({
        title: '¿Suspender inscripción?',
        text: `La inscripción de ${alumno.nombre} en ${clase.materia?.nombre} se conservará, pero dejará de estar activa.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, suspender',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const claseId = clase._id || clase.id;
      await cambiarEstadoAlumnoDeClase(claseId, alumno._id, false);
      setInscritos(inscritos.filter(a => a._id !== alumno._id));
      setSuspendidos([...suspendidos, { ...alumno, isActive: false }]);
      if (onUpdateSuccess) onUpdateSuccess();
      Swal.fire({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1800,
        icon: 'success', title: 'Inscripción suspendida'
      });

    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo suspender la inscripción', 'error');
      cargarListas();
    }
  };

  const handleReactivar = async (alumno) => {
    if (readOnly) return;
    try {
      const claseId = clase._id || clase.id;
      await cambiarEstadoAlumnoDeClase(claseId, alumno._id, true);
      setSuspendidos(suspendidos.filter(a => a._id !== alumno._id));
      setInscritos([...inscritos, { ...alumno, isActive: true }]);
      if (onUpdateSuccess) onUpdateSuccess();
      Swal.fire({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1800,
        icon: 'success', title: 'Inscripción reactivada'
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo reactivar la inscripción', 'error');
      cargarListas();
    }
  };

  // Filtrado del buscador local
  const busquedaLower = busqueda.toLowerCase();
  const disponiblesFiltrados = disponibles.filter(a => 
    (a.nombre && a.nombre.toLowerCase().includes(busquedaLower)) ||
    (a.apellido && a.apellido.toLowerCase().includes(busquedaLower)) ||
    (a.email && a.email.toLowerCase().includes(busquedaLower))
  );

  const abrirNomina = () => {
    setDocumentoNomina(crearNominaClase({
      clase,
      ciclo: { anio: cycleAnio },
      alumnos: [
        ...inscritos.map((alumno) => ({ ...alumno, isActive: true })),
        ...suspendidos.map((alumno) => ({ ...alumno, isActive: false })),
      ],
    }));
    setNominaAbierta(true);
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden transform transition-all scale-100">
        
        {/* Header del Modal */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white shadow-md">
          <div>
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <BookOpen size={20} className="text-blue-200" />
              {clase.materia?.nombre || "Materia Desconocida"}
            </h2>
            <p className="text-blue-100 text-xs md:text-sm mt-0.5 flex items-center gap-2">
              <span className="bg-blue-700 px-2 py-0.5 rounded">Año: {clase.anio}°</span>
              <span className="bg-blue-700 px-2 py-0.5 rounded">Div: "{clase.division}"</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={abrirNomina}
              disabled={loading || inscritos.length + suspendidos.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileDown size={16} aria-hidden="true" />
              Exportar nómina
            </button>
            <button onClick={onClose} className="bg-blue-700 hover:bg-blue-500 p-2 rounded-full transition-colors" aria-label="Cerrar gestión de alumnos">
              <X size={20} />
            </button>
          </div>
        </div>
        {readOnly && (
          <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
            Modo Solo Lectura: las inscripciones de este ciclo no se pueden modificar.
          </div>
        )}

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-hidden bg-gray-100 p-4">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4"></div>
                    <p className="font-medium text-sm">Sincronizando padrones...</p>
                </div>
            ) : error ? (
                <div className="h-full flex items-center justify-center text-red-500 bg-red-50 rounded-lg border border-red-200 p-6">
                    <div className="text-center">
                        <AlertCircle size={32} className="mx-auto mb-2" />
                        <p>{error}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                    
                    {/* COLUMNA IZQUIERDA: DISPONIBLES */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
                        <div className="p-3 border-b border-gray-100 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-700 text-sm">
                                    Alumnos Disponibles
                                </h3>
                                <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                    {disponiblesFiltrados.length}
                                </span>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar alumno..." 
                                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {disponiblesFiltrados.map(alumno => (
                                <div key={alumno._id} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group">
                                    <div className="truncate mr-2">
                                        <p className="font-semibold text-gray-800 text-sm truncate">{alumno.apellido ? `${alumno.apellido}, ${alumno.nombre}` : alumno.nombre}</p>
                                        <p className="text-xs text-gray-500 truncate">{alumno.email}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleAsignar(alumno)}
                                        disabled={readOnly}
                                        className="bg-blue-100 text-blue-600 p-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-colors flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                                        title="Inscribir"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            ))}
                            {disponiblesFiltrados.length === 0 && (
                                <div className="text-center py-8 opacity-50">
                                    <p className="text-xs text-gray-500">No se encontraron alumnos.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: INSCRITOS */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                        <div className="p-3 border-b border-gray-100 bg-green-50 flex justify-between items-center">
                            <h3 className="font-bold text-green-800 text-sm">
                                Inscritos en Materia
                            </h3>
                            <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                                {inscritos.length}
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                             {inscritos.map(alumno => (
                                <div key={alumno._id} className="flex items-center justify-between p-2 bg-white border-l-2 border-l-transparent border border-gray-100 rounded-r-lg shadow-sm hover:border-l-green-500 transition-all">
                                    <div className="flex items-center gap-2 truncate mr-2">
                                        <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                                        <div className="truncate">
                                            <p className="font-semibold text-gray-800 text-sm truncate">{alumno.apellido ? `${alumno.apellido}, ${alumno.nombre}` : alumno.nombre}</p>
                                            <p className="text-xs text-gray-500 truncate">{alumno.email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleSuspender(alumno)}
                                        disabled={readOnly}
                                        className="text-gray-400 hover:text-amber-600 hover:bg-amber-50 p-1.5 rounded-full transition-colors flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                                        title="Suspender inscripción"
                                    >
                                        <PauseCircle size={16} />
                                    </button>
                                </div>
                            ))}
                            {suspendidos.length > 0 && (
                                <div className="pt-3">
                                    <h4 className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                                        Inscripciones suspendidas ({suspendidos.length})
                                    </h4>
                                    {suspendidos.map(alumno => {
                                        const puedeReactivar = alumno.alumnoActivo &&
                                          Number(alumno.anio) === Number(clase.anio) &&
                                          alumno.division === clase.division;
                                        return (
                                            <div key={alumno._id} className="mb-2 flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 p-2">
                                                <div className="truncate mr-2">
                                                    <p className="font-semibold text-gray-800 text-sm truncate">{alumno.apellido ? `${alumno.apellido}, ${alumno.nombre}` : alumno.nombre}</p>
                                                    <p className="text-xs text-amber-700 truncate">{alumno.email} · Suspendido</p>
                                                </div>
                                                <button
                                                    onClick={() => handleReactivar(alumno)}
                                                    disabled={readOnly || !puedeReactivar}
                                                    className="flex-shrink-0 rounded-full p-1.5 text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                    title={puedeReactivar ? "Reactivar inscripción" : "El alumno debe estar activo y pertenecer al mismo curso"}
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {inscritos.length === 0 && suspendidos.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <p className="text-sm">Lista vacía.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 flex justify-end border-t border-gray-200">
            <button 
                onClick={onClose}
                className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium transition-all shadow"
            >
                Cerrar
            </button>
        </div>
      </div>
    </div>
    <ModalExportarPlanilla
      abierto={nominaAbierta}
      onCerrar={() => setNominaAbierta(false)}
      documento={documentoNomina}
    />
    </>
  );
};

// ----------------------------------------------------------------------
// 2. COMPONENTE PRINCIPAL (Pantalla de Selección de Clases)
// ----------------------------------------------------------------------

const AdminGestionAlumnosClase = () => {
  const { claseId: routeClaseId } = useParams();
  const { cycles, cycleId, setCycleId, selectedCycle, loadingCycles } = useAcademicCycles();
  const [anioSeleccionado, setAnioSeleccionado] = useState('1');
  const [divisionSeleccionada, setDivisionSeleccionada] = useState('A');
  const [clasesFiltradas, setClasesFiltradas] = useState([]);
  const [todasLasClases, setTodasLasClases] = useState([]); // Guardamos todo lo que traiga la API
  const [loading, setLoading] = useState(false);
  const [claseParaEditar, setClaseParaEditar] = useState(null);

  // A. Cargar TODAS las clases al montar el componente
  const fetchClases = useCallback(async ({ silent = false } = {}) => {
    if (!cycleId) return;
    if (!silent) setLoading(true);
    try {
      const res = await getTodasLasClases({ cicloLectivoId: cycleId });
      // Aseguramos extraer el array correcto sea cual sea la respuesta {data: []} o []
      const data = res.data?.clases || res.data || res; 
      if(Array.isArray(data)) {
          setTodasLasClases(data);
      } else {
          console.error("Formato de clases inesperado:", res);
          setTodasLasClases([]);
      }
    } catch (error) {
      console.error("Error cargando clases:", error);
      Swal.fire("Error", "No se pudieron cargar las clases del sistema.", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchClases();
  }, [fetchClases]);

  // B. Filtrar localmente cuando cambia el año, la división o la data
  useEffect(() => {
    if (todasLasClases.length > 0) {
      const filtradas = todasLasClases.filter(c => 
        String(c.anio) === String(anioSeleccionado) && 
        String(c.division).toUpperCase() === String(divisionSeleccionada).toUpperCase()
      );
      setClasesFiltradas(filtradas);
    } else {
      setClasesFiltradas([]);
    }
  }, [anioSeleccionado, divisionSeleccionada, todasLasClases]);

  useEffect(() => {
    if (!routeClaseId || loading || !todasLasClases.length) return;
    const clase = todasLasClases.find((item) => String(item._id || item.id) === routeClaseId);
    if (!clase) return;

    setAnioSeleccionado(String(clase.nivel ?? clase.anio));
    setDivisionSeleccionada(String(clase.division || "A").toUpperCase());
    setClaseParaEditar(clase);
  }, [loading, routeClaseId, todasLasClases]);

  useEffect(() => {
    setClaseParaEditar(null);
  }, [cycleId]);

  const readOnly = selectedCycle?.estado === "CERRADO";


  // Helper para obtener nombre del profesor con seguridad
  const getProfesorNombre = (clase) => {
      // Caso 1: Array de objetos poblados
      if (clase.profesores && clase.profesores.length > 0 && clase.profesores[0].nombre) {
          return [clase.profesores[0].nombre, clase.profesores[0].apellido].filter(Boolean).join(" ");
      }
      // Caso 2: Objeto único (legacy)
      if (clase.profesor && clase.profesor.nombre) {
          return [clase.profesor.nombre, clase.profesor.apellido].filter(Boolean).join(" ");
      }
      return "Sin asignar";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                   Gestión de Inscripciones
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                   Selecciona un curso para ver sus materias y gestionar alumnos.
                </p>
            </div>
            
            {/* Filtros */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <select 
                        value={anioSeleccionado} 
                        onChange={(e) => setAnioSeleccionado(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    >
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}° Año</option>)}
                    </select>
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
                <div className="flex items-center gap-2">
                    <select 
                        value={divisionSeleccionada} 
                        onChange={(e) => setDivisionSeleccionada(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    >
                        {['A','B','C','D'].map(l => <option key={l} value={l}>Div "{l}"</option>)}
                    </select>
                </div>
            </div>
            <div className="mb-6 grid gap-3 md:grid-cols-[minmax(240px,1fr)_2fr] md:items-end">
              <CycleSelector cycles={cycles} value={cycleId} onChange={setCycleId} disabled={loadingCycles} />
              <CycleStatusNotice cycle={selectedCycle} />
            </div>
        </div>

        {/* Grid de Clases */}
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>)}
            </div>
        ) : clasesFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clasesFiltradas.map((clase) => (
                    <div 
                        key={clase._id || clase.id} 
                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
                        onClick={() => setClaseParaEditar(clase)}
                    >
                        <div className="p-5 flex-1 relative">
                            {/* Banda de color lateral */}
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>
                            
                            <div className="ml-2">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">
                                        {clase.materia?.area || "Materia"}
                                    </span>
                                    {/* Contador de alumnos (si existe en el objeto clase) */}
                                    <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        <Users size={12} className="mr-1" />
                                        {clase.alumnosCount ?? (clase.alumnos ? clase.alumnos.length : 0)}
                                    </div>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1" title={clase.materia?.nombre}>
                                    {clase.materia?.nombre || "Nombre no disponible"}
                                </h3>
                                
                                <div className="text-sm text-gray-500 space-y-1">
                                    <p className="flex items-center gap-1">
                                        <span className="font-medium text-gray-700">Prof:</span> {getProfesorNombre(clase)}
                                    </p>
                                    <p className="flex items-center gap-1 text-xs">
                                        <span className="bg-gray-200 text-gray-700 px-1.5 rounded">{clase.diaSemana || "N/A"}</span>
                                        <span>{clase.horaInicio} - {clase.horaFin}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 border-t border-gray-100 text-center group-hover:bg-blue-50 transition-colors">
                            <span className="text-blue-600 font-semibold text-sm flex items-center justify-center gap-2">
                                <Users size={16} /> Gestionar Alumnos
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No se encontraron clases</h3>
                <p className="text-gray-500 max-w-md mx-auto mt-1">
                    No hay materias registradas para el 
                    <span className="font-bold"> {anioSeleccionado}° "{divisionSeleccionada}"</span>. 
                    Prueba cambiando los filtros o crea nuevas clases.
                </p>
            </div>
        )}
      </div>

      {/* Modal de Gestión */}
      <ModalGestionAlumnos 
        clase={claseParaEditar} 
        isOpen={!!claseParaEditar} 
        onClose={() => setClaseParaEditar(null)}
        cycleId={cycleId}
        cycleAnio={selectedCycle?.anio}
        readOnly={readOnly}
        onUpdateSuccess={() => fetchClases({ silent: true })} 
      />

    </div>
  );
};

export default AdminGestionAlumnosClase;