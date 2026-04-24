import { AnalysisResult } from "../types";
import { apiRequest } from "./apiClient";
import { isDemoMode } from "@/lib/config";
import { generateMockHeartResult } from "./mockService"; // we'll add this to mockService.ts

/**
 * Analyzes patient vitals for heart disease by sending them to the backend API
 * Falls back to mock data generation when backend is unavailable
 */
export async function analyzeHeart(vitals: Record<string, any>): Promise<AnalysisResult> {
  try {
    if (!vitals) {
      throw new Error("Vitals data is required");
    }

    // Check if we're in demo mode (backend unavailable)
    const usingDemoMode = await isDemoMode();

    if (usingDemoMode) {
      console.log("[Heart Service] Using mock analysis data (demo mode)");

      // Add a delay to simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Return mock data
      return generateMockHeartResult(vitals);
    }

    // Real API request to backend
    const response = await apiRequest<AnalysisResult>({
      endpoint: "/api/heart/analyze-heart/",
      method: "POST",
      body: JSON.stringify(vitals),
      requiresAuth: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.error) {
      throw response.error;
    }

    return response.data as AnalysisResult;
  } catch (error) {
    console.error("[Heart Service] Error analyzing data:", error);

    // Fallback to mock data as last resort
    return generateMockHeartResult(vitals);
  }
}

export const analyzeAndSubmitHeart = analyzeHeart;
