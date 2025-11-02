import { analyzeTherapySession, processChatMessage } from "./aiFunctions";

// Add the function to the exported array:
export const functions = [analyzeTherapySession, processChatMessage];
