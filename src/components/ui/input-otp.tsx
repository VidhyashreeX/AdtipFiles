import * as React from "react"
import { cn } from "@/lib/utils"

interface InputOTPProps {
  maxLength?: number
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

interface InputOTPSlotProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  index: number
  char?: string
  active?: boolean
  focused?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ className, maxLength = 6, value, onChange, disabled, ...props }, ref) => {
    const [focusedIndex, setFocusedIndex] = React.useState<number>(-1)
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (value[index]) {
          // If current box is not empty, clear it (first backspace)
          const newValue = value.slice(0, index) + "" + value.slice(index + 1)
          onChange(newValue)
          // Prevent default so cursor doesn't move
          e.preventDefault();
        } else if (index > 0) {
          // If current box is empty, move focus to previous and clear it (second backspace)
          inputRefs.current[index - 1]?.focus()
          // Clear the previous box
          const newValue = value.slice(0, index - 1) + "" + value.slice(index)
          onChange(newValue)
          e.preventDefault();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (e.key === "ArrowRight" && index < maxLength - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handleInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const newChar = e.target.value.slice(-1)
      if (newChar && /^[0-9]$/.test(newChar)) {
        const newValue = value.slice(0, index) + newChar + value.slice(index + 1)
        onChange(newValue.slice(0, maxLength))
        if (index < maxLength - 1) {
          inputRefs.current[index + 1]?.focus()
        }
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData("text").slice(0, maxLength)
      const numbersOnly = pastedData.replace(/[^0-9]/g, "")
      if (numbersOnly) {
        onChange(numbersOnly.padEnd(maxLength, "").slice(0, maxLength))
        inputRefs.current[Math.min(numbersOnly.length, maxLength - 1)]?.focus()
      }
    }

    React.useEffect(() => {
      if (focusedIndex >= 0 && focusedIndex < maxLength) {
        inputRefs.current[focusedIndex]?.focus()
      }
    }, [focusedIndex, maxLength])

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center gap-3", className)}
        onPaste={handlePaste}
      >
        {Array.from({ length: maxLength }).map((_, index) => (
          <InputOTPSlot
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            index={index}
            char={value[index]}
            active={index === focusedIndex}
            focused={index === focusedIndex}
            disabled={disabled}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(-1)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onChange={(e) => handleInput(index, e)}
          />
        ))}
      </div>
    )
  }
)
InputOTP.displayName = "InputOTP"

const InputOTPSlot = React.forwardRef<HTMLInputElement, InputOTPSlotProps>(
  ({ index, char, active, focused, className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative h-14 w-12 rounded-lg",
          "border-2 border-gray-300",
          focused && "border-adtip-teal ring-2 ring-adtip-teal ring-opacity-25",
          !focused && active && "border-adtip-teal",
          className
        )}
      >
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          className={cn(
            "absolute inset-0 h-full w-full rounded-lg px-0",
            "bg-white text-black text-center text-2xl font-semibold tracking-wider",
            "focus:outline-none focus:ring-0",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          value={char || ""}
          {...props}
        />
      </div>
    )
  }
)
InputOTPSlot.displayName = "InputOTPSlot"

export { InputOTP }
