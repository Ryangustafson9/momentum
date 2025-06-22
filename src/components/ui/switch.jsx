import * as React from "react";

const Switch = React.forwardRef(
  ({ className = "", checked, onCheckedChange, ...props }, ref) => (
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="sr-only"
        {...props}
      />
      <div
        className={`w-11 h-6 rounded-full p-1 transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-200"
        } ${className}`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  )
);
Switch.displayName = "Switch";

export { Switch };



