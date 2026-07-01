/**
 * Mock LLM Simulator.
 * This simulates the reasoning of a Large Language Model using the ReAct framework.
 * By using this mock LLM, you can see exactly how the ReAct loop manages state,
 * parses thoughts, calls tools, and arrives at a final answer without needing an API key.
 */

export function callMockLlm(messages) {
  // We inspect the conversation history to determine what the next step should be.
  // This mirrors how a real LLM processes the entire chat history.
  
  // Find the original user prompt (the first message or the last user message)
  const userMessage = messages.find(m => m.role === "user")?.content || "";
  const normalizedQuery = userMessage.toLowerCase();

  // Track the history of observations to know where we are in the loop
  const observations = messages.filter(m => m.role === "user" && m.content.startsWith("Observation:"));
  const numObservations = observations.length;
  
  // Helper to extract clean observation value without "Observation:" prefix
  const getObsValue = (msg) => msg.content.replace(/^Observation:\s*/, "").trim();

  // --- Case 1: Tokyo Weather & Calculation Demo ---
  if (normalizedQuery.includes("weather") && normalizedQuery.includes("tokyo") && normalizedQuery.includes("2")) {
    if (numObservations === 0) {
      // Step 1: Initial Thought and Tool Call
      return `Thought: The user wants to find the weather in Tokyo and then multiply the temperature value by 2. I need to get the weather for Tokyo first.
Action: getWeather:Tokyo`;
    } 
    
    if (numObservations === 1) {
      // Step 2: Receive weather observation, request calculation
      const lastObsVal = getObsValue(observations[0]);
      // Extract temperature if present, default to 15 if parse fails
      const tempMatch = lastObsVal.match(/(\d+)°C/);
      const temp = tempMatch ? tempMatch[1] : "15";
      
      return `Thought: The weather in Tokyo is reported, and the temperature is ${temp}°C. Now I need to multiply this temperature (${temp}) by 2.
Action: calculate:${temp} * 2`;
    }

    if (numObservations === 2) {
      // Step 3: Receive math observation, provide final answer
      const lastObsVal = getObsValue(observations[1]); // should be "30"
      return `Thought: The math calculation is complete and the result is ${lastObsVal}. I have all the information required.
Answer: The weather in Tokyo is Rainy, 15°C (59°F), and that temperature multiplied by 2 is ${lastObsVal}.`;
    }
  }

  // --- Case 2: Agentic AI & ReAct Wikipedia Demo ---
  if (normalizedQuery.includes("agentic") && normalizedQuery.includes("react")) {
    if (numObservations === 0) {
      // Step 1: Initial Thought and Wiki Search for Agentic AI
      return `Thought: The user wants an explanation of Agentic AI and a lookup of the ReAct framework. I should search for "Agentic AI" in Wikipedia first.
Action: searchWiki:Agentic AI`;
    }

    if (numObservations === 1) {
      // Step 2: Receive definition of Agentic AI, request ReAct search
      return `Thought: I have found information on Agentic AI. Next, I must lookup the ReAct framework to complete the request.
Action: searchWiki:ReAct framework`;
    }

    if (numObservations === 2) {
      // Step 3: Final Answer combining both definitions
      return `Thought: I now have the definitions for both Agentic AI and the ReAct framework. I can compile the final explanation.
Answer: **Agentic AI** refers to systems where an AI (typically an LLM) is given the autonomy to reason, plan, use tools, and make decisions to accomplish a goal, running in a loop rather than responding with a single static generation. 
The **ReAct framework** is a key design pattern for this, combining reasoning (thoughts) and acting (tool executions) in a synergistic loop to solve complex tasks dynamically.`;
    }
  }

  // --- Default Fallback ---
  return `Answer: Hello! I am in Mock Mode. I only know how to simulate the ReAct loop for two specific demo queries:
1. "What is the weather in Tokyo and what is that temperature multiplied by 2?"
2. "Explain what Agentic AI is and then look up the ReAct framework."

To ask me arbitrary questions, you can set the GEMINI_API_KEY environment variable and run me in Live Mode!`;
}
