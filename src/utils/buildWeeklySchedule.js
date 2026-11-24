const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const SLOTS_PER_DAY = 6;
const SLOT_DURATION_MINUTES = 45;
const SLOTS_PER_WEEK = DAYS.length * SLOTS_PER_DAY;
const FIRST_SLOT_MINUTES = 8 * 60;

const formatTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const parseTime = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const overlaps = (start, end, reservedStart, reservedEnd) =>
  start < reservedEnd && reservedStart < end;

export const buildWeeklySchedule = (subjects, teacherIds, reservedClasses = []) => {
  if (!subjects.length) throw new Error("No hay materias activas para programar.");
  if (!teacherIds.length) throw new Error("No hay docentes activos para asignar.");

  const reservedGroupTimes = new Map();
  const reservedTeacherTimes = new Map();
  for (const reserved of reservedClasses) {
    const groupKey = `${reserved.anio}|${reserved.division}|${reserved.diaSemana}`;
    const groupTimes = reservedGroupTimes.get(groupKey) ?? [];
    groupTimes.push({
      start: parseTime(reserved.horaInicio),
      end: parseTime(reserved.horaFin),
    });
    reservedGroupTimes.set(groupKey, groupTimes);

    for (const teacherId of reserved.profesorIds) {
      const teacherTimes = reservedTeacherTimes.get(teacherId) ?? new Map();
      const dayTimes = teacherTimes.get(reserved.diaSemana) ?? [];
      dayTimes.push({
        start: parseTime(reserved.horaInicio),
        end: parseTime(reserved.horaFin),
      });
      teacherTimes.set(reserved.diaSemana, dayTimes);
      reservedTeacherTimes.set(teacherId, teacherTimes);
    }
  }

  const groups = new Map();
  for (const subject of subjects) {
    const key = `${subject.anio}|${subject.division}`;
    if (!groups.has(key)) {
      groups.set(key, { anio: Number(subject.anio), division: subject.division, subjects: [] });
    }
    groups.get(key).subjects.push(subject);
  }

  const orderedGroups = [...groups.values()].sort(
    (left, right) => left.anio - right.anio || left.division.localeCompare(right.division),
  );
  const usedGroupSlots = new Map();
  const usedTeachersBySlot = new Map();
  const schedule = [];
  let nextTeacherIndex = 0;

  for (const group of orderedGroups) {
    group.subjects.sort((left, right) => left.nombre.localeCompare(right.nombre));
    if (group.subjects.length > SLOTS_PER_WEEK) {
      throw new Error(`El año ${group.anio}, división ${group.division} supera los bloques semanales disponibles.`);
    }

    for (let subjectIndex = 0; subjectIndex < group.subjects.length; subjectIndex += 1) {
      const subject = group.subjects[subjectIndex];
      const preferredSlot = group.subjects.length === 1
        ? 0
        : Math.round(subjectIndex * (SLOTS_PER_WEEK - 1) / (group.subjects.length - 1));
      const groupKey = `${group.anio}|${group.division}`;
      const occupiedGroupSlots = usedGroupSlots.get(groupKey) ?? new Set();
      const candidateSlots = Array.from({ length: SLOTS_PER_WEEK }, (_, slotIndex) => slotIndex)
        .sort((left, right) =>
          Math.abs(left - preferredSlot) - Math.abs(right - preferredSlot) || left - right,
        );
      let selected = null;

      for (const slotIndex of candidateSlots) {
        if (occupiedGroupSlots.has(slotIndex)) continue;

        const dayIndex = Math.floor(slotIndex / SLOTS_PER_DAY);
        const periodIndex = slotIndex % SLOTS_PER_DAY;
        const startMinutes = FIRST_SLOT_MINUTES + periodIndex * SLOT_DURATION_MINUTES;
        const endMinutes = startMinutes + SLOT_DURATION_MINUTES;
        const day = DAYS[dayIndex];
        const reservedGroupKey = `${group.anio}|${group.division}|${day}`;
        const groupHasReservation = (reservedGroupTimes.get(reservedGroupKey) ?? []).some(
          (reservation) => overlaps(startMinutes, endMinutes, reservation.start, reservation.end),
        );
        if (groupHasReservation) continue;

        const usedTeachers = usedTeachersBySlot.get(slotIndex) ?? new Set();
        let selectedTeacherIndex = -1;
        for (let offset = 0; offset < teacherIds.length; offset += 1) {
          const candidateIndex = (nextTeacherIndex + offset) % teacherIds.length;
          const teacherId = teacherIds[candidateIndex];
          const reservedTimes = reservedTeacherTimes.get(teacherId)?.get(day) ?? [];
          const teacherHasReservation = reservedTimes.some(
            (reservation) => overlaps(startMinutes, endMinutes, reservation.start, reservation.end),
          );
          if (!usedTeachers.has(teacherId) && !teacherHasReservation) {
            selectedTeacherIndex = candidateIndex;
            break;
          }
        }
        if (selectedTeacherIndex < 0) continue;

        selected = {
          slotIndex,
          dayIndex,
          startMinutes,
          endMinutes,
          selectedTeacherIndex,
          usedTeachers,
        };
        break;
      }
      if (!selected) {
        throw new Error(`No hay horario o docente disponible para el año ${group.anio}, división ${group.division}.`);
      }

      const teacherId = teacherIds[selected.selectedTeacherIndex];
      occupiedGroupSlots.add(selected.slotIndex);
      usedGroupSlots.set(groupKey, occupiedGroupSlots);
      selected.usedTeachers.add(teacherId);
      usedTeachersBySlot.set(selected.slotIndex, selected.usedTeachers);
      nextTeacherIndex = (selected.selectedTeacherIndex + 1) % teacherIds.length;
      schedule.push({
        materiaId: subject.id,
        anio: group.anio,
        division: group.division,
        diaSemana: DAYS[selected.dayIndex],
        horaInicio: formatTime(selected.startMinutes),
        horaFin: formatTime(selected.endMinutes),
        duracion: SLOT_DURATION_MINUTES,
        profesorId: teacherId,
      });
    }
  }

  return schedule;
};
