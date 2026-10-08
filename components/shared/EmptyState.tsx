import React from "react";

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 my-6">
      <div className="text-4xl mb-3">{icon || "📂"}</div>
      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
