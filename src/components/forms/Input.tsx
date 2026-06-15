import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string }

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">{label}</label>}
    <input
      ref={ref}
      className={`w-full px-4 py-2.5 rounded-xl border bg-[#F8F9FB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
        ${error ? 'border-red-500' : 'border-[#E5E7EB] dark:border-[#334155]'} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
))
Input.displayName = 'Input'
export default Input