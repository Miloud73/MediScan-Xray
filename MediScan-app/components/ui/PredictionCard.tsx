"use client";

type PredictionEntry = {
  label: string;
  confidence: number;
};

type PredictionResult = {
  prediction?: {
    label?: string;
    confidence?: number;
    probabilities?: {
      NORMAL?: number;
      PNEUMONIA?: number;
    };
  };
  predictions?: PredictionEntry[];
  [key: string]: any;
};

interface PredictionCardProps {
  result: PredictionResult;
}

export default function PredictionCard({ result }: PredictionCardProps) {
  const nestedPrediction = result?.prediction;
  const nestedProbs = nestedPrediction?.probabilities;

  let predictions: PredictionEntry[] = [];

  if (nestedProbs) {
    predictions = [
      {
        label: "Normal",
        confidence: Number(nestedProbs.NORMAL ?? 0),
      },
      {
        label: "Pneumonia",
        confidence: Number(nestedProbs.PNEUMONIA ?? 0),
      },
    ].sort((a, b) => b.confidence - a.confidence);
  } else if (result.predictions && Array.isArray(result.predictions)) {
    predictions = result.predictions.map((p) => ({
      label: p.label,
      confidence: Number(p.confidence ?? 0),
    }));
  } else {
    predictions = Object.entries(result)
      .filter(
        ([key, value]) =>
          typeof value === "number" &&
          ["Normal", "Pneumonia"].includes(key)
      )
      .map(([label, confidence]) => ({
        label,
        confidence: Number(confidence),
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  const topPrediction =
    nestedPrediction?.label && typeof nestedPrediction?.confidence === "number"
      ? {
          label:
            nestedPrediction.label === "PNEUMONIA"
              ? "Pneumonia"
              : "Normal",
          confidence: Number(nestedPrediction.confidence),
        }
      : predictions[0];

  const confidenceLevel =
    (topPrediction?.confidence ?? 0) >= 0.85
      ? "High"
      : (topPrediction?.confidence ?? 0) >= 0.65
      ? "Moderate"
      : "Low";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Prediction Result</h2>
        <p className="mt-1 text-sm text-slate-500">
          AI-based chest X-ray classification: Normal vs Pneumonia
        </p>
      </div>

      {topPrediction && (
        <div className="mb-6 rounded-xl bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Top Prediction</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {topPrediction.label}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Confidence:{" "}
            <span className="font-semibold">
              {(topPrediction.confidence * 100).toFixed(2)}%
            </span>{" "}
            · {confidenceLevel}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {predictions.map((prediction, index) => {
          const isHighest =
            topPrediction && prediction.label === topPrediction.label;

          return (
            <div key={index}>
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    isHighest ? "text-slate-900" : "text-slate-700"
                  }`}
                >
                  {prediction.label}
                </span>
                <span
                  className={`text-sm ${
                    isHighest ? "font-bold text-slate-900" : "text-slate-600"
                  }`}
                >
                  {(prediction.confidence * 100).toFixed(2)}%
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHighest ? "bg-sky-600" : "bg-slate-400"
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, prediction.confidence * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {nestedPrediction && (
        <div className="mt-6 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          <div>
            Predicted label:{" "}
            <span className="font-medium text-slate-900">
              {nestedPrediction.label === "PNEUMONIA" ? "PNEUMONIA" : "NORMAL"}
            </span>
          </div>
          <div className="mt-1">
            Pneumonia detected:{" "}
            <span className="font-medium text-slate-900">
              {nestedPrediction.label === "PNEUMONIA" ? "Yes" : "No"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}