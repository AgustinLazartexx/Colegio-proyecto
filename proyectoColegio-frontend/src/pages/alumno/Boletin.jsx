import React, { useEffect, useState } from "react";
import {
  getMisAsistenciasAlumno,
  getMisClasesAlumno,
  getMisMateriasPrevias,
  getMisNotasAlumno,
} from "../../api/api";
import { Book, Award, AlertCircle, BookOpenCheck, FileDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import CycleSelector, { CycleStatusNotice } from "../../components/admin/CycleSelector";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";
import ModalExportarPlanilla from "../../components/ModalExportarPlanilla";
import { agruparNotasBoletin, crearDocumentoBoletin } from "../../utils/exportadores/boletinPlanilla.js";

const Boletin = () => {
  const { usuario } = useAuth();
  const [boletin, setBoletin] = useState([]);
  const [previas, setPrevias] = useState([]);
  const [asistencia, setAsistencia] = useState(null);
  const [alumnoReporte, setAlumnoReporte] = useState(null);
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrevias, setLoadingPrevias] = useState(true);
  const [errorReporte, setErrorReporte] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [documento, setDocumento] = useState(null);
  const { cycles, cycleId, setCycleId, selectedCycle, loadingCycles } = useAcademicCycles();

  useEffect(() => {
    let active = true;
    const cargarDatos = async () => {
      if (!cycleId) {
        if (!loadingCycles) {
          setLoading(false);
          setLoadingPrevias(false);
        }
        return;
      }
      setLoading(true);
      setLoadingPrevias(true);
      setErrorReporte("");
      const results = await Promise.allSettled([
        getMisNotasAlumno(cycleId),
        getMisMateriasPrevias(),
        getMisAsistenciasAlumno(cycleId),
        getMisClasesAlumno(cycleId),
      ]);
      if (!active) return;

      const [notesResult, previasResult, attendanceResult, classesResult] = results;
      const notas = notesResult.status === "fulfilled" ? notesResult.value.data.notas || [] : [];
      const materiasPrevias = previasResult.status === "fulfilled" && Array.isArray(previasResult.value.data)
        ? previasResult.value.data
        : [];
      const datosAsistencia = attendanceResult.status === "fulfilled" ? attendanceResult.value.data : null;
      const clasesAlumno = classesResult.status === "fulfilled" && Array.isArray(classesResult.value.data)
        ? classesResult.value.data
        : [];

      if (notesResult.status === "rejected") console.error("Error al cargar boletín:", notesResult.reason);
      if (previasResult.status === "rejected") console.error("Error al cargar materias previas:", previasResult.reason);
      if (attendanceResult.status === "rejected") console.error("Error al cargar asistencias del boletín:", attendanceResult.reason);
      if (classesResult.status === "rejected") console.error("Error al cargar las materias del ciclo:", classesResult.reason);

      setBoletin(agruparNotasBoletin(
        notas,
        clasesAlumno.map((clase) => clase.materia).filter(Boolean),
        selectedCycle?.estado,
      ));
      setPrevias(materiasPrevias);
      setAsistencia(datosAsistencia);
      setClases(clasesAlumno);
      setAlumnoReporte({ ...usuario, ...(notesResult.status === "fulfilled" ? notesResult.value.data.alumno : {}) });

      const failedRequests = results.filter((result) => result.status === "rejected");
      if (failedRequests.length) {
        setErrorReporte("No se pudo cargar toda la información necesaria; el boletín no está disponible para exportar.");
      }
      setLoading(false);
      setLoadingPrevias(false);
    };

    cargarDatos();
    return () => {
      active = false;
    };
  }, [cycleId, loadingCycles, selectedCycle?.estado, usuario]);

  const renderNota = (valor) => {
    if (valor === null || valor === undefined) return <span className="text-gray-300">-</span>;
    const esDesaprobado = valor < 6;
    return (
      <span className={`font-bold ${esDesaprobado ? "text-red-500" : "text-gray-800"}`}>
        {valor}
      </span>
    );
  };

  const abrirVistaPrevia = () => {
    const primeraClase = clases[0];
    setDocumento(crearDocumentoBoletin({
      alumno: alumnoReporte || usuario,
      ciclo: selectedCycle,
      curso: primeraClase
        ? { anio: primeraClase.nivel ?? primeraClase.anio, division: primeraClase.division }
        : {},
      materias: boletin,
      previas,
      asistencia,
    }));
    setModalAbierto(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800">
              <Award className="text-yellow-500" size={32} /> Mi Boletín Académico
            </h1>
            <p className="mt-2 text-gray-600">Resumen de calificaciones trimestrales.</p>
          </div>
          <button
            type="button"
            onClick={abrirVistaPrevia}
            disabled={loading || !cycleId || Boolean(errorReporte)}
            title={errorReporte || "Previsualizar y descargar el boletín oficial"}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown size={17} aria-hidden="true" />
            Exportar boletín
          </button>
        </header>

        {errorReporte && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
            {errorReporte}
          </p>
        )}

        <div className="mb-6 grid gap-3 md:grid-cols-[minmax(240px,1fr)_2fr] md:items-end">
          <CycleSelector cycles={cycles} value={cycleId} onChange={setCycleId} disabled={loadingCycles} />
          <CycleStatusNotice cycle={selectedCycle} />
        </div>

        <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-amber-950">
            <BookOpenCheck size={20} /> Materias previas
          </h2>
          {loadingPrevias ? (
            <p className="text-sm text-amber-900">Cargando materias previas...</p>
          ) : previas.filter((previa) => previa.estado === "PENDIENTE").length === 0 ? (
            <p className="text-sm text-amber-900">No tenés materias previas pendientes.</p>
          ) : (
            <ul className="space-y-2">
              {previas.filter((previa) => previa.estado === "PENDIENTE").map((previa) => (
                <li key={previa._id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                  <span className="font-semibold text-slate-800">{previa.materia}</span>
                  <span className="text-amber-800">{previa.anioOrigen} · Pendiente</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {loading ? (
          <div className="text-center p-10">Cargando notas...</div>
        ) : boletin.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500 flex flex-col items-center">
            <AlertCircle size={48} className="mb-4 text-blue-300"/>
            <p>Aún no tienes notas cargadas en el sistema.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="p-4 font-semibold"><div className="flex items-center gap-2"><Book size={18}/> Materia</div></th>
                    <th className="p-4 font-semibold text-center w-24">1º Trim</th>
                    <th className="p-4 font-semibold text-center w-24">2º Trim</th>
                    <th className="p-4 font-semibold text-center w-24">3º Trim</th>
                    <th className="p-4 font-semibold text-center w-32 bg-blue-700">Puntaje final</th>
                    <th className="p-4 font-semibold text-center w-32">Recuperación</th>
                    <th className="p-4 font-semibold text-center w-40 bg-blue-700">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {boletin.map((mat) => (
                    <tr key={mat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-700">{mat.nombre}</td>
                      <td className="p-4 text-center bg-gray-50/50">{renderNota(mat.t1)}</td>
                      <td className="p-4 text-center">{renderNota(mat.t2)}</td>
                      <td className="p-4 text-center bg-gray-50/50">{renderNota(mat.t3)}</td>
                      <td className="bg-blue-50 p-4 text-center font-bold text-blue-800">
                        {mat.puntajeFinal === null ? "—" : mat.puntajeFinal.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">{renderNota(mat.notaRecuperacion)}</td>
                      <td className="p-4 text-center">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          ["APROBADA", "APROBADA_RECUPERACION"].includes(mat.estadoFinal)
                            ? "bg-green-100 text-green-800"
                            : mat.estadoFinal === "A_RECUPERACION"
                              ? "bg-orange-100 text-orange-800"
                              : mat.estadoFinal === "DESAPROBADA"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-600"
                        }`}>
                          {mat.estadoFinal.replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <ModalExportarPlanilla
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        documento={documento}
      />
    </div>
  );
};

export default Boletin;