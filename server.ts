import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "SafeCircuit Simulation Server" });
  });

  // AI-assisted diagnostic explanation endpoint
  app.post("/api/ai-explain", async (req, res) => {
    try {
      const { issueTitle, description, why, affectedArea, simulatedMetrics } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        // Return clear, rule-grounded response if no API key is set
        return res.json({
          source: "SafeCircuit Simulation AI (Rule-Based Fallback)",
          explanation: `In this simulation, ${issueTitle.toLowerCase()} happens because ${why || "the calculated electrical parameters exceeded the normal operating envelope"}. The affected area (${affectedArea || "the simulated circuit"}) is subjected to stress which could degrade simulated wire insulation or cause breaker tripping. To resolve this in the simulation, rebalance the appliances across different circuits or upgrade simulated wire gauge.`,
          recommendations: [
            "Redistribute high-wattage simulated loads to alternative circuits",
            "Verify simulated breaker amperage matches wire gauge rating",
            "Ensure simulated RCCB / ground-fault protection is active for wet areas"
          ],
          disclaimer: "Educational simulation only. Not real-world electrical advice."
        });
      }

      const prompt = `You are SafeCircuit AI, a friendly educational diagnostic assistant inside SafeCircuit (a simulation-only electrical safety learning platform for beginners).
The user wants a deeper beginner-friendly explanation of a simulated household electrical problem.

Simulated Issue: ${issueTitle}
Summary: ${description}
Cause: ${why}
Affected Location: ${affectedArea}
Simulated Metrics: ${JSON.stringify(simulatedMetrics || {})}

Please explain in 2-3 clear, beginner-friendly paragraphs:
1. What is physically being modeled here in everyday terms (analogy or simple physics of current/heat/grounding).
2. Why this simulation triggered an alert or tripped simulated protection.
3. How applying the simulated fix (e.g., redistributing loads, upgrading wire gauge in simulation, enabling RCCB) brings the simulation back to safe parameters.

Strict constraints:
- Do not provide real electrical repair, rewiring, or DIY instructions.
- Explicitly emphasize this is simulated for educational safety awareness.
- Keep the tone encouraging, clear, and easy for non-electricians to understand.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      return res.json({
        source: "SafeCircuit AI (Gemini 3.8 Flash)",
        explanation: response.text,
        disclaimer: "Educational simulation only. Not real-world electrical advice."
      });
    } catch (error: any) {
      console.error("AI explanation error:", error);
      return res.status(500).json({
        error: "Failed to generate AI explanation",
        fallback: "The simulated condition exceeded configured electrical safety thresholds. Refer to the Learn module for conceptual details."
      });
    }
  });

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SafeCircuit server running on port ${PORT}`);
  });
}

startServer();
