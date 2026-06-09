"use client";

type DiseasePrediction = {
  label: string;
  probability?: number;
  percentage?: number;
  confidence?: number;
  detected?: boolean;
  source_model?: string;
};

type PredictionEntry = {
  label: string;
  confidence: number;
  source_model?: string;
};

type PredictionResult = {
  prediction?: {
    label?: string;
    final_status?: string;
    has_pneumonia?: boolean;
    confidence?: number;
    probabilities?: Record<string, number>;
  };
  final_detected_diseases?: DiseasePrediction[];
  multi_label_prediction?: {
    detected_diseases?: DiseasePrediction[];
    all_probabilities?: DiseasePrediction[];
    top_prediction?: DiseasePrediction;
  };
  ui_decision?: {
    type: "pneumonia" | "other_pulmonary_disease" | "normal";
    title: string;
    message: string;
    specialist_required: boolean;
    specialist?: string | null;
    diseases?: DiseasePrediction[];
  };
  predictions?: PredictionEntry[];
  [key: string]: any;
};

interface PredictionCardProps {
  result: PredictionResult;
}

export default function PredictionCard({ result }: PredictionCardProps) {
  if (result?.ui_decision?.type === "normal") {
    return (
      <div className="rounded-2xl border border-green-300 bg-green-50 p-6 shadow-sm">
        <div className="mb-3">
          <h2 className="text-xl font-bold text-green-900">
            Normal
          </h2>

          <p className="mt-2 text-sm leading-6 text-green-800">
            Le système n’a pas détecté de pneumonie ni d’autre anomalie pulmonaire significative.
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-green-100 px-4 py-3 text-sm text-green-900">
          <strong>Résultat :</strong> radiographie classée comme normale.
        </div>
      </div>
    );
  }
  
  if (result?.ui_decision?.type === "other_pulmonary_disease") {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
        <div className="mb-3">
          <h2 className="text-xl font-bold text-amber-900">
            Anomalie pulmonaire détectée
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            L’image ne semble pas indiquer une pneumonie, mais le système a détecté
            une anomalie pulmonaire possible.
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          <strong>Décision recommandée :</strong>{" "}
          veuillez consulter un spécialiste des poumons.
        </div>
      </div>
    );
  }
  const finalDiseases = Array.isArray(result.final_detected_diseases)
    ? result.final_detected_diseases
    : [];

  let predictions: PredictionEntry[] = [];

  if (finalDiseases.length > 0) {
    predictions = finalDiseases.map((disease) => ({
      label: disease.label,
      confidence: Number(disease.probability ?? disease.confidence ?? 0),
      source_model: disease.source_model,
    }));
  } else if (
    result.multi_label_prediction?.all_probabilities &&
    result.multi_label_prediction.all_probabilities.length > 0
  ) {
    predictions = result.multi_label_prediction.all_probabilities
      .map((disease) => ({
        label: disease.label,
        confidence: Number(disease.probability ?? disease.confidence ?? 0),
        source_model: disease.source_model,
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6);
  } else if (result.prediction?.probabilities) {
    const probs = result.prediction.probabilities;

    predictions = Object.entries(probs)
      .map(([label, confidence]) => ({
        label,
        confidence: Number(confidence),
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6);
  } else if (result.predictions && Array.isArray(result.predictions)) {
    predictions = result.predictions.map((p) => ({
      label: p.label,
      confidence: Number(p.confidence ?? 0),
    }));
  }

  const topPrediction =
    predictions.length > 0
      ? [...predictions].sort((a, b) => b.confidence - a.confidence)[0]
      : result.prediction?.label
      ? {
          label: result.prediction.label,
          confidence: Number(result.prediction.confidence ?? 0),
        }
      : undefined;

  const confidenceLevel =
    (topPrediction?.confidence ?? 0) >= 0.85
      ? "High"
      : (topPrediction?.confidence ?? 0) >= 0.65
      ? "Moderate"
      : "Low";

  const decisionType = result.ui_decision?.type;

  const decisionStyle =
    decisionType === "pneumonia"
      ? "border-red-200 bg-red-50 text-red-900"
      : decisionType === "other_pulmonary_disease"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-green-200 bg-green-50 text-green-900";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">
          Prediction Result
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          AI-based chest X-ray analysis
        </p>
      </div>

      {result.ui_decision && (
        <div className={`mb-6 rounded-xl border p-4 ${decisionStyle}`}>
          <div className="text-sm font-semibold">
            {result.ui_decision.title}
          </div>
          <p className="mt-1 text-sm">{result.ui_decision.message}</p>

          {result.ui_decision.specialist_required && (
            <div className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm font-medium">
              Recommended decision: consult a{" "}
              {result.ui_decision.specialist || "Pulmonologist"}.
            </div>
          )}
        </div>
      )}

      {topPrediction && (
        <div className="mb-6 rounded-xl bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Top Prediction</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {topPrediction.label === "No Finding" ? "Normal" : topPrediction.label}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Confidence:{" "}
            <span className="font-semibold">
              {(topPrediction.confidence * 100).toFixed(2)}%
            </span>{" "}
            · {confidenceLevel}
          </div>

          {result.prediction?.final_status && (
            <div className="mt-2 text-sm text-slate-500">
              Status: {result.prediction.final_status}
            </div>
          )}
        </div>
      )}

     

      {result.prediction && (
        <div className="mt-6 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          <div>
            Predicted label:{" "}
            <span className="font-medium text-slate-900">
              {result.prediction.label}
            </span>
          </div>

          <div className="mt-1">
            Pneumonia detected:{" "}
            <span className="font-medium text-slate-900">
              {result.prediction.has_pneumonia ? "Yes" : "No"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}