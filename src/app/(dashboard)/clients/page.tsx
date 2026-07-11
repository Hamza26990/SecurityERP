"use client";

import { FormEvent, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Client = Database["public"]["Tables"]["clients"]["Row"];

type ClientForm = {
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  billing_address: string;
  contract_start: string;
  contract_end: string;
  monthly_invoice_amount: string;
  payment_terms_days: string;
  status: string;
};

const emptyForm: ClientForm = {
  company_name: "",
  contact_person: "",
  phone: "",
  email: "",
  billing_address: "",
  contract_start: "",
  contract_end: "",
  monthly_invoice_amount: "",
  payment_terms_days: "30",
  status: "Active",
};

export default function ClientsPage() {
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadClients() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setClients(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadClients();
  }, []);

  function updateField(field: keyof ClientForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.company_name.trim()) {
      setMessage("Company name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("clients").insert({
      company_name: form.company_name.trim(),
      contact_person: form.contact_person.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      billing_address: form.billing_address.trim() || null,
      contract_start: form.contract_start || null,
      contract_end: form.contract_end || null,
      monthly_invoice_amount: Number(form.monthly_invoice_amount || 0),
      payment_terms_days: Number(form.payment_terms_days || 30),
      status: form.status,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Client added successfully.");
      setForm(emptyForm);
      setShowForm(false);
      await loadClients();
    }

    setSaving(false);
  }

  async function deleteClient(id: string, companyName: string) {
    const confirmed = window.confirm(
      `Delete ${companyName}? This cannot be undone.`,
    );

    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Client deleted.");
      await loadClients();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="mt-1 text-slate-600">
            Manage client details, contracts and monthly billing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? "Close Form" : "Add Client"}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={addClient}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-semibold text-slate-900">
            New Client
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.company_name}
              onChange={(event) =>
                updateField("company_name", event.target.value)
              }
              placeholder="Company name *"
              className="rounded-lg border border-slate-300 px-4 py-3"
              required
            />

            <input
              value={form.contact_person}
              onChange={(event) =>
                updateField("contact_person", event.target.value)
              }
              placeholder="Contact person"
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="Phone"
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="Email"
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              type="date"
              value={form.contract_start}
              onChange={(event) =>
                updateField("contract_start", event.target.value)
              }
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              type="date"
              value={form.contract_end}
              onChange={(event) =>
                updateField("contract_end", event.target.value)
              }
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monthly_invoice_amount}
              onChange={(event) =>
                updateField("monthly_invoice_amount", event.target.value)
              }
              placeholder="Monthly invoice amount"
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              type="number"
              min="0"
              value={form.payment_terms_days}
              onChange={(event) =>
                updateField("payment_terms_days", event.target.value)
              }
              placeholder="Payment terms in days"
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <textarea
              value={form.billing_address}
              onChange={(event) =>
                updateField("billing_address", event.target.value)
              }
              placeholder="Billing address"
              className="min-h-24 rounded-lg border border-slate-300 px-4 py-3 md:col-span-2"
            />

            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
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
            {saving ? "Saving..." : "Save Client"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Company
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Contact
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Monthly Invoice
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
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No clients added yet.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {client.company_name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {client.email || "No email"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div>{client.contact_person || "-"}</div>
                      <div className="text-sm text-slate-500">
                        {client.phone || "-"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      AED{" "}
                      {Number(client.monthly_invoice_amount || 0).toLocaleString(
                        "en-AE",
                        {
                          minimumFractionDigits: 2,
                        },
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                        {client.status || "Active"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          void deleteClient(client.id, client.company_name)
                        }
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