/**
 * Simple tools that our agent can execute.
 * In a production agent, these would call real APIs, databases, or run actual shell commands.
 */

// 1. A tool to simulate getting the current weather.
export function getWeather(city) {
  const normalizedCity = city.trim().toLowerCase();
  
  const weatherDb = {
    tokyo: "Rainy, 15°C (59°F), humidity 85%",
    paris: "Sunny, 22°C (71.6°F), humidity 40%",
    "new york": "Cloudy, 18°C (64.4°F), humidity 60%",
    london: "Drizzle, 12°C (53.6°F), humidity 90%",
    delhi: "Hot and sunny, 38°C (100.4°F), humidity 30%"
  };

  for (const [key, value] of Object.entries(weatherDb)) {
    if (normalizedCity.includes(key)) {
      return `Weather in ${city}: ${value}`;
    }
  }
  
  return `Weather in ${city}: Partially cloudy, 20°C (68°F), humidity 50% (default forecast)`;
}

// 2. A tool to safely perform mathematical calculations.
export function calculate(expression) {
  try {
    // Basic sanitization to prevent executing malicious code
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
    
    // Evaluate the arithmetic expression
    // We use a simple Function constructor instead of eval to avoid scope pollution
    const result = new Function(`return (${sanitized})`)();
    
    if (result === undefined || isNaN(result)) {
      return "Error: Invalid calculation expression";
    }
    
    return result.toString();
  } catch (error) {
    return `Error: Could not calculate "${expression}". Details: ${error.message}`;
  }
}

// 3. A tool to search a mock knowledge base (like Wikipedia).
export function searchWiki(query) {
  const normalizedQuery = query.trim().toLowerCase();
  
  const wikiDb = {
    "agentic ai": "Agentic AI refers to systems where an AI (typically a Large Language Model) is given autonomy to reason, plan, use tools, and make decisions to accomplish a goal, running in a loop rather than responding with a single static generation.",
    "react framework": "The ReAct (Reasoning + Acting) framework, introduced by Yao et al. in 2022, combines reasoning (thought steps) and acting (calling tools) in a synergistic loop, enabling LLMs to solve complex tasks dynamically.",
    "gemini": "Gemini is a family of multimodal generative AI models developed by Google, designed to handle text, code, images, audio, and video natively.",
    "node.js": "Node.js is a cross-platform, open-source JavaScript runtime environment that can run JavaScript code outside of a web browser, often used to build backend servers and command-line scripts."
  };

  for (const [key, value] of Object.entries(wikiDb)) {
    if (normalizedQuery.includes(key)) {
      return `Wikipedia snippet for "${key}": ${value}`;
    }
  }

  return `Search result for "${query}": No matching short article found, but the term is associated with modern technology concepts.`;
}

// Map tool names to their actual functions for execution
export const toolRegistry = {
  getWeather,
  calculate,
  searchWiki
};

// Help text to give the LLM in the system prompt
export const toolDescriptions = `
Available tools:
1. getWeather(city)
   Description: Get the current weather conditions and temperature for a given city.
   Format: Action: getWeather:Tokyo

2. calculate(expression)
   Description: Safely evaluate basic math operations (addition, subtraction, multiplication, division).
   Format: Action: calculate:15 * 2

3. searchWiki(query)
   Description: Search Wikipedia for a summary of a concept or technology.
   Format: Action: searchWiki:Agentic AI
`;
