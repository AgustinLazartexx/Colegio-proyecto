import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, UserRound } from "lucide-react";
import {
  getAsistenciasAlumno,
  getBoletinAlumno,
  getCuotasDeAlumno,
  getPreviasAlumno,
} from "../../api/api";
import SlideOverDrawer from "../../components/admin/SlideOverDrawer";

const personalTab = { id: "personal", label: "Datos personales" };
const studentTabs = [
  personalTab,
  { id: "boletin", label: "Boletín" },
  { id: "previas", label: "Materias previas" },
  { id: "asistencias", label: "Asistencias" },
  { id: "cuotas", label: "Cuotas" },
];

const displayDate = (value) => {
  if (!value) return "—";
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleDateString("es-AR");
};

const grade = (value) => value === null || value === undefined ? "—" : Number(value).toLocaleString("es-AR");

const statusColor = (value) => {
  if (["APROBADA", "APROBADA_RECUPERACION"].includes(value)) return "bg-emerald-50 text-emerald-700";
  if (["A_RECUPERACION", "DESAPROBADA"].includes(value)) return "bg-amber-50 text-amber-800";
  return "bg-canvas text-slate-600";
};

const groupReportCards = (notes) => {
  const subjects = new Map();
  for (const note of notes) {
    const id = note.materia?._id || note.materia;
    if (!subjects.has(id)) {
      subjects.set(id, {
        id,
        nombre: note.materia?.nombre || "Materia",
        trimestres: [null, null, null],
        notaRecuperacion: null,
        estadoMateria: null,
      });
    }
    const subject = subjects.get(id);
    if (note.trimestre >= 1 && note.trimestre <= 3) {
      subject.trimestres[note.trimestre - 1] = note.notaFinalTrimestre;
    }
    subject.notaRecuperacion = note.notaRecuperacion;
    subject.estadoMateria = note.estadoMateria;
  }
  return [...subjects.values()].map((subject) => {
    const [one, two, three] = subject.trimestres;
    const complete = [one, two, three].every((value) => value !== null && value !== undefined);
    const total = complete ? Number(((Number(one) + Number(two) + Number(three)) / 3).toFixed(2)) : null;
    const state = subject.estadoMateria && subject.estadoMateria !== "CURSANDO"
      ? subject.estadoMateria
      : total === null ? "CURSANDO" : total >= 6 ? "APROBADA" : "DESAPROBADA";
    return { ...subject, total, state };
  });
};

const DetailValue = ({ label, value }) => (
  <div className="rounded-xl bg-canvas p-3">
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value || "—"}</dd>
  </div>
);

