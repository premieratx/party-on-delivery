import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm touch-manipulation select-text",
          className
        )}
        ref={ref}
        // CRITICAL: Mobile input optimizations to prevent glitches
        style={{
          fontSize: '16px', // Prevents zoom on iOS
          WebkitUserSelect: 'text',
          userSelect: 'text',
          WebkitTouchCallout: 'default',
          WebkitTapHighlightColor: 'rgba(0,0,0,0.1)',
          ...props.style
        }}
        // Enhanced mobile attributes
        autoCapitalize={props.autoCapitalize || (type === 'email' ? 'none' : 'words')}
        autoCorrect={props.autoCorrect || (type === 'email' ? 'off' : 'on')}
        // Ensure input is always interactive and accessible
        onTouchStart={(e) => {
          e.stopPropagation();
          // Ensure the input can always be focused
          if (e.currentTarget && typeof e.currentTarget.focus === 'function') {
            setTimeout(() => e.currentTarget.focus(), 0);
          }
        }}
        onFocus={(e) => {
          // Prevent any parent handlers from interfering
          e.stopPropagation();
          if (props.onFocus) props.onFocus(e);
        }}
        onClick={(e) => {
          // Ensure clicks always work
          e.stopPropagation();
          if (props.onClick) props.onClick(e);
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
