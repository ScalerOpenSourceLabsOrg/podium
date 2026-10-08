"use client";

export function CsvExportButton({ slug, type, label = "Export CSV" }: { slug: string; type: string; label?: string }) {
  const handleExport = () => {
    window.location.href = `/api/export/${type}?slug=${encodeURIComponent(slug)}`;
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
    >
      📥 {label}
    </button>
  );
}
