import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Ban,
  Check,
  ChevronDown,
  DollarSign,
  Download,
  Edit3,
  Filter,
  GraduationCap,
  Info,
  Loader2,
  Mail,
  Plus,
  Search,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";
import {
  actualizarUsuario,
  asignarAlumnoAClase,
  crearUsuario,
  getTodasLasClases,
  getUsuarios,
} from "../../api/api";
import DataTable from "../../components/admin/DataTable";
import FilterChips from "../../components/admin/FilterChips";
import Toast from "../../components/admin/Toast";
import AdminGestionCuotas from "./AdminGestionCuotas";
import UsuarioDetailDrawer from "./UsuarioDetailDrawer";

const roleOptions = [
  { value: "alumno", label: "Alumnos" },
  { value: "profesor", label: "Docentes" },
  { value: "admin", label: "Administrativos" },
];

const stateOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Bloqueados" },
];

const academicYears = [
  { value: "", label: "Todos los años" },
  ...[1, 2, 3, 4, 5, 6].map((year) => ({ value: String(year), label: `${year}°` })),
];

const divisions = [
  { value: "", label: "Todas las divisiones" },
  ...["A", "B", "C", "D"].map((division) => ({ value: division, label: division })),
];

const emptyForm = {
  nombre: "",
  email: "",
  rol: "alumno",
  dni: "",
  anio: "",
  division: "",
};

const csvValue = (value) => {
  const text = String(value ?? "");
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
};

