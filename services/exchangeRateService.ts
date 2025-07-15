
import { GoogleGenAI } from "@google/genai";

// The API key is expected to be available in the environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchBrlCopRate(): Promise<number> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "What is the current exchange rate for 1 Brazilian Real (BRL) to Colombian Pesos (COP)? Provide only the numerical value, using a period as the decimal separator and no thousands separators.",
      config: {
        tools: [{ googleSearch: {} }],
        // Set temperature to 0 for a deterministic, factual answer
        temperature: 0,
      },
    });

    const text = response.text;
    
    // Extract the first number found in the text.
    // This regex handles numbers with an optional decimal part.
    const match = text.match(/[\d.]+/);

    if (match && match[0]) {
      const rate = parseFloat(match[0]);
      if (!isNaN(rate)) {
        return rate;
      }
    }
    
    // This error will be caught and displayed to the user.
    throw new Error("Could not parse a valid exchange rate from the AI response.");

  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    // Re-throw a user-friendly error message.
    throw new Error("Failed to fetch BRL-COP exchange rate from the AI service.");
  }
}
