import { createBrowserRouter } from "react-router"
import { EventLayout } from "@/features/public/event-layout"
import { EventsIndex } from "@/features/public/events-index"
import { EventLanding } from "@/features/public/event-landing"
import { VotingPage } from "@/features/public/voting-page"
import { AdminLayout } from "@/features/admin/admin-layout"
import { AdminLogin } from "@/features/admin/login"
import { Dashboard } from "@/features/admin/dashboard"
import { EventEditor } from "@/features/admin/event-editor"

export const router = createBrowserRouter([
  { path: "/", element: <EventsIndex /> },
  {
    path: "/e/:eventSlug",
    element: <EventLayout />,
    children: [
      { index: true, element: <EventLanding /> },
      { path: "vote", element: <VotingPage /> },
    ],
  },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "events/:id", element: <EventEditor /> },
    ],
  },
])
