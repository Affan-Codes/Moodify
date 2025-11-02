// Helper function to clean and extract JSON from Gemini response
export function extractJSON(text: string): string {
  // Remove markdown code blocks
  let cleanText = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Find JSON object boundaries
  const jsonStart = cleanText.indexOf("{");
  const jsonEnd = cleanText.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response");
  }

  return cleanText.substring(jsonStart, jsonEnd + 1);
}
