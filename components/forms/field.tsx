import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  errors?: string[];
  children: ReactNode;
};

// Every form in the app renders errors the same way: the string array a server
// action returns under `errors[fieldName]`.
export function Field({ label, htmlFor, hint, errors, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !errors?.length ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
      <FieldError errors={errors} />
    </div>
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-destructive text-xs">
      {errors[0]}
    </p>
  );
}