const UserDetailDrawer = ({ usuario, cycleId, selectedCycle, onClose, onEdit, onManageFees }) => {
  const isStudent = usuario.rol === "alumno";
  const studentYear = usuario.nivelCiclo ?? usuario.anio;
  const studentDivision = usuario.divisionCiclo ?? usuario.division;
  const tabs = isStudent ? studentTabs : [personalTab];
  const [activeTab, setActiveTab] = useState("personal");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (activeTab === "personal") return undefined;
    if (!cycleId && activeTab !== "previas") {
      setError("Selecciona un ciclo lectivo para consultar el historial.");
      return undefined;
    }

    let active = true;
    const loadTab = async () => {
      setLoading(true);
      setError("");
      setData(null);
      try {
        let response;
        if (activeTab === "boletin") response = await getBoletinAlumno(usuario._id, cycleId);
        else if (activeTab === "previas") response = await getPreviasAlumno(usuario._id);
        else if (activeTab === "asistencias") response = await getAsistenciasAlumno(usuario._id, cycleId);
        else if (activeTab === "cuotas") response = await getCuotasDeAlumno(usuario._id, { cicloLectivoId: cycleId });
        if (active) setData(response?.data);
      } catch (requestError) {
        if (!active) return;
        console.error(`Error cargando ${activeTab} del usuario:`, requestError);
        setError(requestError.response?.data?.msg || "No se pudo cargar este historial.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTab();
    return () => {
      active = false;
    };
  }, [activeTab, cycleId, retry, usuario._id]);

  const groupedNotes = useMemo(
    () => groupReportCards(Array.isArray(data?.notas) ? data.notas : []),
    [data],
  );
  const attendance = Array.isArray(data) ? data : [];
  const fees = Array.isArray(data) ? data : [];
  const priorSubjects = Array.isArray(data) ? data : [];

  const renderLoading = () => (
    <div className="space-y-3 p-5" role="status" aria-label="Cargando historial">
      {[0, 1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-50" />)}
      <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Cargando historial
      </div>
    </div>
  );

  const renderError = () => (
    <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
      <div className="flex items-start gap-2">
        <AlertCircle size={17} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <p>{error}</p>
          <button type="button" onClick={() => setRetry((current) => current + 1)} className="mt-2 font-semibold underline underline-offset-2">
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );

  const renderTab = () => {
    if (activeTab === "personal") {
      return (
        <div className="space-y-5 p-5 sm:p-7">
          <div className="flex items-center gap-4 rounded-2xl bg-warm p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-secondary shadow-sm">
              <UserRound size={25} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-navy">{usuario.nombre}</p>
              <p className="text-sm capitalize text-slate-500">{usuario.rol}</p>
            </div>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailValue label="DNI" value={usuario.dni} />
            <DetailValue label="Correo" value={usuario.email} />
            <DetailValue label="Estado de cuenta" value={usuario.isActive ? "Activo" : "Bloqueado"} />
            <DetailValue label="Curso" value={isStudent && studentYear ? `${studentYear}° "${studentDivision || "—"}"` : "—"} />
          </dl>
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => onEdit(usuario)} className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800">
              Editar datos
            </button>
            {isStudent && (
              <button type="button" onClick={() => onManageFees(usuario)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-canvas">
                Gestionar cuotas
              </button>
            )}
          </div>
        </div>
      );
    }

    if (loading) return renderLoading();
    if (error) return renderError();

    if (activeTab === "boletin") {
      return groupedNotes.length ? (
        <div className="p-5 sm:p-7">
          <p className="mb-4 text-sm text-slate-500">{selectedCycle?.nombre || "Ciclo seleccionado"}</p>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-canvas text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Materia</th><th className="px-3 py-3">T1</th><th className="px-3 py-3">T2</th>
                  <th className="px-3 py-3">T3</th><th className="px-3 py-3">Promedio</th><th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedNotes.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{subject.nombre}</td>
                    {subject.trimestres.map((value, index) => <td key={index} className="px-3 py-3 text-slate-600">{grade(value)}</td>)}
                    <td className="px-3 py-3 font-semibold text-slate-800">{grade(subject.total)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(subject.state)}`}>{subject.state.replaceAll("_", " ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : <p className="p-8 text-center text-sm text-slate-500">No hay notas cargadas para este ciclo.</p>;
    }

    if (activeTab === "previas") {
      return priorSubjects.length ? (
        <ul className="divide-y divide-slate-100 px-5 sm:px-7">
          {priorSubjects.map((subject) => (
            <li key={subject._id} className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="font-semibold text-slate-800">{subject.materia}</p>
                <p className="mt-1 text-xs text-slate-500">{subject.nivelOrigen}° año · origen {subject.anioOrigen}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${subject.estado === "APROBADA" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                {subject.estado}
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="p-8 text-center text-sm text-slate-500">No hay materias previas registradas.</p>;
    }

    if (activeTab === "asistencias") {
      const attendanceTotals = attendance.reduce((totals, record) => {
        totals[record.estado] = (totals[record.estado] || 0) + 1;
        return totals;
      }, {});
      return (
        <div className="space-y-5 p-5 sm:p-7">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["presente", "ausente", "tarde", "justificado"].map((state) => (
              <div key={state} className="rounded-xl bg-canvas p-3">
                <p className="text-xs capitalize text-slate-500">{state}</p>
                <p className="mt-1 text-lg font-bold text-navy">{attendanceTotals[state] || 0}</p>
              </div>
            ))}
          </div>
          {attendance.length ? (
            <ul className="divide-y divide-slate-100">
              {attendance.slice(0, 12).map((record) => (
                <li key={record._id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold text-slate-800">{record.materia}</p>
                    <p className="mt-1 text-xs text-slate-500">{displayDate(record.fecha)}</p>
                  </div>
                  <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{record.estado}</span>
                </li>
              ))}
            </ul>
          ) : <p className="py-5 text-center text-sm text-slate-500">No hay asistencias registradas en este ciclo.</p>}
        </div>
      );
    }

    if (activeTab === "cuotas") {
      const totals = fees.reduce((summary, fee) => {
        summary[fee.estado] = (summary[fee.estado] || 0) + 1;
        return summary;
      }, {});
      return (
        <div className="space-y-5 p-5 sm:p-7">
          <div className="grid grid-cols-3 gap-2">
            {["pendiente", "vencido", "pagado"].map((state) => (
              <div key={state} className="rounded-xl bg-canvas p-3">
                <p className="text-xs capitalize text-slate-500">{state}</p>
                <p className="mt-1 text-lg font-bold text-navy">{totals[state] || 0}</p>
              </div>
            ))}
          </div>
          {fees.length ? (
            <ul className="divide-y divide-slate-100">
              {fees.map((fee) => (
                <li key={fee._id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold text-slate-800">{fee.mes}/{fee.anio} · ${Number(fee.monto).toLocaleString("es-AR")}</p>
                    <p className="mt-1 text-xs text-slate-500">Vencimiento {displayDate(fee.fechaVencimiento)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${fee.estado === "pagado" ? "bg-emerald-50 text-emerald-700" : fee.estado === "vencido" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                    {fee.estado}
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="py-5 text-center text-sm text-slate-500">No hay cuotas registradas en este ciclo.</p>}
          <button type="button" onClick={() => onManageFees(usuario)} className="w-full rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800">
            Abrir gestión de cuotas
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <SlideOverDrawer
      title={usuario.nombre}
      description={isStudent ? `${studentYear || "—"}° "${studentDivision || "—"}" · ${selectedCycle?.nombre || "Ciclo"}` : usuario.email}
      onClose={onClose}
      width="max-w-2xl"
    >
      <nav className="sticky top-0 z-10 flex overflow-x-auto border-b border-slate-100 bg-white px-3" aria-label="Secciones de detalle del usuario">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              activeTab === tab.id ? "border-secondary text-secondary" : "border-transparent text-slate-500 hover:text-navy"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {activeTab === "personal" ? (
        renderTab()
      ) : loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : (
        renderTab()
      )}
    </SlideOverDrawer>
  );
};

export default UserDetailDrawer;