const UsuariosAdmin = () => {
  const { usuario: currentUser } = useAuth();
  const { cycleId, selectedCycle } = useAcademicCycles();
  const [searchParams] = useSearchParams();
  const routeQuery = searchParams.get("q")?.trim() || "";
  const requestedRole = searchParams.get("rol");
  const routeUserId = searchParams.get("id");
  const routeAll = searchParams.get("todos") === "1";
  const routeIsActive = searchParams.get("isActive");
  const routeCycleId = searchParams.get("cicloLectivoId") || cycleId;
  const routeCycleFilterId = routeAll ? routeCycleId : "";
  const routeStatus = routeIsActive === "true" || routeIsActive === "1"
    ? "active"
    : routeIsActive === "false" || routeIsActive === "0" ? "inactive" : "all";

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeRole, setActiveRole] = useState("alumno");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
  const [filterStatus, setFilterStatus] = useState(routeStatus);
  const [selectedIds, setSelectedIds] = useState([]);

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [savingUser, setSavingUser] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [dniError, setDniError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedFeeStudent, setSelectedFeeStudent] = useState(null);

  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [classOptions, setClassOptions] = useState([]);
  const [classId, setClassId] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [notification, setNotification] = useState(null);
  const notificationId = useRef(0);

  const notify = useCallback((type, message) => {
    notificationId.current += 1;
    setNotification({ id: notificationId.current, type, message });
  }, []);

  const dismissNotification = useCallback(() => setNotification(null), []);

  const hasSearchCriteria = Boolean(
    hasSearched || routeAll || searchTerm.trim() || filterYear || filterDivision || filterStatus !== "all",
  );
  const selectedUsers = useMemo(
    () => usuarios.filter((user) => selectedIds.includes(user._id)),
    [usuarios, selectedIds],
  );

  const buildFilters = ({
    role = activeRole,
    query = searchTerm,
    year = filterYear,
    division = filterDivision,
    status = filterStatus,
  } = {}) => ({
    rol: role,
    ...(query.trim() ? { q: query.trim() } : {}),
    ...(year ? { anio: year } : {}),
    ...(division ? { division } : {}),
    ...(status !== "all" ? { isActive: status === "active" } : {}),
    ...(routeAll && role === "alumno" && routeCycleId ? { cicloLectivoId: routeCycleId } : {}),
  });

  const fetchUsuarios = useCallback(async (filters) => {
    setSelectedIds([]);
    setLoading(true);
    try {
      const { data } = await getUsuarios(filters);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      setUsuarios([]);
      notify("error", error.response?.data?.msg || "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    const role = roleOptions.some((option) => option.value === requestedRole) ? requestedRole : "alumno";
    if (!routeQuery && !routeAll) {
      setActiveRole("alumno");
      setSearchTerm("");
      setFilterYear("");
      setFilterDivision("");
      setFilterStatus("all");
      setUsuarios([]);
      setSelectedIds([]);
      setHasSearched(false);
      return;
    }

    setActiveRole(role);
    setSearchTerm(routeQuery);
    setFilterYear("");
    setFilterDivision("");
    setFilterStatus(routeAll ? routeStatus : "all");
    setHasSearched(true);
    fetchUsuarios({
      rol: role,
      ...(routeQuery ? { q: routeQuery } : {}),
      ...(routeAll && routeStatus !== "all" ? { isActive: routeStatus === "active" } : {}),
      ...(routeAll && role === "alumno" && routeCycleFilterId ? { cicloLectivoId: routeCycleFilterId } : {}),
    });
  }, [fetchUsuarios, requestedRole, routeAll, routeCycleFilterId, routeQuery, routeStatus]);

  useEffect(() => {
    if (!routeUserId || loading) return;
    const user = usuarios.find((item) => item._id === routeUserId);
    if (!user) return;
    document.getElementById(`row-${routeUserId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setSelectedUser(user);
  }, [loading, routeUserId, usuarios]);

  const clearResults = () => {
    setUsuarios([]);
    setSelectedIds([]);
    setHasSearched(false);
  };

  const applyFilters = (updates = {}) => {
    const next = {
      role: activeRole,
      query: searchTerm,
      year: filterYear,
      division: filterDivision,
      status: filterStatus,
      ...updates,
    };
    setActiveRole(next.role);
    setSearchTerm(next.query);
    setFilterYear(next.year);
    setFilterDivision(next.division);
    setFilterStatus(next.status);
    setHasSearched(true);
    fetchUsuarios(buildFilters(next));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setHasSearched(true);
    fetchUsuarios(buildFilters());
  };

  const openNewUserForm = () => {
    setEditingUserId(null);
    setDniError("");
    setForm({ ...emptyForm, rol: activeRole });
    setShowUserForm(true);
  };

  const openEditUserForm = (user) => {
    setSelectedUser(null);
    setEditingUserId(user._id);
    setDniError("");
    setForm({
      nombre: user.nombre || "",
      email: user.email || "",
      rol: user.rol || "alumno",
      dni: String(user.dni || "").replace(/\D/g, ""),
      anio: user.anio || "",
      division: user.division || "",
    });
    setShowUserForm(true);
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    const cleanedDni = String(form.dni ?? "").replace(/\D/g, "");
    if (!/^\d{7,8}$/.test(cleanedDni)) {
      setDniError("Ingresa un DNI válido de 7 u 8 dígitos (sin puntos ni espacios).");
      notify("error", "El DNI debe tener entre 7 y 8 dígitos numéricos.");
      return;
    }
    setDniError("");
    setSavingUser(true);
    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      rol: form.rol,
      dni: cleanedDni,
    };
    if (form.rol === "alumno") {
      payload.anio = Number(form.anio);
      payload.division = form.division.trim().toUpperCase();
    }

    try {
      if (editingUserId) {
        await actualizarUsuario(editingUserId, payload);
        notify("success", "Los datos del usuario se actualizaron.");
      } else {
        await crearUsuario(payload);
        notify("success", "Usuario creado. Su contraseña inicial es su número de DNI.");
      }
      setShowUserForm(false);
      setEditingUserId(null);
      setForm(emptyForm);
      if (hasSearched) await fetchUsuarios(buildFilters());
    } catch (error) {
      console.error("Error guardando usuario:", error);
      notify("error", error.response?.data?.msg || "No se pudo guardar el usuario.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleToggleUserAccess = async (user) => {
    const nextActive = !user.isActive;
    const confirmation = await Swal.fire({
      title: nextActive ? "¿Reactivar usuario?" : "¿Bloquear usuario?",
      text: nextActive
        ? `Se permitirá nuevamente el acceso de ${user.nombre}.`
        : `Se impedirá que ${user.nombre} inicie sesión hasta reactivarlo.`,
      icon: nextActive ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: nextActive ? "#059669" : "#d97706",
      confirmButtonText: nextActive ? "Sí, reactivar" : "Sí, bloquear",
      cancelButtonText: "Cancelar",
    });
    if (!confirmation.isConfirmed) return;

    try {
      await actualizarUsuario(user._id, { isActive: nextActive });
      notify("success", nextActive ? "Usuario reactivado." : "Usuario bloqueado.");
      if (hasSearched) await fetchUsuarios(buildFilters());
      else setUsuarios((current) => current.map((item) => item._id === user._id ? { ...item, isActive: nextActive } : item));
    } catch (error) {
      console.error("No se pudo cambiar el acceso del usuario:", error);
      notify("error", error.response?.data?.msg || "No se pudo cambiar el estado del usuario.");
    }
  };

  const handleBulkStatus = async () => {
    if (!selectedUsers.length) return;
    const nextActive = !selectedUsers.some((user) => user.isActive);
    if (!nextActive && selectedUsers.some((user) => user._id === currentUser?._id)) {
      notify("error", "No puedes bloquear tu propia cuenta.");
      return;
    }

    const confirmation = await Swal.fire({
      title: nextActive ? "¿Reactivar usuarios?" : "¿Bloquear usuarios?",
      text: `Se aplicará a ${selectedUsers.length} usuarios seleccionados.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: nextActive ? "Reactivar" : "Bloquear",
      cancelButtonText: "Cancelar",
    });
    if (!confirmation.isConfirmed) return;

    const results = await Promise.allSettled(
      selectedUsers.map((user) => actualizarUsuario(user._id, { isActive: nextActive })),
    );
    const succeededIds = selectedUsers
      .filter((_, index) => results[index].status === "fulfilled")
      .map((user) => user._id);
    setUsuarios((current) => current.map((user) =>
      succeededIds.includes(user._id) ? { ...user, isActive: nextActive } : user,
    ));
    setSelectedIds([]);

    const failed = results.length - succeededIds.length;
    if (failed) {
      const firstFailure = results.find((result) => result.status === "rejected")?.reason;
      notify("error", `${succeededIds.length} actualizados; ${failed} no se pudieron modificar. ${firstFailure?.response?.data?.msg || ""}`.trim());
    } else {
      notify("success", `${succeededIds.length} usuarios ${nextActive ? "reactivados" : "bloqueados"}.`);
    }
    if (hasSearched) await fetchUsuarios(buildFilters());
  };

  const exportSelected = () => {
    if (!selectedUsers.length) return;
    const fields = ["nombre", "email", "dni", "rol", "curso", "isActive"];
    const rows = [
      fields.join(","),
      ...selectedUsers.map((user) => fields.map((field) => csvValue(
        field === "isActive"
          ? (user.isActive ? "Activo" : "Bloqueado")
          : field === "curso"
            ? (user.rol === "alumno" ? `${user.nivelCiclo ?? user.anio ?? ""} ${user.divisionCiclo ?? user.division ?? ""}`.trim() : "")
            : user[field],
      )).join(",")),
    ];
    const blob = new Blob([`\uFEFF${rows.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "usuarios-seleccionados.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    notify("success", `${selectedUsers.length} usuarios exportados.`);
  };

  const openAssignment = async () => {
    if (!cycleId) {
      notify("error", "Selecciona un ciclo antes de asignar alumnos a una clase.");
      return;
    }
    if (!["ACTIVO", "PLANIFICADO", "RECUPERACION"].includes(selectedCycle?.estado)) {
      notify("error", "No se pueden asignar alumnos en un ciclo cerrado.");
      return;
    }
    const cohorts = new Set(selectedUsers.map((user) =>
      `${user.nivelCiclo ?? user.anio}-${user.divisionCiclo ?? user.division}`,
    ));
    if (cohorts.size !== 1) {
      notify("error", "Selecciona alumnos del mismo año y división para asignarlos a una clase.");
      return;
    }
    const [selectedCohort] = cohorts;
    const [year, division] = selectedCohort.split("-");

    setAssignmentOpen(true);
    setLoadingClasses(true);
    setClassOptions([]);
    try {
      const { data } = await getTodasLasClases({ cicloLectivoId: cycleId });
      const classes = Array.isArray(data) ? data : data?.clases;
      setClassOptions(Array.isArray(classes)
        ? classes.filter((course) =>
          Number(course.nivel ?? course.anio) === Number(year) &&
          String(course.division).toUpperCase() === String(division).toUpperCase(),
        )
        : []);
    } catch (error) {
      console.error("No se pudieron cargar clases para la asignación masiva:", error);
      setAssignmentOpen(false);
      notify("error", error.response?.data?.msg || "No se pudieron cargar las clases del ciclo.");
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleBulkAssign = async (event) => {
    event.preventDefault();
    if (!classId || !selectedUsers.length) return;
    setAssigning(true);
    const results = await Promise.allSettled(
      selectedUsers.map((user) => asignarAlumnoAClase(classId, user._id)),
    );
    const succeeded = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - succeeded;
    setAssigning(false);
    setAssignmentOpen(false);
    setClassId("");
    setSelectedIds([]);
    if (failed) {
      const firstFailure = results.find((result) => result.status === "rejected")?.reason;
      notify("error", `${succeeded} alumnos asignados; ${failed} no se pudieron asignar. ${firstFailure?.response?.data?.msg || ""}`.trim());
    } else {
      notify("success", `${succeeded} alumnos asignados a la clase.`);
    }
  };

  const columns = [
    {
      key: "usuario",
      label: "Usuario",
      render: (user) => (
        <button type="button" onClick={() => setSelectedUser(user)} className="flex items-center gap-3 text-left">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-secondary">
            {user.nombre?.charAt(0)?.toUpperCase() || <UserRound size={18} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-slate-800">{user.nombre}</span>
            <span className="mt-0.5 block text-xs text-slate-500">DNI: {user.dni || "N/D"}</span>
          </span>
        </button>
      ),
    },
    {
      key: "correo",
      label: "Correo",
      render: (user) => <span className="inline-flex items-center gap-2"><Mail size={14} className="shrink-0 text-slate-400" />{user.email}</span>,
    },
    {
      key: "curso",
      label: "Curso / Rol",
      render: (user) => user.rol === "alumno" && (user.nivelCiclo || user.anio)
        ? <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">{user.nivelCiclo ?? user.anio}° "{user.divisionCiclo || user.division || "—"}"</span>
        : <span className="capitalize">{user.rol}</span>,
    },
    {
      key: "estado",
      label: "Estado",
      render: (user) => (
        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-emerald-600" : "bg-red-600"}`} />
          {user.isActive ? "Activo" : "Bloqueado"}
        </span>
      ),
    },
    {
      key: "acciones",
      label: "Acciones",
      headerClassName: "text-right",
      className: "text-right",
      render: (user) => (
        <div className="flex justify-end gap-1">
          {user.rol === "alumno" && (
            <button type="button" onClick={() => setSelectedFeeStudent(user)} title="Gestionar cuotas" aria-label={`Gestionar cuotas de ${user.nombre}`} className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50">
              <DollarSign size={17} />
            </button>
          )}
          <button type="button" onClick={() => openEditUserForm(user)} title="Editar usuario" aria-label={`Editar ${user.nombre}`} className="rounded-lg p-2 text-slate-600 transition hover:bg-canvas">
            <Edit3 size={17} />
          </button>
          <button
            type="button"
            onClick={() => handleToggleUserAccess(user)}
            disabled={user.isActive && currentUser?._id === user._id}
            title={user.isActive && currentUser?._id === user._id ? "No puedes bloquear tu propia cuenta" : user.isActive ? "Bloquear usuario" : "Reactivar usuario"}
            aria-label={user.isActive ? `Bloquear a ${user.nombre}` : `Reactivar a ${user.nombre}`}
            className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${user.isActive ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50"}`}
          >
            {user.isActive ? <Ban size={17} /> : <UserCheck size={17} />}
          </button>
        </div>
      ),
    },
  ];

  const emptyState = hasSearchCriteria ? (
    <div className="mx-auto max-w-sm">
      <Users size={36} className="mx-auto text-slate-300" />
      <p className="mt-3 font-semibold text-slate-800">No encontramos usuarios con estos filtros</p>
      <p className="mt-1 text-sm text-slate-500">Ajusta los filtros o crea un nuevo usuario para empezar.</p>
      <button type="button" onClick={openNewUserForm} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
        <Plus size={16} /> Crear usuario
      </button>
    </div>
  ) : (
    <div className="mx-auto max-w-sm">
      <Search size={36} className="mx-auto text-slate-300" />
      <p className="mt-3 font-semibold text-slate-800">Busca en el directorio</p>
      <p className="mt-1 text-sm text-slate-500">Escribe nombre, correo o DNI, o selecciona un filtro para ver usuarios.</p>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">
      {notification && (
        <div className="fixed right-4 top-20 z-[80]">
          <Toast {...notification} onClose={dismissNotification} />
        </div>
      )}

      <header className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
            <Users size={14} /> Administración
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">Directorio de usuarios</h1>
          <p className="mt-2 text-sm text-slate-500">Gestiona accesos, información y actividad de estudiantes y personal.</p>
        </div>
        <button type="button" onClick={openNewUserForm} className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">
          <Plus size={18} /> Nuevo usuario
        </button>
      </header>

      {selectedCycle?.estado === "CERRADO" && (
        <div role="status" className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700">
          Estás consultando {selectedCycle.nombre}. Los historiales académicos y financieros están en modo solo lectura.
        </div>
      )}

      <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Filter size={15} /> Tipo de usuario
          </div>
          <FilterChips
            label="Filtrar por tipo de usuario"
            options={roleOptions}
            value={activeRole}
            onChange={(role) => applyFilters({ role, year: "", division: "", status: "all", query: "" })}
          />
        </div>

        <form onSubmit={handleSearch} className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar en el directorio</span>
            <span className="relative block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  clearResults();
                }}
                placeholder="Nombre, correo o DNI"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              />
            </span>
          </label>
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />}
            Buscar
          </button>
        </form>

        {activeRole === "alumno" && (
          <div className="space-y-4 rounded-xl bg-canvas p-4">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Año</span>
              <FilterChips
                label="Filtrar por año"
                options={academicYears}
                value={filterYear}
                onChange={(year) => applyFilters({ year })}
              />
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">División</span>
              <FilterChips
                label="Filtrar por división"
                options={divisions}
                value={filterDivision}
                onChange={(division) => applyFilters({ division })}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <FilterChips
            label="Filtrar por estado de cuenta"
            options={stateOptions}
            value={filterStatus}
            onChange={(status) => applyFilters({ status })}
          />
          {selectedCycle && <span className="text-xs text-slate-500">Ciclo seleccionado: {selectedCycle.nombre}</span>}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-navy">Resultados</h2>
            <p className="text-xs text-slate-500">{loading ? "Actualizando directorio..." : `${usuarios.length} usuarios`}</p>
          </div>
          {hasSearched && (
            <span className="text-xs text-slate-500">Selecciona filas para aplicar acciones en lote.</span>
          )}
        </div>
        <DataTable
          rows={usuarios}
          columns={columns}
          loading={loading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyState={emptyState}
        />
      </section>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 flex-wrap items-center justify-between gap-2 rounded-2xl bg-navy px-4 py-3 text-white shadow-2xl">
          <p className="min-w-[7rem] text-sm font-semibold">{selectedIds.length} seleccionados</p>
          <div className="flex flex-wrap items-center gap-2">
            {activeRole === "alumno" && (
              <button type="button" onClick={openAssignment} disabled={selectedCycle?.estado === "CERRADO"} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50">
                <GraduationCap size={15} /> Asignar a clase
              </button>
            )}
            <button type="button" onClick={handleBulkStatus} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20">
              <UserCheck size={15} /> Cambiar estado
            </button>
            <button type="button" onClick={exportSelected} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20">
              <Download size={15} /> Exportar
            </button>
            <button type="button" onClick={() => setSelectedIds([])} aria-label="Limpiar selección" className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {selectedUser && (
        <UsuarioDetailDrawer
          usuario={selectedUser}
          cycleId={cycleId}
          selectedCycle={selectedCycle}
          onClose={() => setSelectedUser(null)}
          onEdit={openEditUserForm}
          onManageFees={(user) => {
            setSelectedUser(null);
            setSelectedFeeStudent(user);
          }}
        />
      )}

      {showUserForm && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-navy/40 p-4 backdrop-blur-[2px]">
          <section role="dialog" aria-modal="true" aria-labelledby="user-form-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary">{editingUserId ? "Directorio" : "Nuevo registro"}</p>
                <h2 id="user-form-title" className="mt-1 text-xl font-bold text-navy">{editingUserId ? "Editar usuario" : "Crear usuario"}</h2>
              </div>
              <button type="button" onClick={() => setShowUserForm(false)} aria-label="Cerrar formulario" className="rounded-lg p-2 text-slate-500 hover:bg-canvas">
                <X size={19} />
              </button>
            </header>
            <form onSubmit={handleSaveUser} className="space-y-5 p-6">
              <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Tipo de usuario</legend>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, rol: value }))}
                      aria-pressed={form.rol === value}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition ${form.rol === value ? "border-blue-200 bg-blue-50 text-secondary" : "border-slate-200 text-slate-600 hover:bg-canvas"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Nombre completo
                  <input value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  DNI <span className="text-red-500">*</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    pattern="\d{7,8}"
                    placeholder="Ej: 40123456"
                    value={form.dni}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
                      setForm((current) => ({ ...current, dni: digits }));
                      if (dniError && /^\d{7,8}$/.test(digits)) setDniError("");
                    }}
                    required
                    aria-invalid={Boolean(dniError)}
                    className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-4 ${
                      dniError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                        : "border-slate-200 focus:border-blue-300 focus:ring-blue-50"
                    }`}
                  />
                  {dniError && <span className="mt-1 block text-xs font-medium text-red-600">{dniError}</span>}
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Correo electrónico
                <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
              </label>

              {!editingUserId && (
                <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3 text-xs text-navy" role="note">
                  <Info size={16} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
                  <p>
                    La contraseña inicial de acceso será el número de DNI del usuario (sin puntos ni espacios).
                  </p>
                </div>
              )}

              {form.rol === "alumno" && (
                <div className="grid gap-4 rounded-xl bg-canvas p-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Año
                    <select value={form.anio} onChange={(event) => setForm((current) => ({ ...current, anio: event.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
                      <option value="">Selecciona un año</option>
                      {[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>{year}° año</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    División
                    <input value={form.division} onChange={(event) => setForm((current) => ({ ...current, division: event.target.value.toUpperCase() }))} required maxLength={1} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 uppercase outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" placeholder="A" />
                  </label>
                </div>
              )}

              <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowUserForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-canvas">Cancelar</button>
                <button type="submit" disabled={savingUser} className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {savingUser ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
                  {editingUserId ? "Guardar cambios" : "Crear usuario"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {assignmentOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-navy/40 p-4 backdrop-blur-[2px]">
          <section role="dialog" aria-modal="true" aria-labelledby="bulk-assign-title" className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary">Acción masiva</p>
                <h2 id="bulk-assign-title" className="mt-1 text-xl font-bold text-navy">Asignar alumnos a una clase</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedUsers.length} alumnos · {selectedCycle?.nombre}</p>
              </div>
              <button type="button" onClick={() => setAssignmentOpen(false)} aria-label="Cerrar asignación" className="rounded-lg p-2 text-slate-500 hover:bg-canvas"><X size={19} /></button>
            </header>
            <form onSubmit={handleBulkAssign} className="space-y-5 p-6">
              <label className="block text-sm font-medium text-slate-700">
                Clase de destino
                <span className="relative mt-1.5 block">
                  <select value={classId} onChange={(event) => setClassId(event.target.value)} required disabled={loadingClasses || assigning} className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-canvas">
                    <option value="">{loadingClasses ? "Cargando clases..." : "Selecciona una clase"}</option>
                    {classOptions.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.anio}° "{course.division}" · {course.materia?.nombre || course.materiaNombre || "Materia"} · {course.diaSemana} {course.horaInicio}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </span>
              </label>
              {!loadingClasses && !classOptions.length && <p className="text-sm text-amber-800">No hay clases disponibles para el curso y división seleccionados.</p>}
              <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setAssignmentOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-canvas">Cancelar</button>
                <button type="submit" disabled={!classId || loadingClasses || assigning} className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                  {assigning ? <Loader2 size={17} className="animate-spin" /> : <GraduationCap size={17} />}
                  Asignar alumnos
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {selectedFeeStudent && (
        <AdminGestionCuotas alumno={selectedFeeStudent} onClose={() => setSelectedFeeStudent(null)} />
      )}
    </div>
  );
};

export default UsuariosAdmin;
