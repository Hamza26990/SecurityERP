export const APP_ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
  dashboard: "/dashboard",
  employees: "/employees",
  clients: "/clients",
  sites: "/sites",
  shifts: "/shifts",
  attendance: "/attendance",
  gpsCheckIn: "/attendance/gps",
  dob: "/dob",
  incidents: "/incidents",
  timesheets: "/timesheets",
  invoices: "/invoices",
  payments: "/payments",
  reports: "/reports",
  settings: "/settings",
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
