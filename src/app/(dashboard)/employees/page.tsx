"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

type EmployeeForm = {
  employee_number: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  basic_salary: string;
  status: string;
};

const emptyForm: EmployeeForm = {
  employee_number: "",
  full_name: "",
  email: "",
  phone: "",
  role: "Guard",
  basic_salary: "",
  status: "Active",
};

export default function EmployeesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadEmployees() {
    setLoading(true);

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setEmployees(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadEmployees();
  }, []);

  function updateField(field: keyof EmployeeForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.full_name.trim()) {
      setMessage("Full name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("employees").insert({
      employee_number: form.employee_number.trim() || null,
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      role: form.role,
      basic_salary: Number(form.basic_salary || 0),
      status: form.status,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Employee saved successfully.");
      setForm(emptyForm);
      setShowForm(false);
      await loadEmployees();
    }

    setSaving(false);
  }

  async function deleteEmployee(employee: Employee) {
    const confirmed = window.confirm(
      `Delete ${employee.full_name}?`,
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", employee.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Employee deleted.");
      await loadEmployees();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employees</h1>

          <p className="mt-1 text-slate-600">
            Manage security guards, supervisors and office staff.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? "Close Form" : "Add Employee"}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveEmployee}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-semibold text-slate-900">
            New Employee
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.employee_number}
              onChange={(event) =>
                updateField("employee_number", event.target.value)
              }
              placeholder="Employee number"
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              value={form.full_name}
              onChange={(event) =>
                updateField("full_name", event.target.value)
              }
              placeholder="Full name *"
              required
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                updateField("email", event.target.value)
              }
              placeholder="Email"
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              value={form.phone}
              onChange={(event) =>
                updateField("phone", event.target.value)
              }
              placeholder="Phone"
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <select
              value={form.role}
              onChange={(event) =>
                updateField("role", event.target.value)
              }
              className="rounded-lg border border-slate-300 px-4 py-3"
            >
              <option value="Guard">Guard</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Admin">Admin</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.basic_salary}
              onChange={(event) =>
                updateField("basic_salary", event.target.value)
              }
              placeholder="Basic salary in AED"
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <select
              value={form.status}
              onChange={(event) =>
                updateField("status", event.target.value)
              }
              className="rounded-lg border border-slate-300 px-4 py-3"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Employee"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Employee
                </th>

                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Role
                </th>

                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Salary
                </th>

                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-sm font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No employees added yet.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {employee.full_name}
                      </div>

                      <div className="text-sm text-slate-500">
                        {employee.employee_number || "No employee number"}
                      </div>

                      <div className="text-sm text-slate-500">
                        {employee.phone || employee.email || "No contact"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {employee.role}
                    </td>

                    <td className="px-5 py-4">
                      AED{" "}
                      {Number(employee.basic_salary || 0).toLocaleString(
                        "en-AE",
                        {
                          minimumFractionDigits: 2,
                        },
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {employee.status || "Active"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void deleteEmployee(employee)}
                        className="font-semibold text-red-600 hover:text-red-800"
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