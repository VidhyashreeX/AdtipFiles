import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { index: number; showChar?: boolean }
>(({ index, showChar = false, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const slot = inputOTPContext?.slots?.[index]

  if (!slot) {
    return (
      <div
        className={cn(
          "relative h-12 w-10 text-center text-xl font-semibold",
          "border border-gray-300 rounded-md",
          "disabled:cursor-not-allowed",
          className
        )}
      />
    )
  }

  const { char, hasFakeCaret, isActive } = slot

  return (
    <div
      className={cn(
        "relative h-12 w-10 text-center text-xl font-semibold",
        "border border-gray-300 rounded-md",
        "focus-within:border-adtip-teal focus-within:ring-1 focus-within:ring-adtip-teal",
        "transition-all duration-200",
        isActive ? "border-adtip-teal ring-1 ring-adtip-teal" : "",
        className
      )}
    >
      <input
        ref={ref}
        className={cn(
          "absolute inset-0 w-full h-full text-center text-xl font-semibold",
          "border-none bg-transparent",
          "focus:outline-none focus:ring-0",
          "disabled:cursor-not-allowed"
        )}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={1}
        {...props}
      />
      {char && showChar && (
        <div className="absolute inset-0 flex items-center justify-center bg-white text-black">
          {char}
        </div>
      )}
      {hasFakeCaret && (
        <div className="absolute inset-0 flex items-center justify-center animate-caret-blink">
          <div className="h-4 w-px bg-adtip-teal duration-150" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot className="h-4 w-4 text-gray-400" />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
