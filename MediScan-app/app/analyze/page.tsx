"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import ImageUploader from "@/components/ui/ImageUploader";
import PatientVitalsForm from "@/components/ui/PatientVitalsForm";
import { XRayImage, PatientVitals } from "@/types";
import { getApiBaseUrl } from "@/lib/config";
import { getAuthToken, clearAuthData } from "@/lib/auth";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  HelpCircle,
  Image,
  Stethoscope,
  Upload,
} from "lucide-react";

export default function AnalyzePage() {
  // State definitions
  const [image, setImage] = useState<XRayImage | null>(null);
  const [vitals, setVitals] = useState<PatientVitals | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepComplete, setStepComplete] = useState<{ [key: number]: boolean }>({
    1: false,
    2: false,
  });
  const router = useRouter();

  // Handle image selection
  const handleImageSelect = (uploadedImage: XRayImage | null) => {
    setImage(uploadedImage);
    setError(null);
    setStepComplete((prev) => ({ ...prev, 1: !!uploadedImage }));
  };

  // Handle vitals submission
const handleVitalsSubmit = (patientVitals: PatientVitals) => {
  setVitals(patientVitals);
  setError(null);

  const isComplete = !!patientVitals.birthdate && !!patientVitals.gender && !!patientVitals.patientName ;

  setStepComplete((prev) => ({ ...prev, 2: isComplete }));
};

  // Navigate to next step
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle analysis submission
const handleAnalyze = async () => {
  if (!image) {
    setError("Please upload an X-ray image first.");
    setCurrentStep(1);
    return;
  }

  if (!vitals?.patientName || !vitals?.birthdate || !vitals?.gender) {
    setError("Patient name, birthdate and gender are required.");
    setCurrentStep(2);
    return;
  }

  setError(null);
  setIsAnalyzing(true);

  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }

    const apiBaseUrl = getApiBaseUrl();
const cleanApiBaseUrl = apiBaseUrl.replace(/\/$/, "");

const formData = new FormData();
formData.append("image", image.file);
formData.append("patientName", vitals.patientName || "");
formData.append("birthdate", vitals.birthdate || "");
formData.append("gender", String(vitals.gender ?? ""));

