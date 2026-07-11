"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

type DashboardStats = {
  clients: number;
  employees: number;
  sites: number;
  attendanceToday: number;
  invoiced: number;
  received: number;
  outstanding: number;
};

const emptyStats: DashboardStats = {
  clients: 0,
  employees: 0,
  sites: 0,
  attendanceToday: 0,
  invoiced: 0,
  received: 0,
  outstanding: 0,
};

function localDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);

  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    const today = localDate();

    const [
      clientsResult,
      employeesResult,
      sitesResult,
      attendanceResult,
      invoicesResult,
    ] = await Promise.all([
      supabase.from("clients").select("*", {
        count: "exact",
        head: true,
      }),

      supabase.from("employees").select("*", {
        count: "exact",
        head: true,
      }),

      supabase.from("sites").select("*", {
        count: "exact",
        head: true,
      }),

      supabase
        .from("attendance")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("attendance_date", today),

      supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    const clientListResult = await supabase
      .from("clients")
      .select("*")
      .order("company_name");

    const error =
      clientsResult.error ||
      employeesResult.error ||
      sitesResult.error ||
      attendanceResult.error ||
      invoicesResult.error ||
      clientListResult.error;

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    const invoiceList = invoicesResult.data ?? [];

    const totalInvoiced = invoiceList.reduce(
      (total, invoice) => total + Number(invoice.total_amount || 0),
      0,
    );

    const totalReceived = invoiceList.reduce(
      (total, invoice) => total + Number(invoice.paid_amount || 0),
      0,
    );

    setStats({
      clients: clientsResult.count ?? 0,
      employees: employeesResult.count ?? 0,
      sites: sitesResult.count ?? 0,
      attendanceToday: attendanceResult.count ?? 0,
      invoiced: totalInvoiced,
      received: totalReceived,
      outstanding: totalInvoiced - totalReceived,
    });

    setInvoices(invoiceList.slice(0, 5));
    setClients(clientListResult.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  function money(amount: number) {
    return amount.toLocaleString("en-AE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function clientName(clientId: string) {
    return (
      clients.find((client) => client.id === clientId)?.company_name ??
      "Unknown client"
    );
  }

  const cards = [
    {
      title: "Total Clients",
      value: String(stats.clients),
    },
    {
      title: "Total Employees",
      value: String(stats.employees),
    },
    {
      title: "Active Sites",
      value: String(stats.sites),
    },
    {
      title: "Attendance Today",
      value: String(stats.attendanceToday),
    },
    {
      title: "Total Invoiced",
      value: `AED ${money(stats.invoiced)}`,
    },
    {
      title: "Total Received",
      value: `AED ${money(stats.received)}`,
    },
    {
      title: "Outstanding",
      value: `AED ${money(stats.outstanding)}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Company Dashboard
          </h1>

          <p className="mt-1 text-slate-600">
            AL HISAN AL ABYADH SECURITY SERVICES L.L.C
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Refresh Dashboard
        </button>
      </div>

      {message && (
        <div className="rounded-lg border bg-white p-4 text-sm text-red-600">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-900">
                Recent Invoices
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left">Invoice</th>
                    <th className="px-5 py-3 text-left">Client</th>
                    <th className="px-5 py-3 text-left">Total</th>
                    <th className="px-5 py-3 text-left">Paid</th>
                    <th className="px-5 py-3 text-left">Pending</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No invoices created yet.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => {
                      const total = Number(invoice.total_amount || 0);
                      const paid = Number(invoice.paid_amount || 0);
                      const pending = total - paid;

                      return (
                        <tr key={invoice.id}>
                          <td className="px-5 py-4 font-semibold">
                            {invoice.invoice_number}
                          </td>

                          <td className="px-5 py-4">
                            {clientName(invoice.client_id)}
                          </td>

                          <td className="px-5 py-4">
                            AED {money(total)}
                          </td>

                          <td className="px-5 py-4 text-emerald-600">
                            AED {money(paid)}
                          </td>

                          <td className="px-5 py-4 text-red-600">
                            AED {money(pending)}
                          </td>

                          <td className="px-5 py-4">
                            {invoice.status || "Draft"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}