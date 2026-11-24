import test from "node:test";
import assert from "node:assert/strict";
import { buildWeeklySchedule } from "./buildWeeklySchedule.js";

test("schedules each subject once in 45-minute weekday slots without group or teacher overlaps", () => {
  const subjects = [
    { id: "01", nombre: "Lengua", anio: 1, division: "A" },
    { id: "02", nombre: "Matemática", anio: 1, division: "A" },
    { id: "03", nombre: "Historia", anio: 1, division: "B" },
    { id: "04", nombre: "Biología", anio: 1, division: "B" },
  ];
  const schedule = buildWeeklySchedule(subjects, ["t1", "t2"]);

  assert.equal(schedule.length, subjects.length);
  assert.equal(new Set(schedule.map(({ materiaId }) => materiaId)).size, subjects.length);
  for (const item of schedule) {
    assert.equal(item.duracion, 45);
    assert.match(item.horaInicio, /^0[89]:|^1[01]:/);
    assert.match(item.horaFin, /^0[89]:|^1[01]:|^12:30$/);
    assert.ok(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].includes(item.diaSemana));
  }

  const groupSlots = new Set();
  const teacherSlots = new Set();
  for (const item of schedule) {
    const slot = `${item.diaSemana}|${item.horaInicio}`;
    const groupSlot = `${item.anio}|${item.division}|${slot}`;
    const teacherSlot = `${item.profesorId}|${slot}`;
    assert.ok(!groupSlots.has(groupSlot));
    assert.ok(!teacherSlots.has(teacherSlot));
    groupSlots.add(groupSlot);
    teacherSlots.add(teacherSlot);
  }
});

test("moves a class to a free block when a teacher is otherwise double-booked", () => {
  const subjects = [
    { id: "01", nombre: "Lengua", anio: 1, division: "A" },
    { id: "02", nombre: "Lengua", anio: 1, division: "B" },
  ];

  const schedule = buildWeeklySchedule(subjects, ["t1"]);

  assert.equal(schedule.length, 2);
  assert.notEqual(
    `${schedule[0].diaSemana}|${schedule[0].horaInicio}`,
    `${schedule[1].diaSemana}|${schedule[1].horaInicio}`,
  );
});

test("keeps new classes clear of preserved group and teacher reservations", () => {
  const subjects = [
    { id: "01", nombre: "Lengua", anio: 1, division: "A" },
    { id: "02", nombre: "Lengua", anio: 1, division: "B" },
  ];
  const reservations = [
    {
      anio: 1,
      division: "A",
      diaSemana: "Lunes",
      horaInicio: "08:00",
      horaFin: "09:30",
      profesorIds: ["t1"],
    },
  ];
  const schedule = buildWeeklySchedule(subjects, ["t1", "t2"], reservations);

  assert.equal(schedule[0].horaInicio, "09:30");
  assert.equal(schedule[1].horaInicio, "08:00");
  assert.equal(schedule[1].profesorId, "t2");
});
