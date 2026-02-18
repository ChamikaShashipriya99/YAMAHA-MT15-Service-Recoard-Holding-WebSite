"use client";

import React from "react";
import { Gauge, Calendar, Wrench } from "lucide-react";
import { useServiceContext } from "@/context/ServiceContext";

const OdometerCard = ({ mileage }: { mileage: number }) => (
    <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
        <Gauge className="w-8 h-8 text-cyan-400 mb-2" />
        <h3 className="text-gray-400 text-sm font-medium">Odometer</h3>
        <p className="text-3xl font-bold text-white mt-1">
            {mileage.toLocaleString()} <span className="text-sm font-normal text-gray-500">km</span>
        </p>
    </div>
);

const NextServiceCard = ({ currentMileage }: { currentMileage: number }) => {
    const nextServiceAt = currentMileage + 3000;

    return (
        <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <Wrench className="w-8 h-8 text-blue-400 mb-2" />
            <h3 className="text-gray-400 text-sm font-medium">Next Service</h3>
            <p className="text-3xl font-bold text-white mt-1">
                {nextServiceAt.toLocaleString()} <span className="text-sm font-normal text-gray-500">km</span>
            </p>
        </div>
    );
};

const ServiceInfoCard = ({ count, lastDate }: { count: number, lastDate: string }) => (
    <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
        <Calendar className="w-8 h-8 text-purple-400 mb-2" />
        <h3 className="text-gray-400 text-sm font-medium">Service History</h3>
        <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-bold text-white">{count}</p>
            <span className="text-sm text-gray-500 mb-1">Records</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
            Last: {lastDate}
        </p>
    </div>
);

export default function DashboardStats() {
    const { currentMileage, nextServiceMileage, serviceCount, lastServiceDate } = useServiceContext();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OdometerCard mileage={currentMileage} />
            <NextServiceCard currentMileage={currentMileage} />
            <ServiceInfoCard count={serviceCount} lastDate={lastServiceDate} />
        </div>
    );
}
