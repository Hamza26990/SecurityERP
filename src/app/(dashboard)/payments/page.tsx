"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

type PaymentForm = {
  invoice_id: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  notes: string;
};

const today = new Date().toISOString().slice(0, 10);

const emptyForm: PaymentForm = {
  invoice_id: "",
  amount: "",
  payment_date: today,
  payment_method: "Bank Transfer",
  reference_number: "",
  notes: "",
};

export default function PaymentsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<PaymentForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

    const [paymentsResult, invoicesResult, clientsResult] = await Promise.all([
      supabase
        .from("payments")
        .select("*")
        .order("payment_date", { ascending: false }),

      supabase
        .from("invoices")
        .select("*")
        .order("invoice_date", { ascending: false }),

      supabase.from("clients").select("*").order("company_name"),
    ]);

    if (paymentsResult.error) {
      setMessage(`Error: ${paymentsResult.error.message}`);
    } else {
      setPayments(paymentsResult.data ?? []);
    }

    if (invoicesResult.error) {
      setMessage(`Error: ${invoicesResult.error.message}`);
    } else {
      setInvoices(invoicesResult.data ?? []);
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

  function updateField(field: keyof PaymentForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function getInvoice(invoiceId: string) {
    return invoices.find((invoice) => invoice.id === invoiceId);
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

  function selectInvoice(invoiceId: string) {
    const invoice = getInvoice(invoiceId);

    const pendingAmount = invoice
      ? Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0)
      : 0;

    setForm((current) => ({
      ...current,
      invoice_id: invoiceId,
      amount: pendingAmount > 0 ? String(pendingAmount) : "",
    }));
  }

  async function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const invoice = getInvoice(form.invoice_id);
    const paymentAmount = Number(form.amount || 0);

    if (!invoice) {
      setMessage("Please select an invoice.");
      return;
    }

    if (paymentAmount <= 0) {
      setMessage("Payment amount must be greater than zero.");
      return;
    }

    const currentPaid = Number(invoice.paid_amount || 0);
    const totalAmount = Number(invoice.total_amount || 0);
    const pendingAmount = totalAmount - currentPaid;

    if (paymentAmount > pendingAmount) {
      setMessage(
        `Payment cannot exceed the pending amount of AED ${money(
          pendingAmount,
        )}.`,
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const { error: paymentError } = await supabase.from("payments").insert({
      invoice_id: invoice.id,
      amount: paymentAmount,
      payment_date: form.payment_date,
      payment_method: form.payment_method || null,
      reference_number: form.reference_number.trim() || null,
      notes: form.notes.trim() || null,
    });

    if (paymentError) {
      setMessage(`Error: ${paymentError.message}`);
      setSaving(false);
      return;
    }

    const newPaidAmount = currentPaid + paymentAmount;

    let newStatus = "Partially Paid";

    if (newPaidAmount >= totalAmount) {
      newStatus = "Paid";
    }

    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
      })
      .eq("id", invoice.id);

    if (invoiceError) {
      setMessage(
        `Payment saved, but invoice update failed: ${invoiceError.message}`,
      );
    } else {
      setMessage("Payment saved successfully.");
    }

    setForm({
      ...emptyForm,
      payment_date: new Date().toISOString().slice(0, 10),
    });

    setShowForm(false);
    await loadData();
    setSaving(false);
  }

  async function deletePayment(payment: Payment) {
    const confirmed = window.confirm("Delete this payment?");

    if (!confirmed) return;

    const invoice = getInvoice(payment.invoice_id);

    const { error: paymentError } = await supabase
      .from("payments")
      .delete()
      .eq("id", payment.id);

    if (paymentError) {
      setMessage(`Error: ${paymentError.message}`);
      return;
    }

    if (invoice) {
      const newPaidAmount = Math.max(
        0,
        Number(invoice.paid_amount || 0) - Number(payment.amount || 0),
      );

      let newStatus = "Sent";

      if (newPaidAmount > 0) {
        newStatus = "Partially Paid";
      }

      if (newPaidAmount >= Number(invoice.total_amount || 0)) {
        newStatus = "Paid";
      }

      await supabase
        .from("invoices")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
        })
        .eq("id", invoice.id);
    }

    setMessage("Payment deleted.");
    await loadData();
  }

  const totalReceived = payments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0,
  );

  const totalPending = invoices.reduce(
    (total, invoice) =>
      total +
      Math.max(
        0,
        Number(invoice.total_amount || 0) -
          Number(invoice.paid_amount || 0),
      ),
    0,
  );

  const selectedInvoice = getInvoice(form.invoice_id);

  const selectedPending = selectedInvoice
    ? Number(selectedInvoice.total_amount || 0) -
      Number(selectedInvoice.paid_amount || 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>

          <p className="mt-1 text-slate-600">
            Record client payments and track outstanding balances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? "Close Form" : "Record Payment"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Received</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            AED {money(totalReceived)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Outstanding</p>
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
          onSubmit={savePayment}
          className="rounded-xl border bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-semibold">New Payment</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.invoice_id}
              onChange={(event) => selectInvoice(event.target.value)}
              required
              className="rounded-lg border px-4 py-3"
            >
              <option value="">Select invoice *</option>

              {invoices
                .filter(
                  (invoice) =>
                    Number(invoice.paid_amount || 0) <
                    Number(invoice.total_amount || 0),
                )
                .map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} -{" "}
                    {getClientName(invoice.client_id)}
                  </option>
                ))}
            </select>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) =>
                updateField("amount", event.target.value)
              }
              placeholder="Payment amount *"
              required
              className="rounded-lg border px-4 py-3"
            />

            <input
              type="date"
              value={form.payment_date}
              onChange={(event) =>
                updateField("payment_date", event.target.value)
              }
              required
              className="rounded-lg border px-4 py-3"
            />

            <select
              value={form.payment_method}
              onChange={(event) =>
                updateField("payment_method", event.target.value)
              }
              className="rounded-lg border px-4 py-3"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>

            <input
              value={form.reference_number}
              onChange={(event) =>
                updateField("reference_number", event.target.value)
              }
              placeholder="Reference number"
              className="rounded-lg border px-4 py-3"
            />

            <textarea
              value={form.notes}
              onChange={(event) =>
                updateField("notes", event.target.value)
              }
              placeholder="Notes"
              className="rounded-lg border px-4 py-3"
            />
          </div>

          {selectedInvoice && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
              <p>
                Invoice total: AED {money(selectedInvoice.total_amount)}
              </p>
              <p>
                Already paid: AED {money(selectedInvoice.paid_amount)}
              </p>
              <p className="font-bold text-red-600">
                Pending: AED {money(selectedPending)}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Payment"}
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
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Method</th>
                <th className="px-5 py-3 text-left">Reference</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const invoice = getInvoice(payment.invoice_id);

                  return (
                    <tr key={payment.id}>
                      <td className="px-5 py-4">
                        {invoice?.invoice_number ?? "Unknown invoice"}
                      </td>

                      <td className="px-5 py-4">
                        {invoice
                          ? getClientName(invoice.client_id)
                          : "Unknown client"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-emerald-600">
                        AED {money(payment.amount)}
                      </td>

                      <td className="px-5 py-4">
                        {payment.payment_date}
                      </td>

                      <td className="px-5 py-4">
                        {payment.payment_method || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {payment.reference_number || "-"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void deletePayment(payment)}
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