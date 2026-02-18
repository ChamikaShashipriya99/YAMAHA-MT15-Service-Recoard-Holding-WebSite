"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ServiceRecord = {
    id: string;
    date: string;
    mileage: number;
    oilChange: boolean;
    filterChange: boolean;
    notes: string;
    cost?: string; // Optional field if we want to add cost later
    type?: string; // Derived from checkboxes for display
};

type ServiceContextType = {
    records: ServiceRecord[];
    addRecord: (record: Omit<ServiceRecord, "id">) => void;
    deleteRecord: (id: string) => void;
    updateRecord: (id: string, updatedRecord: Partial<ServiceRecord>) => void;
    currentMileage: number;
    nextServiceMileage: number;
    serviceCount: number;
    lastServiceDate: string;
};

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

const STORAGE_KEY = "mt15_service_records";

export function ServiceProvider({ children }: { children: React.ReactNode }) {
    const [records, setRecords] = useState<ServiceRecord[]>([]);

    // Load from LocalStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setRecords(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse service records", e);
            }
        } else {
            // Initialize with some dummy data if empty for demo purposes
            const initialData: ServiceRecord[] = [
                { id: "1", date: "2023-12-15", mileage: 12000, oilChange: true, filterChange: true, notes: "Regular service", type: "General Service", cost: "₹2,500" },
                { id: "2", date: "2023-08-10", mileage: 9000, oilChange: true, filterChange: false, notes: "Oil top-up", type: "Oil Change", cost: "₹800" },
            ];
            setRecords(initialData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
        }
    }, []);

    // Save to LocalStorage whenever records change
    useEffect(() => {
        if (records.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        }
    }, [records]);

    const addRecord = (newRecord: Omit<ServiceRecord, "id">) => {
        const record: ServiceRecord = {
            ...newRecord,
            id: crypto.randomUUID(),
            type: newRecord.oilChange && newRecord.filterChange ? "Full Service" : newRecord.oilChange ? "Oil Change" : "Maintenance",
        };

        // Prepend new record so it's first
        setRecords((prev) => [record, ...prev]);
    };

    const deleteRecord = (id: string) => {
        setRecords((prev) => prev.filter((record) => record.id !== id));
    };

    const updateRecord = (id: string, updatedRecord: Partial<ServiceRecord>) => {
        setRecords((prev) =>
            prev.map((record) =>
                record.id === id ? { ...record, ...updatedRecord } : record
            )
        );
    };

    // Derived Statistics
    // Assuming records are sorted by date descending (newest first) relative to how we add them
    // But reliable calculation should sort first
    const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const currentMileage = sortedRecords.length > 0 ? Math.max(...sortedRecords.map(r => r.mileage)) : 0;
    const nextServiceMileage = currentMileage + 3000;
    const serviceCount = records.length;
    const lastServiceDate = sortedRecords.length > 0 ? sortedRecords[0].date : "N/A";

    return (
        <ServiceContext.Provider
            value={{
                records: sortedRecords,
                addRecord,
                deleteRecord,
                updateRecord,
                currentMileage,
                nextServiceMileage,
                serviceCount,
                lastServiceDate,
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
