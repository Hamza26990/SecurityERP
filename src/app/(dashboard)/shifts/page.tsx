"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Shift = Database["public"]["Tables"]["shifts"]["Row"];
type Employee = Database["public"]["Tables"]["employees"]["Row"];
type Site = Database["public"]["Tables"]["sites"]["Row"];

type ShiftForm = {
  employee_id: string;
  site_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: string;
};

const emptyForm: ShiftForm = {
  employee_id: "",
  site_id: "",
  shift_date: new Date().toISOString().slice(0, 10),
  start_time: "08:00",
  end_time: "20:00",
  status: "Scheduled",
};

export default function ShiftsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [form, setForm] = useState<ShiftForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

    const [shiftsResult, employeesResult, sitesResult] = await Promise.all([
      supabase
        .from("shifts")
        .select("*")
        .order("shift_date", { ascending: false }),

      supabase
        .from("employees")
        .select("*")
        .eq("status", "Active")
        .order("full_name"),

      supabase
        .from("sites")
        .select("*")
        .eq("status", "Active")
        .order("site_name"),
    ]);

    if (shiftsResult.error) {
      setMessage(`Error: ${shiftsResult.error.message}`);
    } else {
      setShifts(shiftsResult.data ?? []);
    }

    if (employeesResult.error) {
      setMessage(`Error: ${employeesResult.error.message}`);
    } else {
      setEmployees(employeesResult.data ?? []);
    }

    if (sitesResult.error) {
      setMessage(`Error: ${sitesResult.error.message}`);
    } else {
      setSites(sitesResult.data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  function updateField(field: keyof ShiftForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.employee_id || !form.site_id || !form.shift_date) {
      setMessage("Employee, site and date are required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("shifts").insert({
      employee_id: form.employee_id,
      site_id: form.site_id,
      shift_date: form.shift_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      status: form.status,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Shift assigned successfully.");
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    }

    setSaving(false);
  }

  async function deleteShift(shift: Shift) {
    if (!window.confirm("Delete this shift?")) return;

    const { error } = await supabase
      .from("shifts")
      .delete()
      .eq("id", shift.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Shift deleted.");
      await loadData();
    }
  }

  function employeeName(id: string) {
    return employees.find((employee) => employee.id === id)?.full_name ?? "Unknown";
  }

  function siteName(id: string) {
    return sites.find((site) => site.id === id)?.site_name ?? "Unknown";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shift Scheduling</h1>
          <p className="mt-1 text-slate-600">
            Assign guards and cleaners to client sites.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          {showForm ? "Close Form" : "Assign Shift"}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border bg-white p-4 text-sm">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveShift}
          className="rounded-xl border bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-semibold">New Shift</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.employee_id}
              onChange={(event) =>
                updateField("employee_id", event.target.value)
              }
              required
              className="rounded-lg border px-4 py-3"
            >
              <option value="">Select employee *</option>

              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} — {employee.role}
                </option>
              ))}
            </select>

            <select
              value={form.site_id}
              onChange={(event) => updateField("site_id", event.target.value)}
              required
              className="rounded-lg border px-4 py-3"
            >
              <option value="">Select site *</option>

              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.site_name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={form.shift_date}
              onChange={(event) =>
                updateField("shift_date", event.target.value)
              }
              required
              className="rounded-lg border px-4 py-3"
            />

            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="rounded-lg border px-4 py-3"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <input
              type="time"
              value={form.start_time}
              onChange={(event) =>
                updateField("start_time", event.target.value)
              }
              className="rounded-lg border px-4 py-3"
            />

            <input
              type="time"
              value={form.end_time}
              onChange={(event) =>
                updateField("end_time", event.target.value)
              }
              className="rounded-lg border px-4 py-3"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Shift"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left">Employee</th>
                <th className="px-5 py-3 text-left">Site</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Time</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    Loading shifts...
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    No shifts assigned.
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="px-5 py-4 font-semibold">
                      {employeeName(shift.employee_id)}
                    </td>

                    <td className="px-5 py-4">
                      {siteName(shift.site_id)}
                    </td>

                    <td className="px-5 py-4">
                      {shift.shift_date}
                    </td>

                    <td className="px-5 py-4">
                      {shift.start_time || "-"} to {shift.end_time || "-"}
                    </td>

                    <td className="px-5 py-4">
                      {shift.status || "Scheduled"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void deleteShift(shift)}
                        className="font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}