const response = await fetch(`${cleanApiBaseUrl}/api/upload-scan/`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response from backend:", text);
      throw new Error(
        "Backend returned HTML instead of JSON. Check API URL, backend server, or authentication."
      );
    }

    const result = await response.json();

    if (response.status === 401) {
      clearAuthData();
      throw new Error("Your session has expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(
        result?.error || result?.detail || "Failed to analyze the image."
      );
    }

    sessionStorage.setItem("xrayResult", JSON.stringify(result));
    sessionStorage.setItem("originalImageUrl", image.preview);
    sessionStorage.setItem("patientVitals", JSON.stringify(vitals));

    router.push("/result");
  } catch (err) {
    console.error("Analysis error:", err);
    setError(
      err instanceof Error
        ? err.message
        : "Failed to analyze the image. Please try again."
    );
  } finally {
    setIsAnalyzing(false);
  }
};

  // Progress indicator component
  const ProgressSteps = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
              ${
                currentStep === step
                  ? "border-green-600 bg-green-50 text-[#24AE7C] dark:bg-green-900/30 dark:border-green-500"
                  : currentStep > step || stepComplete[step]
                  ? "border-green-500 bg-green-50 text-green-500 dark:bg-green-900/30 dark:border-green-400"
                  : "border-gray-300 text-gray-500 dark:border-gray-600"
              }`}
            onClick={() => {
              // Only allow clicking on completed steps or the current step + 1 if previous is complete
              if (
                step < currentStep ||
                (step === currentStep + 1 && stepComplete[currentStep])
              ) {
                setCurrentStep(step);
              }
            }}
            style={{
              cursor:
                step < currentStep ||
                (step === currentStep + 1 && stepComplete[currentStep])
                  ? "pointer"
                  : "default",
            }}
          >
            {currentStep > step || stepComplete[step] ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <span className="font-medium">{step}</span>
            )}
          </div>

          {step < 3 && (
            <div
              className={`w-20 h-1 mx-1 
              ${
                currentStep > step ||
                (currentStep === step && stepComplete[step])
                  ? "bg-green-500 dark:bg-green-400"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );

  // Step content components
  const StepTitle = ({ step }: { step: number }) => {
const titles = [
  "Upload X-Ray Image",
  "Enter Patient Information",
  "Review and Submit",
];

    const icons = [
      <Image key="image" className="w-6 h-6 mr-2" />,
      <Stethoscope key="stethoscope" className="w-6 h-6 mr-2" />,
      <Upload key="upload" className="w-6 h-6 mr-2" />,
    ];

    return (
      <div className="flex items-center mb-4">
        {icons[step - 1]}
        <h2 className="text-2xl font-bold">{titles[step - 1]}</h2>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analyze Chest X-Ray</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a chest X-ray image and provide patient birthdate and gender for AI-assisted analysis.
          </p>
        </div>

        {/* Progress Steps Indicator */}
        <ProgressSteps />

        {/* Main content area */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          {/* Step 1: Upload X-ray Image */}
          {currentStep === 1 && (
            <div className="animate-fadeIn">
              <StepTitle step={1} />
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please upload a clear, high-quality chest X-ray image. The
                system works best with frontal (PA/AP) views.
              </p>
              <ImageUploader
                onImageSelect={handleImageSelect}
                className="mb-6"
                maxSizeMB={15}
              />

              <div className="flex justify-between mt-8">
                <div></div> {/* Empty div for spacing */}
                <button
                  onClick={goToNextStep}
                  disabled={!stepComplete[1]}
                  className="flex items-center py-2 px-6  bg-green-700 text-white rounded-md shadow transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Next Step
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Patient Vitals */}
          {currentStep === 2 && (
            <div className="animate-fadeIn">
              <StepTitle step={2} />
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Enter the patient birthdate and gender for the final analysis.
              </p>
              <PatientVitalsForm
  onVitalsSubmit={handleVitalsSubmit}
  initialValues={vitals || undefined}
/>

              <div className="flex justify-between mt-8">
                <button
                  onClick={goToPrevStep}
                  className="flex items-center py-2 px-6 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-md shadow-sm transition-colors"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Previous Step
                </button>

                <button
                  onClick={goToNextStep}
                  disabled={!stepComplete[2]}
                  className="flex items-center py-2 px-6 bg-green-700 text-white rounded-md shadow transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Next Step
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review and Submit */}
          {currentStep === 3 && (
            <div className="animate-fadeIn">
              <StepTitle step={3} />

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* X-ray Image Preview */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Image className="w-5 h-5 mr-2" />
                    X-ray Image
                  </h3>

                  {image ? (
                    <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 aspect-square">
                      <img
                        src={image.preview}
                        alt="X-ray preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">
                        No image uploaded
                      </p>
                    </div>
                  )}
                </div>

                {/* Vitals Summary */}
                {/* Patient Information Summary */}
<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
  <h3 className="text-lg font-semibold mb-3 flex items-center">
    <Stethoscope className="w-5 h-5 mr-2" />
    Patient Information
  </h3>

  {vitals ? (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Patient Name</p>
          <p className="font-medium">{vitals.patientName || "Not provided"}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Birthdate</p>
          <p className="font-medium">{vitals.birthdate || "Not provided"}</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
          <p className="font-medium">{vitals.gender || "Not provided"}</p>
        </div>
      </div>

      {vitals.birthdate && (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
          <p className="font-medium">{calculateAge(vitals.birthdate)} years</p>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center h-40 bg-gray-100 dark:bg-gray-700 rounded-lg">
      <p className="text-gray-500 dark:text-gray-400">
        No patient information entered
      </p>
    </div>
  )}
</div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-6 animate-pulse">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={goToPrevStep}
                  className="flex items-center py-2 px-6 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-md shadow-sm transition-colors"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Previous Step
                </button>

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !image|| !vitals?.patientName || !vitals?.birthdate || !vitals?.gender}
                  className="flex items-center py-3 px-8 bg-green-700 text-white rounded-md shadow transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze & Submit
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Helpful tips and information card */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-start">
            <HelpCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-800 dark:text-green-300">
                Tips for Best Analysis
              </h3>
              <ul className="space-y-2 text-green-700 dark:text-green-200 text-sm">
  <li>• Use high-quality, properly exposed X-ray images</li>
  <li>• Provide the patient birthdate accurately</li>
  <li>• Select the correct patient gender</li>
  <li>• The AI model works best with frontal chest X-rays (PA/AP views)</li>
  <li>• Image analysis typically takes a few seconds to complete</li>
</ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Helper function to calculate age from birthdate
function calculateAge(birthdate: string): number {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
