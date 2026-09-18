"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type ServiceRecord = {
    id: string;
    date: string;
    mileage: number;
    oilChange: boolean;
    filterChange: boolean;
    notes: string;
    cost?: string;
    type?: string;
};

type ServiceContextType = {
    records: ServiceRecord[];
    isLoading: boolean;
    addRecord: (record: Omit<ServiceRecord, "id">) => Promise<void>;
    deleteRecord: (id: string) => Promise<void>;
    updateRecord: (id: string, updatedRecord: Partial<ServiceRecord>) => Promise<void>;
    resetAllRecords: () => Promise<void>;
    currentMileage: number;
    nextServiceMileage: number;
    serviceCount: number;
    lastServiceDate: string;
    isAddModalOpen: boolean;
    openAddModal: () => void;
    closeAddModal: () => void;
    refreshRecords: () => Promise<void>;
};

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

const STORAGE_KEY = "mt15_service_records";

export function ServiceProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [records, setRecords] = useState<ServiceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const openAddModal = () => setIsAddModalOpen(true);
    const closeAddModal = () => setIsAddModalOpen(false);

    const fetchRecords = async () => {
        if (pathname === "/login" || pathname === "/setup-2fa") {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/records");

            // If unauthenticated, skip without throwing console error
            if (res.status === 401) {
                setIsLoading(false);
                return;
            }

            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.error || `HTTP error ${res.status}`);
            }

            if (result.data) {
                const mappedRecords: ServiceRecord[] = result.data.map((record: any) => ({
                    id: record.id || record._id,
                    date: record.date,
                    mileage: record.mileage,
                    oilChange: Boolean(record.oilChange),
                    filterChange: Boolean(record.filterChange),
                    notes: record.notes || "",
                    cost: record.cost || "",
                    type: record.type || "Maintenance",
                }));
                setRecords(mappedRecords);

                if (typeof window !== "undefined") {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedRecords));
                }
            }
        } catch (error: any) {
            console.error("Error fetching records from API:", error.message || error);
            // Fallback to local storage if API/database is unreachable
            if (typeof window !== "undefined") {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    try {
                        setRecords(JSON.parse(saved));
                    } catch (e) {
                        console.error("Failed to parse cached records:", e);
                    }
                }
            }
        } finally {
            // Smooth initialization delay on first load
            setTimeout(() => {
                setIsLoading(false);
            }, 600);
        }
    };

    // Load records on mount or when route changes to an authenticated page
    useEffect(() => {
        if (pathname !== "/login" && pathname !== "/setup-2fa") {
            fetchRecords();
        }
    }, [pathname]);

    const addRecord = async (newRecord: Omit<ServiceRecord, "id">) => {
        const type =
            newRecord.oilChange && newRecord.filterChange
                ? "Full Service"
                : newRecord.oilChange
                ? "Oil Change"
                : "Maintenance";

        const payload = {
            ...newRecord,
            type,
        };

        try {
            const res = await fetch("/api/records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.error || "Failed to add record");
            }

            // Refresh list from server
            await fetchRecords();
        } catch (error: any) {
            console.error("Error adding record:", error.message || error);
            // Fallback offline: prepend to local state and localStorage
            const fallbackRecord: ServiceRecord = {
                ...payload,
                id: crypto.randomUUID(),
            };
            setRecords((prev) => {
                const updated = [fallbackRecord, ...prev];
                if (typeof window !== "undefined") {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                }
                return updated;
            });
        }
    };

    const deleteRecord = async (id: string) => {
        try {
            const res = await fetch(`/api/records/${id}`, {
                method: "DELETE",
            });
            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.error || "Failed to delete record");
            }

            setRecords((prev) => {
                const updated = prev.filter((record) => record.id !== id);
                if (typeof window !== "undefined") {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                }
                return updated;
            });
        } catch (error: any) {
            console.error("Error deleting record:", error.message || error);
            // Fallback: delete locally
            setRecords((prev) => {
                const updated = prev.filter((record) => record.id !== id);
                if (typeof window !== "undefined") {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                }
                return updated;
            });
        }
    };

    const updateRecord = async (id: string, updatedRecord: Partial<ServiceRecord>) => {
        try {
            const res = await fetch(`/api/records/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedRecord),
            });
            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.error || "Failed to update record");
            }

            await fetchRecords();
        } catch (error: any) {
            console.error("Error updating record:", error.message || error);
            // Fallback: update locally
            setRecords((prev) => {
                const updated = prev.map((record) =>
                    record.id === id ? { ...record, ...updatedRecord } : record
                );
                if (typeof window !== "undefined") {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                }
                return updated;
            });
        }
    };

    const resetAllRecords = async () => {
        try {
            const res = await fetch("/api/records", {
                method: "DELETE",
            });
            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.error || "Failed to reset records");
            }

            setRecords([]);
            if (typeof window !== "undefined") {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (error: any) {
            console.error("Error resetting records:", error.message || error);
            setRecords([]);
            if (typeof window !== "undefined") {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    };

    // Derived Statistics
    const sortedRecords = [...records].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const currentMileage =
        sortedRecords.length > 0 ? Math.max(...sortedRecords.map((r) => r.mileage)) : 0;
    const nextServiceMileage = currentMileage + 3000;
    const serviceCount = records.length;
    const lastServiceDate = sortedRecords.length > 0 ? sortedRecords[0].date : "N/A";

    return (
        <ServiceContext.Provider
            value={{
                records: sortedRecords,
                isLoading,
                addRecord,
                deleteRecord,
                updateRecord,
                resetAllRecords,
                currentMileage,
                nextServiceMileage,
                serviceCount,
                lastServiceDate,
                isAddModalOpen,
                openAddModal,
                closeAddModal,
                refreshRecords: fetchRecords,
            }}
        >
            {children}
        </ServiceContext.Provider>
    );
}

export function useServiceContext() {
    const context = useContext(ServiceContext);
    if (context === undefined) {
        throw new Error("useServiceContext must be used within a ServiceProvider");
    }
    return context;
}
