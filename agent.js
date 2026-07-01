import readline from "readline";
import pc from "picocolors";
import { toolRegistry, toolDescriptions } from "./tools.js";
import { callMockLlm } from "./mockLlm.js";
import { GoogleGenAI } from "@google/genai";

// 1. Define the System Prompt instructing the LLM on the ReAct framework.
const SYSTEM_PROMPT = `You are a helpful AI assistant equipped with tools.
You run in a loop of Thought, Action, Observation, and Answer.
At each step, you reason about the task and decide whether to call a tool or provide the final answer.

${toolDescriptions}

Formatting Rules:
- If you need to use a tool, output exactly in this format:
Thought: <your reasoning about why you are calling this tool>
Action: <tool_name>:<tool_input_arguments>
(Do NOT output anything else after the Action line!)

- Once you have the information to answer the user's question, output:
Thought: <your explanation of how the observations answer the question>
Answer: <your final complete answer to the user>

Example Sequence:
User: What is the weather in Tokyo?
Thought: I need to get the current weather for Tokyo.
Action: getWeather:Tokyo
(Then, the system will run the tool and return the output as: Observation: Rainy, 15°C)
Thought: I now have the weather in Tokyo.
Answer: The weather in Tokyo is currently Rainy and 15°C.

Let's begin! Keep your outputs clean and follow the formatting rules exactly.`;

// 2. Helper to query the real Gemini API.
async function callRealLlm(messages) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please set it or run with --mock flag.");
  }
  
  const ai = new GoogleGenAI({});
  
  // Extract system instruction
  const systemMessage = messages.find(m => m.role === "system");
  const systemInstruction = systemMessage ? systemMessage.content : "";
  
  // Format contents for the official Google Gen AI SDK
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => {
      // Map roles: LLM expects 'user' or 'model'
      const role = m.role === "user" ? "user" : "model";
      return {
        role,
        parts: [{ text: m.content }]
      };
    });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.1 // Low temperature keeps tool calls consistent
    }
  });

  return response.text;
}

// 3. The Core ReAct Agent Loop
async function runAgent(query, isMock) {
  // Start the conversation history
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: query }
  ];

  let step = 1;
  const maxSteps = 5;

  console.log(pc.cyan(`\n🚀 Starting Agentic Loop for query: "${query}"`));

  while (step <= maxSteps) {
    console.log(pc.yellow(`\n--- Step ${step} ---`));
    
    let llmResponse = "";
    try {
      if (isMock) {
        // Simulate a slight network delay for natural feel
        await new Promise(resolve => setTimeout(resolve, 800));
        llmResponse = callMockLlm(messages);
      } else {
        llmResponse = await callRealLlm(messages);
      }
    } catch (err) {
      console.log(pc.red(`❌ LLM Call Failed: ${err.message}`));
      return;
    }

    // Print LLM's thought process
    console.log(pc.green(llmResponse));

    // Parse LLM response for Action or Answer
    const actionMatch = llmResponse.match(/Action:\s*(\w+):(.*)/);
    const answerMatch = llmResponse.match(/Answer:\s*([\s\S]*)/);

    // Save the LLM response to history so it maintains its own context
    messages.push({ role: "model", content: llmResponse });

    if (actionMatch) {
      const toolName = actionMatch[1].trim();
      const toolInput = actionMatch[2].trim();

      console.log(pc.blue(`⚙️ Tool execution: calling ${toolName}("${toolInput}")...`));

      const toolFn = toolRegistry[toolName];
      let observation = "";
      
      if (toolFn) {
        try {
          observation = toolFn(toolInput);
        } catch (e) {
          observation = `Error during execution: ${e.message}`;
        }
      } else {
        observation = `Error: Tool "${toolName}" is not registered.`;
      }

      console.log(pc.magenta(`📥 Observation: ${observation}`));

      // Feed the observation back to the model's history
      messages.push({ role: "user", content: `Observation: ${observation}` });
      step++;
    } else if (answerMatch) {
      console.log(pc.bold(pc.cyan(`\n🎯 Final Answer (Resolved in ${step} steps):`)));
      console.log(pc.white(answerMatch[1].trim()));
      return;
    } else {
      console.log(pc.red("\n⚠️ Format Error: The LLM output did not follow the ReAct Action/Answer structure. Exiting loop."));
      return;
    }
  }

  console.log(pc.red(`\n❌ Failed to resolve answer within maximum limit of ${maxSteps} steps.`));
}

// 4. CLI Setup & Entrypoint
async function main() {
  const args = process.argv.slice(2);
  const isMock = args.includes("--mock") || !process.env.GEMINI_API_KEY;

  // Filter out the --mock flag to see if a query was passed directly
  const queryArgs = args.filter(arg => arg !== "--mock");
  const directQuery = queryArgs.join(" ").trim();

  if (directQuery) {
    // If a direct query was provided via CLI, run it and exit
    await runAgent(directQuery, isMock);
    process.exit(0);
  }

  console.clear();
  console.log(pc.bold(pc.magenta("==========================================")));
  console.log(pc.bold(pc.magenta("      🤖 DAY 1: MY FIRST AI AGENT 🤖      ")));
  console.log(pc.bold(pc.magenta("==========================================")));
  console.log(pc.gray(`Running in: ${isMock ? pc.bold(pc.yellow("MOCK MODE")) : pc.bold(pc.green("LIVE MODE (Gemini API)"))}`));
  
  if (isMock) {
    console.log(pc.dim("💡 Mock Mode does not require an API key."));
    console.log(pc.dim("💡 Try these sample prompts to see the agent chain multiple tools:"));
    console.log(pc.yellow('  1. "What is the weather in Tokyo and what is that temperature multiplied by 2?"'));
    console.log(pc.yellow('  2. "Explain what Agentic AI is and then look up the ReAct framework."'));
    console.log(pc.dim("\n💡 Or set GEMINI_API_KEY environment variable to test Live Mode with arbitrary inputs!"));
  } else {
    console.log(pc.green("✔ Connected to Gemini Live API. You can ask any question using the registered tools."));
  }
  console.log(pc.bold(pc.magenta("==========================================\n")));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const promptUser = () => {
    rl.question(pc.cyan("Enter your prompt (or 'exit' to quit): "), async (input) => {
      const query = input.trim();
      if (!query) {
        promptUser();
        return;
      }
      if (query.toLowerCase() === "exit" || query.toLowerCase() === "quit") {
        console.log(pc.yellow("\nGoodbye! Happy learning. 👋"));
        rl.close();
        return;
      }

      await runAgent(query, isMock);
      console.log(pc.dim("\n------------------------------------------"));
      promptUser();
    });
  };

  promptUser();
}

main();
