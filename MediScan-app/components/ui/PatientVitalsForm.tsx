"use client";

import { useState, useEffect } from "react";
import { CalendarDays, UserRound } from "lucide-react";

type PatientInfo = {
  birthdate: string;
  gender: string;
  patientName: string;
};

interface PatientVitalsFormProps {
  onVitalsSubmit: (data: PatientInfo) => void;
  initialValues?: Partial<PatientInfo>;
}

export default function PatientVitalsForm({
  onVitalsSubmit,
  initialValues,
}: PatientVitalsFormProps) {
  const [formData, setFormData] = useState<PatientInfo>({
    patientName: initialValues?.patientName || "",
    birthdate: initialValues?.birthdate || "",
    gender: initialValues?.gender || "",
  });

  useEffect(() => {
    onVitalsSubmit(formData);
  }, [formData, onVitalsSubmit]);

  const handleChange = (field: keyof PatientInfo, value: string) => {
    if (field === "birthdate") {
      const today = new Date().toISOString().split("T")[0];

      if (value > today) {
        alert("Birthdate cannot be in the future");
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Patient Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please provide the patient name , birthdate and gender.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <UserRound className="w-4 h-4" />
            Patient Name
          </label>
          <input
            type="text"
            value={formData.patientName}
            onChange={(e) => handleChange("patientName", e.target.value)}
            placeholder="Enter patient name"
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        {/* Birthdate */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Birthdate
          </label>
          <input
            type="date"
            value={formData.birthdate}
            max={today}
            onChange={(e) => handleChange("birthdate", e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <UserRound className="w-4 h-4" />
            Gender
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>
    </div>
  );
}
