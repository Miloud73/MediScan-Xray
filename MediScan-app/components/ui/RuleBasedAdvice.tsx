"use client";

import { AlertTriangle, BookOpen, Stethoscope } from "lucide-react";

interface RuleBasedAdviceProps {
  result: Record<string, any>;
  className?: string;
}

const RuleBasedAdvice: React.FC<RuleBasedAdviceProps> = ({
  result,
  className = "",
}) => {
  const uiDecision = result?.ui_decision;

  const getAdvice = () => {
    if (result?.ui_decision?.type === "normal") {
      return {
        title: "Normal",
        description:
          "Le système n’a pas détecté de pneumonie ni d’autre anomalie pulmonaire significative.",
        icon: <Stethoscope className="h-5 w-5 text-green-500" />,
        recommendations: [
          "Aucune anomalie majeure détectée par le système.",
          "Consulter un professionnel de santé si les symptômes persistent.",
          "Ce résultat ne remplace pas l’avis d’un médecin.",
        ],
      };
    }
    
    
    if (result?.ui_decision?.type === "other_pulmonary_disease") {
      return {
        title: "Anomalie pulmonaire détectée",
        description:
          "L’image ne semble pas indiquer une pneumonie, mais le système a détecté une anomalie pulmonaire possible. Il est recommandé de consulter un spécialiste des poumons pour une interprétation médicale complète.",
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        recommendations: [
          "Consulter un spécialiste des poumons.",
          "Ne pas considérer ce résultat comme un diagnostic final.",
          "Comparer le résultat avec les symptômes du patient.",
          "Faire une évaluation médicale complète si les symptômes persistent.",
        ],
      };
    }

    if (uiDecision?.type === "other_pulmonary_disease") {
      const labels =
        uiDecision.detected_labels && uiDecision.detected_labels.length > 0
          ? uiDecision.detected_labels.join(", ")
          : "autre anomalie pulmonaire";

      return {
        title: uiDecision.title || "Anomalie pulmonaire détectée",
        description:
          uiDecision.message ||
          `Le système n’a pas détecté une pneumonie, mais il a détecté une anomalie possible : ${labels}.`,
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        recommendations: [
          `Consulter un ${uiDecision.specialist || "pneumologue"} pour une interprétation médicale complète.`,
          "Ne pas considérer ce résultat comme un diagnostic final.",
          "Comparer avec les symptômes, l’examen clinique et les antécédents du patient.",
          "Prévoir une évaluation spécialisée ou une imagerie complémentaire si nécessaire.",
        ],
      };
    }

    if (uiDecision?.type === "normal") {
      return {
        title: uiDecision.title || "Aucune pathologie majeure détectée",
        description:
          uiDecision.message ||
          "Le système n’a pas détecté de pneumonie ni d’autre anomalie pulmonaire significative.",
        icon: <Stethoscope className="h-5 w-5 text-green-500" />,
        recommendations: [
          "Corréler avec les symptômes du patient.",
          "Consulter un professionnel de santé si les symptômes persistent.",
          "Faire un suivi médical si le patient présente des facteurs de risque.",
        ],
      };
    }

    return {
      title: "Clinical Decision Support",
      description:
        "The findings are non-specific and may require further evaluation.",
      icon: <BookOpen className="h-5 w-5 text-sky-500" />,
      recommendations: [
        "Correlate with clinical symptoms and laboratory findings.",
        "Consider additional imaging studies based on clinical suspicion.",
        "Consider pulmonology consultation if persistent abnormalities.",
      ],
    };
  };

  const advice = getAdvice();

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}
    >
      <div className="flex items-center mb-4">
        {advice.icon}
        <h3 className="text-xl font-bold ml-2">{advice.title}</h3>
      </div>

      <p className="mb-4 text-gray-700 dark:text-gray-300">
        {advice.description}
      </p>

      {uiDecision?.type === "other_pulmonary_disease" &&
        uiDecision?.diseases &&
        uiDecision.diseases.length > 0 && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">
              Maladie(s) possible(s) détectée(s)
            </h4>

            <ul className="space-y-2">
              {uiDecision.diseases.map((disease: any, index: number) => (
                <li
                  key={index}
                  className="flex justify-between text-sm text-amber-900"
                >
                  <span>{disease.label}</span>
                  <span className="font-semibold">
                    {Number(
                      disease.percentage ??
                        ((disease.probability ?? disease.confidence ?? 0) * 100)
                    ).toFixed(2)}
                    %
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      <div>
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Recommendations
        </h4>

        <ul className="space-y-2">
          {advice.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2 mt-0.5 text-green-500 dark:text-green-400">
                •
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {rec}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          Note: This is decision support only. Clinical judgment should always
          supersede automated predictions.
        </p>
      </div>
    </div>
  );
};

export default RuleBasedAdvice;