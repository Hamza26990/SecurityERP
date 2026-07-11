"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

type InvoiceForm = {
  client_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: string;
  status: string;
};

const today = new Date().toISOString().slice(0, 10);

const emptyForm: InvoiceForm = {
  client_id: "",
  invoice_number: "",
  invoice_date: today,
  due_date: "",
  subtotal: "",
  status: "Sent",
};

export default function InvoicesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

    const [invoiceResult, clientResult] = await Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("clients")
        .select("*")
        .order("company_name"),
    ]);

    if (invoiceResult.error) {
      setMessage(`Error: ${invoiceResult.error.message}`);
    } else {
      setInvoices(invoiceResult.data ?? []);
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

  function updateField(field: keyof InvoiceForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectClient(clientId: string) {
    const client = clients.find((item) => item.id === clientId);

    setForm((current) => ({
      ...current,
      client_id: clientId,
      subtotal: client?.monthly_invoice_amount
        ? String(client.monthly_invoice_amount)
        : current.subtotal,
    }));
  }

  async function saveInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.client_id || !form.invoice_number.trim()) {
      setMessage("Client and invoice number are required.");
      return;
    }

    const subtotal = Number(form.subtotal || 0);
    const vatAmount = subtotal * 0.05;
    const totalAmount = subtotal + vatAmount;

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("invoices").insert({
      client_id: form.client_id,
      invoice_number: form.invoice_number.trim(),
      invoice_date: form.invoice_date,
      due_date: form.due_date || null,
      subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      paid_amount: 0,
      status: form.status,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Invoice saved successfully.");
      setForm({
        ...emptyForm,
        invoice_date: new Date().toISOString().slice(0, 10),
      });
      setShowForm(false);
      await loadData();
    }

    setSaving(false);
  }

  async function markPaid(invoice: Invoice) {
    const totalAmount = Number(invoice.total_amount || 0);

    const { error } = await supabase
      .from("invoices")
      .update({
        paid_amount: totalAmount,
        status: "Paid",
      })
      .eq("id", invoice.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Invoice marked as paid.");
      await loadData();
    }
  }

  async function deleteInvoice(invoice: Invoice) {
    const confirmed = window.confirm(
      `Delete invoice ${invoice.invoice_number}?`,
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoice.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Invoice deleted.");
      await loadData();
    }
  }

  function getClientName(clientId: string) {
    return (
      clients.find((client) => client.id === clientId)?.company_name ??
      "Unknown client"
    );
  }

  function money(amount: number | null) {
    return Number(amount || 0).toLocaleString("en-AE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const totalInvoiced = invoices.reduce(
    (total, invoice) => total + Number(invoice.total_amount || 0),
    0,
  );

  const totalPaid = invoices.reduce(
    (total, invoice) => total + Number(invoice.paid_amount || 0),
    0,
  );

  const totalPending = totalInvoiced - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-slate-600">
            Create invoices and track pending client payments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? "Close Form" : "Create Invoice"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Invoiced</p>
          <p className="mt-2 text-2xl font-bold">
            AED {money(totalInvoiced)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Received</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            AED {money(totalPaid)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Pending</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            AED {money(totalPending)}
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border bg-white p-4 text-sm">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveInvoice}
          className="rounded-xl border bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-semibold">New Invoice</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.client_id}
              onChange={(event) => selectClient(event.target.value)}
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

            <input
              value={form.invoice_number}
              onChange={(event) =>
                updateField("invoice_number", event.target.value)
              }
              placeholder="Invoice number *"
              required
              className="rounded-lg border px-4 py-3"
            />

            <input
              type="date"
              value={form.invoice_date}
              onChange={(event) =>
                updateField("invoice_date", event.target.value)
              }
              className="rounded-lg border px-4 py-3"
            />

            <input
              type="date"
              value={form.due_date}
              onChange={(event) =>
                updateField("due_date", event.target.value)
              }
              className="rounded-lg border px-4 py-3"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.subtotal}
              onChange={(event) =>
                updateField("subtotal", event.target.value)
              }
              placeholder="Subtotal before 5% VAT"
              required
              className="rounded-lg border px-4 py-3"
            />

            <select
              value={form.status}
              onChange={(event) =>
                updateField("status", event.target.value)
              }
              className="rounded-lg border px-4 py-3"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
            </select>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
            <p>VAT 5%: AED {money(Number(form.subtotal || 0) * 0.05)}</p>
            <p className="font-bold">
              Total: AED {money(Number(form.subtotal || 0) * 1.05)}
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Invoice"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left">Invoice</th>
                <th className="px-5 py-3 text-left">Client</th>
                <th className="px-5 py-3 text-left">Total</th>
                <th className="px-5 py-3 text-left">Paid</th>
                <th className="px-5 py-3 text-left">Pending</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    No invoices created yet.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const pending =
                    Number(invoice.total_amount || 0) -
                    Number(invoice.paid_amount || 0);

                  return (
                    <tr key={invoice.id}>
                      <td className="px-5 py-4">
                        <div className="font-semibold">
                          {invoice.invoice_number}
                        </div>
                        <div className="text-sm text-slate-500">
                          {invoice.invoice_date}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {getClientName(invoice.client_id)}
                      </td>

                      <td className="px-5 py-4">
                        AED {money(invoice.total_amount)}
                      </td>

                      <td className="px-5 py-4 text-emerald-600">
                        AED {money(invoice.paid_amount)}
                      </td>

                      <td className="px-5 py-4 text-red-600">
                        AED {money(pending)}
                      </td>

                      <td className="px-5 py-4">
                        {invoice.status}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {invoice.status !== "Paid" && (
                          <button
                            type="button"
                            onClick={() => void markPaid(invoice)}
                            className="mr-4 font-semibold text-emerald-600"
                          >
                            Mark Paid
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => void deleteInvoice(invoice)}
                          className="font-semibold text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}