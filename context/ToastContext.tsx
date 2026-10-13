"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

type ToastType = "success" | "error";

type ToastContextType = {
    showToast: (message: string, type?: ToastType) => void;
};

type ToastData = {
    id: number;
    message: string;
    type: ToastType;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [toast, setToast] = useState<ToastData | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const idRef = useRef(0);

    const showToast = useCallback(
        (message: string, type: ToastType = "success") => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            const id = ++idRef.current;

            setToast({ id, message, type });

            timerRef.current = setTimeout(() => {
                setToast((current) => (current?.id === id ? null : current));
                timerRef.current = null;
            }, 3000);
        },
        []
    );

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {toast && (
                <div
                    key={toast.id}
                    role="status"
                    aria-live="polite"
                    className={`fixed right-5 top-5 z-[9999] flex items-center gap-3 rounded-xl px-5 py-4 font-semibold text-white shadow-2xl ${toast.type === "success" ? "bg-green-600" : "bg-red-600"
                        }`}
                >
                    <span className="text-xl" aria-hidden="true">
                        {toast.type === "success" ? "✓" : "!"}
                    </span>

                    <span>{toast.message}</span>

                    <button
                        type="button"
                        aria-label="Close notification"
                        onClick={() => {
                            if (timerRef.current) {
                                clearTimeout(timerRef.current);
                                timerRef.current = null;
                            }
                            setToast(null);
                        }}
                        className="ml-2 text-xl hover:opacity-75"
                    >
                        ×
                    </button>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used inside ToastProvider");
    }

    return context;
}