import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { fetchSitePage } from "@/lib/cms";
import { Button } from "@/components/ui/button";
import { markdownComponents } from "@/lib/markdown-components";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const page = await fetchSitePage(params.slug);
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.page.title ?? "Page"} — TommyMeow` },
      { name: "description", content: (loaderData?.page.content ?? "").replace(/[#*_`>\-]/g, "").slice(0, 155) },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="glass rounded-3xl p-10 max-w-md text-center">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist or hasn't been published yet.</p>
        <div className="mt-6"><Button variant="hero" asChild><Link to="/">Back to home</Link></Button></div>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center px-6">
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: PageView,
});

function PageView() {
  const { page } = Route.useLoaderData();
  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-5 flex items-center justify-between">
          <Button variant="ghostNeon" size="sm" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">Updated {new Date(page.updatedAt).toLocaleDateString()}</div>
            <LanguageSwitcher variant="compact" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 mt-10">
        <article className="glass rounded-3xl p-8 sm:p-12">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground">{page.title}</h1>
          <ReactMarkdown components={markdownComponents}>{page.content}</ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
