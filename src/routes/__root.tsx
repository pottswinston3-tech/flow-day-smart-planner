import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Smart Scheduler" },
      { name: "description", content: "Smart Scheduler is a versatile website to help write down homework, make quick notes, get to important links and more." },
      { name: "theme-color", content: "#ffffff" },
      { property: "og:title", content: "Smart Scheduler" },
      { name: "twitter:title", content: "Smart Scheduler" },
      { property: "og:description", content: "Smart Scheduler is a versatile website to help write down homework, make quick notes, get to important links and more." },
      { name: "twitter:description", content: "Smart Scheduler is a versatile website to help write down homework, make quick notes, get to important links and more." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/990edc8f-5b75-4831-a9d7-45626fd018d5/id-preview-539b829e--7b740a91-be66-410b-a8ea-aeb3c3125577.lovable.app-1778755079426.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/990edc8f-5b75-4831-a9d7-45626fd018d5/id-preview-539b829e--7b740a91-be66-410b-a8ea-aeb3c3125577.lovable.app-1778755079426.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <a href="/" className="mt-4 inline-block text-primary underline">Go home</a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster theme="light" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
