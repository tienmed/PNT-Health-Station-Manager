import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants = {
        primary: "bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-500 shadow-md shadow-sky-500/20",
        secondary: "bg-slate-500 text-white hover:bg-slate-600 focus:ring-slate-500",
        outline: "border border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-200",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        />
    );
}
