import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  layout("routes/staff.tsx", [
    index("routes/dashboard.tsx"),
    route("seat-layouts", "routes/seat-layouts.tsx"),
  ]),
] satisfies RouteConfig;
