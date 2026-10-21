
"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

type SidebarContextType = {
    sidebarExpanded: boolean;
    setSidebarExpanded: (expanded: boolean) => void;
    toggleSidebar: () => void;
    mobileFiltersOpen: boolean;
    setMobileFiltersOpen: (open: boolean) => void;
    toggleMobileFilters: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(
    undefined
);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const toggleSidebar = useCallback(() => {
        setSidebarExpanded((current) => !current);
    }, []);

    const toggleMobileFilters = useCallback(() => {
        setMobileFiltersOpen((current) => !current);
    }, []);

    const value = useMemo(
        () => ({
            sidebarExpanded,
            setSidebarExpanded,
            toggleSidebar,
            mobileFiltersOpen,
            setMobileFiltersOpen,
            toggleMobileFilters,
        }),
        [sidebarExpanded, toggleSidebar, mobileFiltersOpen, toggleMobileFilters]
    );

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);

    if (!context) {
        throw new Error("useSidebar must be used within SidebarProvider");
    }

    return context;
}
