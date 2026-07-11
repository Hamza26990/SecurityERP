import { APP_ROUTES } from "./routes";

export const MODULES = [
  { key: "dashboard", label: "Dashboard", href: APP_ROUTES.dashboard },
  { key: "employees", label: "Employee Management", href: APP_ROUTES.employees },
  { key: "clients", label: "Client Management", href: APP_ROUTES.clients },
  { key: "sites", label: "Site Management", href: APP_ROUTES.sites },
  { key: "shifts", label: "Shift Scheduling", href: APP_ROUTES.shifts },
  { key: "attendance", label: "Attendance", href: APP_ROUTES.attendance },
  { key: "gps", label: "GPS Check-In / Check-Out", href: APP_ROUTES.gpsCheckIn },
  { key: "dob", label: "Daily Occurrence Book", href: APP_ROUTES.dob },
  { key: "incidents", label: "Incident Reports", href: APP_ROUTES.incidents },
  { key: "timesheets", label: "Timesheets", href: APP_ROUTES.timesheets },
  { key: "invoices", label: "Invoice Management", href: APP_ROUTES.invoices },
  { key: "payments", label: "Payment Tracking", href: APP_ROUTES.payments },
  { key: "reports", label: "Reports", href: APP_ROUTES.reports },
  { key: "settings", label: "Settings", href: APP_ROUTES.settings },
] as const;
