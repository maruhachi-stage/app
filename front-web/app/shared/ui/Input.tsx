import type { InputHTMLAttributes } from "react"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        className={`rounded-lg border px-3 py-2 text-base outline-none transition focus:ring-2 focus:ring-red-500 ${
          error ? "border-red-500 bg-red-50" : "border-gray-300"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
