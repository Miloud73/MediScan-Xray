"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import PredictionCard from "@/components/ui/PredictionCard";
import HeatmapViewer from "@/components/ui/HeatmapViewer";
import RuleBasedAdvice from "@/components/ui/RuleBasedAdvice";
import AlertBanner from "@/components/ui/AlertBanner";
import { ArrowLeft, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AnalysisResult } from "@/types";

const HIGH_RISK_THRESHOLD = 0.7;

export default function ResultPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [highRiskCondition, setHighRiskCondition] = useState<{
    name: string;
    confidence: number;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    const savedResult = sessionStorage.getItem("xrayResult");
    const savedImage = sessionStorage.getItem("originalImageUrl");

    if (!savedResult) {
      router.push("/analyze");
      return;
    }

    try {
      const parsedResult = JSON.parse(savedResult);
      const processedResult = processResults(parsedResult);
      setResult(processedResult);
      if (savedImage) setOriginalImageUrl(savedImage);
    } catch (error) {
      console.error("Error parsing results:", error);
      router.push("/analyze");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

const processResults = (data: any): AnalysisResult => {
  const processedData: AnalysisResult = { ...data };

  const finalDiseases = Array.isArray(data.final_detected_diseases)
    ? data.final_detected_diseases
    : [];

  if (finalDiseases.length > 0) {
    processedData.predictions = finalDiseases.map((disease: any) => ({
      label: disease.label,
      confidence: Number(
        disease.probability ?? disease.confidence ?? 0
      ),
    }));

    const predictions = processedData.predictions ?? [];

    const topDisease = [...predictions].sort(
      (a, b) => b.confidence - a.confidence
    )[0];


    processedData.topPrediction = topDisease;

    if (
      data.prediction?.has_pneumonia === true &&
      Number(data.prediction?.confidence ?? 0) >= HIGH_RISK_THRESHOLD
    ) {
      setHighRiskCondition({
        name: "Pneumonia",
        confidence: Number(data.prediction.confidence),
      });
    } else {
      setHighRiskCondition(null);
    }

    return processedData;
  }

  if (data.prediction && data.prediction.probabilities) {
    const probs = data.prediction.probabilities;

    const normalConfidence = Number(
      probs.NORMAL ?? probs.Normal ?? probs["No Finding"] ?? data.Normal ?? 0
    );

    const pneumoniaConfidence = Number(
      probs.PNEUMONIA ?? probs.Pneumonia ?? data.Pneumonia ?? 0
    );

    processedData.predictions = [
      {
        label: "Normal",
        confidence: normalConfidence,
      },
      {
        label: "Pneumonia",
        confidence: pneumoniaConfidence,
      },
    ].sort((a, b) => b.confidence - a.confidence);

    processedData.topPrediction = {
      label: data.prediction.label ?? processedData.predictions[0].label,
      confidence: Number(data.prediction.confidence ?? 0),
    };

    if (
      data.prediction.has_pneumonia === true &&
      processedData.topPrediction.confidence >= HIGH_RISK_THRESHOLD
    ) {
      setHighRiskCondition({
        name: "Pneumonia",
        confidence: processedData.topPrediction.confidence,
      });
    } else {
      setHighRiskCondition(null);
    }

    return processedData;
  }

  const normalValue = Number(data["Normal"] ?? 0);
  const pneumoniaValue = Number(data["Pneumonia"] ?? 0);

  processedData.predictions = [
    { label: "Normal", confidence: normalValue },
    { label: "Pneumonia", confidence: pneumoniaValue },
  ].sort((a, b) => b.confidence - a.confidence);

  processedData.topPrediction = processedData.predictions[0];

  if (pneumoniaValue >= HIGH_RISK_THRESHOLD) {
    setHighRiskCondition({
      name: "Pneumonia",
      confidence: pneumoniaValue,
    });
  } else {
    setHighRiskCondition(null);
  }

  return processedData;
};

  const handleDownloadReport = async () => {
    if (!result) return;

    setIsDownloading(true);

    try {
      const reportElement = document.getElementById("diagnosis-report");
      if (!reportElement) return;

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      pdf.setFontSize(20);
      pdf.text("MediScan Diagnostic Report", 20, 20);

      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 28);

      pdf.setFontSize(14);
      pdf.text("Chest X-ray Analysis Summary", 20, 40);

      if (originalImageUrl) {
        try {
          pdf.addImage(originalImageUrl, "JPEG", 20, 48, 60, 60);
        } catch (e) {
          console.warn("Could not add original image to PDF:", e);
        }
      }

      const sortedConditions =
        result.final_detected_diseases && result.final_detected_diseases.length > 0
        ? result.final_detected_diseases.map(
            (disease) =>
              [
                disease.label,
                Number(disease.probability ?? disease.confidence ?? 0),
              ] as [string, number]
          )
        : result?.predictions && Array.isArray(result.predictions)
        ? result.predictions.map(
            (p) => [p.label, p.confidence] as [string, number]
          )
        : Object.entries(result || {})
            .filter(
              ([key, value]) =>
                ["Normal", "Pneumonia"].includes(key) &&
                typeof value === "number"
            )
            .sort(([, a], [, b]) => Number(b) - Number(a))
            .slice(0, 2);

      let yPos = 120;
      pdf.setFontSize(14);
      pdf.text("Detected Conditions:", 20, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      sortedConditions.forEach(([condition, confidence], index) => {
        pdf.text(
          `${index + 1}. ${condition}: ${(Number(confidence) * 100).toFixed(
            1
          )}% confidence`,
          25,
          yPos
        );
        yPos += 8;
      });

      if (result.patientName || result.age !== undefined || result.gender) {
        yPos += 4;
        pdf.setFontSize(14);
        pdf.text("Patient Information:", 20, yPos);
        yPos += 10;


        pdf.setFontSize(11);

        if (result.patientName) {
          pdf.text(`Patient Name: ${result.patientName}`, 25, yPos);
          yPos += 8;
        }
        if (result.age !== undefined) {
          pdf.text(`Age: ${result.age}`, 25, yPos);
          yPos += 8;
        }
        if (result.gender) {
          pdf.text(`Gender: ${result.gender}`, 25, yPos);
          yPos += 8;
        }
      }
      if (result.ui_decision) {
  yPos += 4;
  pdf.setFontSize(14);
  pdf.text("AI Decision Support:", 20, yPos);
  yPos += 10;

  pdf.setFontSize(11);
  const decisionText = `${result.ui_decision.title}: ${result.ui_decision.message}`;
  const splitDecisionText = pdf.splitTextToSize(decisionText, 170);
  pdf.text(splitDecisionText, 25, yPos);
  yPos += splitDecisionText.length * 6 + 4;

  if (result.ui_decision.specialist_required) {
    pdf.text(
      `Recommended specialist: ${result.ui_decision.specialist || "Pulmonologist"}`,
      25,
      yPos
    );
    yPos += 8;
  }
}

      yPos += 4;
      pdf.setFontSize(14);
      pdf.text("Clinical Notes:", 20, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      sortedConditions.forEach(([condition, confidence]) => {
        let advice = "";

        if (condition.toLowerCase().includes("pneumonia")) {
          advice =
            "Radiographic findings may be consistent with pneumonia. Correlate with clinical evaluation and consider specialist review if needed.";
        } else if (condition.toLowerCase() === "normal") {
          advice =
            "No significant radiographic abnormalities detected. Correlate with clinical presentation.";
        } else {
          advice =
            "Findings suggest abnormality that may require further investigation.";
        }

        const text = `${condition} (${(Number(confidence) * 100).toFixed(
          1
        )}%): ${advice}`;
        const splitText = pdf.splitTextToSize(text, 170);
        pdf.text(splitText, 25, yPos);
        yPos += splitText.length * 6 + 4;
      });

      pdf.setFontSize(9);
      pdf.text(
        "Disclaimer: This report is AI-assisted and must not replace professional medical diagnosis.",
        20,
        285
      );

      pdf.save(`mediscan-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading results...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!result) return null;

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {highRiskCondition && (
          <div className="mb-6">
            <AlertBanner
              condition={highRiskCondition.name}
              confidence={highRiskCondition.confidence}
            />
          </div>
        )}
       
        
        
        {/* start bottons */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/analyze"
              className="inline-flex items-center px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 mb-3"
              >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analyze
            </Link>
          </div>

          <button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="inline-flex items-center px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-50"
            >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? "Generating..." : "Download Report"}
          </button>
        </div>
        {/* start bottons */}

        
        {result?.ui_decision?.type === "other_pulmonary_disease" && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-amber-900">
              {result.ui_decision.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              {result.ui_decision.message}
            </p>


            <div className="mt-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
              <strong>Décision recommandée :</strong>{" "}
              Veuillez consulter un {result.ui_decision.specialist || "pneumologue"}.
            </div>
          </div>
        )}
        <div
          id="diagnosis-report"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 space-y-6">
            {originalImageUrl && (
              <HeatmapViewer
                originalImageUrl={originalImageUrl}
                predictionResult={result || undefined}
                className="aspect-square w-full"
              />
            )}
          
            <RuleBasedAdvice result={result} />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <PredictionCard result={result} />

            {(result.patientName || result.age !== undefined || result.gender) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Patient Information
                </h2>
                <div className="space-y-3 text-sm text-slate-700">
                  {result.patientName && (
                    <div className="flex justify-between">
                      <span>Patient Name</span>
                      <span className="font-medium">{result.patientName}</span>
                    </div>
                  )}
                  {result.age !== undefined && (
                    <div className="flex justify-between">
                      <span>Age</span>
                      <span className="font-medium">{result.age}</span>
                    </div>
                  )}
                  {result.gender && (
                    <div className="flex justify-between">
                      <span>Gender</span>
                      <span className="font-medium capitalize">
                        {result.gender}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
