"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Timesheet = Database["public"]["Tables"]["timesheets"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

type TimesheetForm = {
  client_id: string;
  month: string;
  year: string;
  total_hours: string;
  status: string;
};

const currentDate = new Date();

const emptyForm: TimesheetForm = {
  client_id: "",
  month: String(currentDate.getMonth() + 1),
  year: String(currentDate.getFullYear()),
  total_hours: "",
  status: "Pending",
};

const monthNames = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function TimesheetsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<TimesheetForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

    const [timesheetResult, clientResult] = await Promise.all([
      supabase
        .from("timesheets")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false }),

      supabase.from("clients").select("*").order("company_name"),
    ]);

    if (timesheetResult.error) {
      setMessage(`Error: ${timesheetResult.error.message}`);
    } else {
      setTimesheets(timesheetResult.data ?? []);
    }

    if (clientResult.error) {
      setMessage(`Error: ${clientResult.error.message}`);
    } else {
      setClients(clientResult.data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  function updateField(field: keyof TimesheetForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function getClientName(clientId: string) {
    return (
      clients.find((client) => client.id === clientId)?.company_name ??
      "Unknown client"
    );
  }

  async function saveTimesheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.client_id) {
      setMessage("Please select a client.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("timesheets").insert({
      client_id: form.client_id,
      month: Number(form.month),
      year: Number(form.year),
      total_hours: Number(form.total_hours || 0),
      status: form.status,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Timesheet saved successfully.");
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    }

    setSaving(false);
  }

  async function updateStatus(timesheet: Timesheet, status: string) {
    const updates: {
      status: string;
      sent_date?: string;
      approved_date?: string;
    } = { status };

    if (status === "Sent") {
      updates.sent_date = new Date().toISOString().slice(0, 10);
    }

    if (status === "Approved") {
      updates.approved_date = new Date().toISOString().slice(0, 10);
    }

    const { error } = await supabase
      .from("timesheets")
      .update(updates)
      .eq("id", timesheet.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(`Timesheet marked as ${status}.`);
      await loadData();
    }
  }

  async function deleteTimesheet(timesheet: Timesheet) {
    const confirmed = window.confirm("Delete this timesheet?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("timesheets")
      .delete()
      .eq("id", timesheet.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Timesheet deleted.");
      await loadData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Timesheets</h1>
          <p className="mt-1 text-slate-600">
            Create and track monthly client timesheets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          {showForm ? "Close Form" : "Create Timesheet"}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border bg-white p-4 text-sm">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveTimesheet}
          className="rounded-xl border bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-semibold">New Timesheet</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.client_id}
              onChange={(event) =>
                updateField("client_id", event.target.value)
              }
              required
              className="rounded-lg border px-4 py-3"
            >
              <option value="">Select client *</option>

              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>

            <select
              value={form.month}
              onChange={(event) => updateField("month", event.target.value)}
              className="rounded-lg border px-4 py-3"
            >
              {monthNames.slice(1).map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={form.year}
              onChange={(event) => updateField("year", event.target.value)}
              placeholder="Year"
              className="rounded-lg border px-4 py-3"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.total_hours}
              onChange={(event) =>
                updateField("total_hours", event.target.value)
              }
              placeholder="Total hours"
              className="rounded-lg border px-4 py-3"
            />

            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="rounded-lg border px-4 py-3"
            >
              <option value="Pending">Pending</option>
              <option value="Sent">Sent</option>
              <option value="Approved">Approved</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Timesheet"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left">Client</th>
                <th className="px-5 py-3 text-left">Month</th>
                <th className="px-5 py-3 text-left">Hours</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    Loading timesheets...
                  </td>
                </tr>
              ) : timesheets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    No timesheets created yet.
                  </td>
                </tr>
              ) : (
                timesheets.map((timesheet) => (
                  <tr key={timesheet.id}>
                    <td className="px-5 py-4 font-semibold">
                      {getClientName(timesheet.client_id)}
                    </td>

                    <td className="px-5 py-4">
                      {monthNames[timesheet.month]} {timesheet.year}
                    </td>

                    <td className="px-5 py-4">
                      {Number(timesheet.total_hours || 0).toFixed(2)}
                    </td>

                    <td className="px-5 py-4">
                      {timesheet.status || "Pending"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {timesheet.status === "Pending" && (
                        <button
                          type="button"
                          onClick={() => void updateStatus(timesheet, "Sent")}
                          className="mr-3 font-semibold text-blue-600"
                        >
                          Mark Sent
                        </button>
                      )}

                      {timesheet.status === "Sent" && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(timesheet, "Approved")
                          }
                          className="mr-3 font-semibold text-emerald-600"
                        >
                          Approve
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void deleteTimesheet(timesheet)}
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