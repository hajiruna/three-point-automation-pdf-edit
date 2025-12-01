'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`

    return (
      <label
        htmlFor={inputId}
        className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}
      >
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <div
            className="
              w-5 h-5 rounded
              border-2 border-[--color-border-medium]
              bg-white
              transition-all duration-200
              peer-checked:bg-[--color-accent-500]
              peer-checked:border-[--color-accent-500]
              peer-focus-visible:ring-2
              peer-focus-visible:ring-[--color-accent-500]
              peer-focus-visible:ring-offset-2
              peer-disabled:opacity-50
              peer-disabled:cursor-not-allowed
            "
          />
          <svg
            className="
              absolute top-0.5 left-0.5
              w-4 h-4 text-white
              opacity-0 transition-opacity duration-200
              peer-checked:opacity-100
              pointer-events-none
            "
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        {label && (
          <span className="text-[--color-text-primary]">{label}</span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
