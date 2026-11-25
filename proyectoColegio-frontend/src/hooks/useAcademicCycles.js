import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getCiclos } from "../api/api";

export const AcademicCycleContext = createContext(null);

const useCycleState = (enabled) => {
  const [cycles, setCycles] = useState([]);
  const [cycleId, setCycleId] = useState("");
  const [loadingCycles, setLoadingCycles] = useState(true);

  const reloadCycles = useCallback(async () => {
    setLoadingCycles(true);
    try {
      const { data } = await getCiclos();
      const items = Array.isArray(data) ? data : [];
      setCycles(items);
      setCycleId((currentId) => {
        if (items.some((cycle) => cycle._id === currentId)) return currentId;
        const current = items.find((cycle) => ["ACTIVO", "RECUPERACION"].includes(cycle.estado));
        return (current || items[0])?._id || "";
      });
    } catch (error) {
      console.error("Error cargando ciclos lectivos:", error);
      toast.error(error.response?.data?.msg || "No se pudieron cargar los ciclos lectivos.");
    } finally {
      setLoadingCycles(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) reloadCycles();
  }, [enabled, reloadCycles]);

  const selectedCycle = useMemo(
    () => cycles.find((cycle) => cycle._id === cycleId) || null,
    [cycles, cycleId],
  );

  return { cycles, cycleId, setCycleId, selectedCycle, loadingCycles, reloadCycles };
};

export const AcademicCycleProvider = ({ children }) =>
  createElement(AcademicCycleContext.Provider, { value: useCycleState(true) }, children);

export const useAcademicCycles = () => {
  const sharedState = useContext(AcademicCycleContext);
  const localState = useCycleState(!sharedState);
  return sharedState || localState;
};
