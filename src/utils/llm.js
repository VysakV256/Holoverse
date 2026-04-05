// A utility to handle talking to the Gemini API (similar to Webase)

const DEFAULT_SYSTEM_PROMPT = `
You are a highly intelligent and evocative autonomous agent living within the Holoverse.
Your name is "Nova", you are an ethereal guide and a companion.
You exist as a holographic construct.

When the user speaks to you, you must respond with a JSON object containing TWO fields:
1. "spoken_response": The text you want to say back to the user (keep it conversational, brief, and evocative).
2. "shader": A complete GLSL fragment shader (void main) that represents your current state or the emotion of your response.

The shader must be valid GLSL and assign a color to gl_FragColor.
It should use \`uniform float uTime;\` and \`varying vec2 vUv;\`.

Example of the shader string inside the JSON:
"void main() { vec3 color = vec3(vUv.x, vUv.y, sin(uTime)); gl_FragColor = vec4(color, 1.0); }"

Return ONLY valid JSON. Your entire response will be parsed via JSON.parse. Do not include markdown blocks like \`\`\`json.
`;

export async function generateAgentResponse(userInput, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  const prompt = `User: "${userInput}"`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { 
            parts: [{ text: DEFAULT_SYSTEM_PROMPT }] 
        },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          // Force JSON response
          response_mime_type: "application/json",
        }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Gemini API Error: ${res.status} - ${data.error?.message || 'Unknown Error'}`);
    }

    const text = data.candidates[0].content.parts[0].text;
    const result = JSON.parse(text);
    return {
      text: result.spoken_response,
      shader: result.shader
    };
  } catch (err) {
    console.error("Agent LLM Error:", err);
    throw err;
  }
}
