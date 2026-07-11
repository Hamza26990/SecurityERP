"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
type Employee = Database["public"]["Tables"]["employees"]["Row"];
type Site = Database["public"]["Tables"]["sites"]["Row"];

export default function AttendancePage() {
  const supabase = useMemo(() => createClient(), []);

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [siteId, setSiteId] = useState("");

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

    const [attendanceResult, employeesResult, sitesResult] = await Promise.all([
      supabase
        .from("attendance")
        .select("*")
        .order("attendance_date", { ascending: false })
        .order("created_at", { ascending: false }),

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

    if (attendanceResult.error) {
      setMessage(`Error: ${attendanceResult.error.message}`);
    } else {
      setAttendance(attendanceResult.data ?? []);
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

  function getLocation(): Promise<{
    latitude: number | null;
    longitude: number | null;
  }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve({ latitude: null, longitude: null });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
      );
    });
  }

  async function checkIn() {
    if (!employeeId || !siteId) {
      setMessage("Please select an employee and site.");
      return;
    }

    setWorking(true);
    setMessage("Getting GPS location...");

    const location = await getLocation();
    const today = new Date().toISOString().slice(0, 10);

    const existingRecord = attendance.find(
      (record) =>
        record.employee_id === employeeId &&
        record.attendance_date === today &&
        !record.check_out_time,
    );

    if (existingRecord) {
      setMessage("This employee is already checked in today.");
      setWorking(false);
      return;
    }

    const { error } = await supabase.from("attendance").insert({
      employee_id: employeeId,
      site_id: siteId,
      attendance_date: today,
      check_in_time: new Date().toISOString(),
      check_in_latitude: location.latitude,
      check_in_longitude: location.longitude,
      status: "Present",
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Check-in saved successfully.");
      await loadData();
    }

    setWorking(false);
  }

  async function checkOut(record: Attendance) {
    if (record.check_out_time) {
      setMessage("This employee is already checked out.");
      return;
    }

    setWorking(true);
    setMessage("Getting GPS location...");

    const location = await getLocation();

    const { error } = await supabase
      .from("attendance")
      .update({
        check_out_time: new Date().toISOString(),
        check_out_latitude: location.latitude,
        check_out_longitude: location.longitude,
      })
      .eq("id", record.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Check-out saved successfully.");
      await loadData();
    }

    setWorking(false);
  }

  function employeeName(id: string) {
    return (
      employees.find((employee) => employee.id === id)?.full_name ??
      "Unknown employee"
    );
  }

  function siteName(id: string | null) {
    if (!id) return "No site";

    return sites.find((site) => site.id === id)?.site_name ?? "Unknown site";
  }

  function formatTime(value: string | null) {
    if (!value) return "-";

    return new Date(value).toLocaleTimeString("en-AE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>

        <p className="mt-1 text-slate-600">
          Record employee check-in, check-out and GPS location.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border bg-white p-4 text-sm">
          {message}
        </div>
      )}

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold">Employee Attendance</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
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
            value={siteId}
            onChange={(event) => setSiteId(event.target.value)}
            className="rounded-lg border px-4 py-3"
          >
            <option value="">Select site *</option>

            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.site_name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => void checkIn()}
          disabled={working}
          className="mt-5 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {working ? "Please wait..." : "Check In"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left">Employee</th>
                <th className="px-5 py-3 text-left">Site</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Check In</th>
                <th className="px-5 py-3 text-left">Check Out</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    Loading attendance...
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    No attendance recorded yet.
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id}>
                    <td className="px-5 py-4 font-semibold">
                      {employeeName(record.employee_id)}
                    </td>

                    <td className="px-5 py-4">
                      {siteName(record.site_id)}
                    </td>

                    <td className="px-5 py-4">
                      {record.attendance_date}
                    </td>

                    <td className="px-5 py-4">
                      {formatTime(record.check_in_time)}
                    </td>

                    <td className="px-5 py-4">
                      {formatTime(record.check_out_time)}
                    </td>

                    <td className="px-5 py-4">
                      {record.status || "Present"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {!record.check_out_time && (
                        <button
                          type="button"
                          onClick={() => void checkOut(record)}
                          disabled={working}
                          className="font-semibold text-blue-600 disabled:opacity-50"
                        >
                          Check Out
                        </button>
                      )}
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