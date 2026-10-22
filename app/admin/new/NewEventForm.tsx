"use client";

import { useActionState, useState } from "react";
import { createEventAction, type CreateEventState } from "./actions";

export function NewEventForm() {
  const [state, formAction, isPending] = useActionState<CreateEventState | null, FormData>(
    createEventAction,
    null,
  );

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  return (
    <form action={formAction} className="space-y-5">
      {state?.errors?._form && (
        <div className="p-3 bg-red-950/50 border border-red-800 rounded-xl text-xs text-red-300">
          {state.errors._form.join(", ")}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          Event Name *
        </label>
        <input
          name="name"
          type="text"
          required
          value={name}
          onChange={handleNameChange}
          placeholder="e.g. Buildathon 2026"
          className={`w-full px-3.5 py-2.5 bg-neutral-950 border ${
            state?.errors?.name ? "border-red-500" : "border-neutral-800"
          } rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors`}
        />
        {state?.errors?.name && (
          <p className="text-xs text-red-400 mt-1">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          URL Slug *
        </label>
        <input
          name="slug"
          type="text"
          required
          value={slug}
          onChange={handleSlugChange}
          placeholder="e.g. buildathon-26"
          className={`w-full px-3.5 py-2.5 bg-neutral-950 border ${
            state?.errors?.slug ? "border-red-500" : "border-neutral-800"
          } rounded-xl text-sm font-mono text-white focus:outline-none focus:border-purple-500 transition-colors`}
        />
        {state?.errors?.slug ? (
          <p className="text-xs text-red-400 mt-1">{state.errors.slug[0]}</p>
        ) : (
          <p className="text-[11px] text-neutral-500 mt-1">
            Lowercase letters, numbers, and hyphens only (event URL: /e/{slug || "your-slug"})
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          Tagline
        </label>
        <input
          name="tagline"
          type="text"
          defaultValue={state?.values?.tagline || ""}
          placeholder="e.g. 48 hours to ship your dream project"
          className={`w-full px-3.5 py-2.5 bg-neutral-950 border ${
            state?.errors?.tagline ? "border-red-500" : "border-neutral-800"
          } rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors`}
        />
        {state?.errors?.tagline && (
          <p className="text-xs text-red-400 mt-1">{state.errors.tagline[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          Max Team Size
        </label>
        <input
          name="maxTeamSize"
          type="number"
          min="1"
          max="20"
          defaultValue={state?.values?.maxTeamSize || 4}
          className={`w-full px-3.5 py-2.5 bg-neutral-950 border ${
            state?.errors?.maxTeamSize ? "border-red-500" : "border-neutral-800"
          } rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors`}
        />
        {state?.errors?.maxTeamSize && (
          <p className="text-xs text-red-400 mt-1">{state.errors.maxTeamSize[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          Rules & Guidelines (Markdown)
        </label>
        <textarea
          name="rulesMd"
          rows={4}
          defaultValue={state?.values?.rulesMd || ""}
          placeholder="Build something new. Original code only."
          className={`w-full px-3.5 py-2.5 bg-neutral-950 border ${
            state?.errors?.rulesMd ? "border-red-500" : "border-neutral-800"
          } rounded-xl text-sm font-mono text-white focus:outline-none focus:border-purple-500 transition-colors`}
        />
        {state?.errors?.rulesMd && (
          <p className="text-xs text-red-400 mt-1">{state.errors.rulesMd[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Creating Event...</span>
          </>
        ) : (
          <span>🚀 Launch Event Workspace</span>
        )}
      </button>
    </form>
  );
}
