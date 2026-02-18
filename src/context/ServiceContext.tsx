"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    const supabase = createClient();

    const fetchRecords = async () => {
        const { data, error } = await supabase
            .from('service_records')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching records:', error);
            return;
        }

        if (data) {
            const mappedRecords: ServiceRecord[] = data.map((record: any) => ({
                id: record.id,
                date: record.date,
                mileage: record.mileage,
                oilChange: record.oil_change,
                filterChange: record.filter_change,
                notes: record.notes,
                cost: record.cost,
                type: record.type,
            }));
            setRecords(mappedRecords);
        }
    };

    // Load from Supabase on mount
    useEffect(() => {
        fetchRecords();
    }, []);

    const addRecord = async (newRecord: Omit<ServiceRecord, "id">) => {
        const type = newRecord.oilChange && newRecord.filterChange ? "Full Service" : newRecord.oilChange ? "Oil Change" : "Maintenance";

        const { data, error } = await supabase
            .from('service_records')
            .insert([
                {
                    date: newRecord.date,
                    mileage: newRecord.mileage,
                    oil_change: newRecord.oilChange,
                    filter_change: newRecord.filterChange,
                    notes: newRecord.notes,
                    cost: newRecord.cost,
                    type: type,
                },
            ])
            .select();

        if (error) {
            console.error('Error adding record:', error);
            return;
        }

        if (data) {
            // Refresh list
            fetchRecords();
        }
    };

    const deleteRecord = async (id: string) => {
        const { error } = await supabase
            .from('service_records')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting record:', error);
            return;
        }

        setRecords((prev) => prev.filter((record) => record.id !== id));
    };

    const updateRecord = async (id: string, updatedRecord: Partial<ServiceRecord>) => {
        const updates: any = {};
        if (updatedRecord.date !== undefined) updates.date = updatedRecord.date;
        if (updatedRecord.mileage !== undefined) updates.mileage = updatedRecord.mileage;
        if (updatedRecord.oilChange !== undefined) updates.oil_change = updatedRecord.oilChange;
        if (updatedRecord.filterChange !== undefined) updates.filter_change = updatedRecord.filterChange;
        if (updatedRecord.notes !== undefined) updates.notes = updatedRecord.notes;
        if (updatedRecord.cost !== undefined) updates.cost = updatedRecord.cost;
        // recalculate type if necessary or pass it in. For now, we skip auto-recalc of 'type' on update unless passed explicitly

        const { error } = await supabase
            .from('service_records')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating record:', error);
            return;
        }

        fetchRecords();
    };

    // Derived Statistics
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
