"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Site = Database["public"]["Tables"]["sites"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

type SiteForm = {
  client_id: string;
  site_name: string;
  address: string;
  monthly_client_amount: string;
  status: string;
};

const emptyForm: SiteForm = {
  client_id: "",
  site_name: "",
  address: "",
  monthly_client_amount: "",
  status: "Active",
};

export default function SitesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [sites, setSites] = useState<Site[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<SiteForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

    const [sitesResult, clientsResult] = await Promise.all([
      supabase.from("sites").select("*").order("created_at", {
        ascending: false,
      }),
      supabase.from("clients").select("*").order("company_name"),
    ]);

    if (sitesResult.error) {
      setMessage(`Error: ${sitesResult.error.message}`);
    } else {
      setSites(sitesResult.data ?? []);
    }

    if (clientsResult.error) {
      setMessage(`Error: ${clientsResult.error.message}`);
    } else {
      setClients(clientsResult.data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  function updateField(field: keyof SiteForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.client_id || !form.site_name.trim()) {
      setMessage("Client and site name are required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("sites").insert({
      client_id: form.client_id,
      site_name: form.site_name.trim(),
      address: form.address.trim() || null,
      monthly_client_amount: Number(form.monthly_client_amount || 0),
      status: form.status,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Site saved successfully.");
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    }

    setSaving(false);
  }

  async function deleteSite(site: Site) {
    const confirmed = window.confirm(`Delete ${site.site_name}?`);

    if (!confirmed) return;

    const { error } = await supabase
      .from("sites")
      .delete()
      .eq("id", site.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Site deleted.");
      await loadData();
    }
  }

  function getClientName(clientId: string) {
    return (
      clients.find((client) => client.id === clientId)?.company_name ??
      "Unknown client"
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sites</h1>
          <p className="mt-1 text-slate-600">
            Manage client locations and monthly contract amounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? "Close Form" : "Add Site"}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveSite}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-semibold text-slate-900">
            New Site
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.client_id}
              onChange={(event) =>
                updateField("client_id", event.target.value)
              }
              required
              className="rounded-lg border border-slate-300 px-4 py-3"
            >
              <option value="">Select client *</option>

              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>

            <input
              value={form.site_name}
              onChange={(event) =>
                updateField("site_name", event.target.value)
              }
              placeholder="Site name *"
              required
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              value={form.address}
              onChange={(event) =>
                updateField("address", event.target.value)
              }
              placeholder="Site address"
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monthly_client_amount}
              onChange={(event) =>
                updateField("monthly_client_amount", event.target.value)
              }
              placeholder="Monthly client amount"
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
            {saving ? "Saving..." : "Save Site"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Site
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Client
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Monthly Amount
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
                    Loading sites...
                  </td>
                </tr>
              ) : sites.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No sites added yet.
                  </td>
                </tr>
              ) : (
                sites.map((site) => (
                  <tr key={site.id}>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {site.site_name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {site.address || "No address"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {getClientName(site.client_id)}
                    </td>

                    <td className="px-5 py-4">
                      AED{" "}
                      {Number(site.monthly_client_amount || 0).toLocaleString(
                        "en-AE",
                        { minimumFractionDigits: 2 },
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {site.status || "Active"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void deleteSite(site)}
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