import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CareerAssets, Tone, JobMatchAnalysis, CompanyResearch } from "../types";

const apiKey = process.env.API_KEY;

// We assume the key is present as per instructions.
const ai = new GoogleGenAI({ apiKey: apiKey });

// Model to use for complex reasoning
const MODEL_NAME = 'gemini-3-pro-preview';
const THINKING_BUDGET = 32768;

export const researchCompany = async (companyInput: string, userRoleContext: string): Promise<CompanyResearch> => {
  try {
    const prompt = `
      Research the target company: "${companyInput}".
      
      Using Google Search, find the following up-to-date information regarding roles related to: "${userRoleContext}":
      1. **Culture**: Summarize their mission, values, and what they look for in talent.
      2. **Work Mode**: Are they Remote, Hybrid, or On-site? (Look for recent policies).
      3. **Salary**: Estimated starting salary range for Freshers/Interns in this domain at this company.
      4. **Availability**: Do they currently hire Interns or fresh graduates?

      IMPORTANT: Return the result as a VALID JSON object. Do not include markdown formatting like \`\`\`json.
      The JSON must have these keys: "culture", "workMode", "salary", "availability".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseSchema and responseMimeType are NOT allowed with googleSearch
      }
    });

    let jsonText = response.text || "{}";
    // Cleanup markdown if present despite instructions
    jsonText = jsonText.replace(/```json\n?|\n?```/g, '').trim();
    
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (e) {
      console.warn("Failed to parse company research JSON, falling back to raw text", e);
      data = {
        culture: response.text || "Could not parse research.",
        workMode: "Unknown",
        salary: "Unknown",
        availability: "Unknown"
      };
    }
    
    const sources: string[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
        if (chunk.web?.uri) {
          sources.push(chunk.web.uri);
        }
      });
    }

    return {
      culture: data.culture || "Information not found.",
      workMode: data.workMode || "Information not found.",
      salary: data.salary || "Information not found.",
      availability: data.availability || "Information not found.",
      sources
    };
  } catch (error) {
    console.error("Error researching company:", error);
    return {
      culture: "Could not retrieve company info.",
      workMode: "Unknown",
      salary: "Unknown",
      availability: "Unknown",
      sources: []
    };
  }
};

export const generateAssets = async (
  rawNotes: string, 
  tone: Tone = 'Professional',
  companyContext: string = ''
): Promise<CareerAssets> => {
  try {
    const prompt = `
      You are an expert Career Coach and Resume Writer specializing in helping students and freshers land high-quality internships and entry-level jobs.
      
      **Student's Raw Inputs (Skills, Experience, Desired Role):**
      "${rawNotes}"
      
      **Configuration:**
      - **Tone:** ${tone}
      ${companyContext ? `- **Target Company Insights:** ${companyContext} (Use this to tailor the Cover Letter and Motivation).` : ''}

      **Tasks:**
      1. **Resume Draft:** A structured, ATS-friendly resume layout (Markdown). Focus on highlighting projects, coursework, and soft skills since experience might be limited.
      
      2. **Cover Letter:** A persuasive cover letter for the target role/company. Connect the student's academic background to real-world value.
      
      3. **Interview Prep:** 10 likely interview questions for this specific fresher role (Technical & Behavioral) + "Star Method" answer guides.
      
      4. **LinkedIn Content:** 
         - A punchy Headline.
         - An engaging "About" section summary.
      
      5. **Networking Messages:** 3 templates for cold messaging alumni or recruiters on LinkedIn (Connection request + Follow up).
      
      6. **Skill Gap Analysis:** Based on the desired role, what standard industry skills is this student missing? Be specific.
      
      7. **ATS Optimization:** A checklist of keywords and formatting tips to ensure this resume passes automated screeners for this role.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resumeDraft: {
              type: Type.STRING,
              description: "Markdown formatted Resume."
            },
            coverLetter: {
              type: Type.STRING,
              description: "Markdown formatted Cover Letter."
            },
            interviewPrep: {
              type: Type.STRING,
              description: "Markdown formatted Interview Question & Answer Guide."
            },
            linkedinContent: {
              type: Type.STRING,
              description: "Markdown formatted LinkedIn Headline and About section."
            },
            networkingMessages: {
              type: Type.STRING,
              description: "Markdown formatted outreach templates."
            },
            skillGapAnalysis: {
              type: Type.STRING,
              description: "Markdown report on missing skills."
            },
            atsOptimization: {
              type: Type.STRING,
              description: "Markdown report on keywords and ATS tips."
            }
          },
          required: ["resumeDraft", "coverLetter", "interviewPrep", "linkedinContent", "networkingMessages", "skillGapAnalysis", "atsOptimization"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response generated from AI");
    }

    const parsed = JSON.parse(jsonText) as CareerAssets;
    return parsed;

  } catch (error) {
    console.error("Error generating assets:", error);
    throw error;
  }
};

export const analyzeJobMatch = async (
  studentProfile: string,
  targetJobDescription: string
): Promise<JobMatchAnalysis> => {
  try {
    const prompt = `
      You are an AI Recruiter Simulator.
      
      **Context:**
      I am a student/fresher applying for a job. 
      
      **My Profile/Resume Content:**
      ${studentProfile}

      **Target Job Description (JD):**
      ${targetJobDescription.substring(0, 5000)}

      **Tasks:**
      1. Calculate a **Match Score** (0-100).
      2. Write a **Tailored Summary** I should use at the top of my resume for *this specific application*.
      3. List **Missing Skills** that are in the JD but missing from my profile.
      4. Suggest 3 specific **Resume Improvements** to get past the ATS for this job.
      5. List 3 **Interview Focus Areas** I should prepare for based on this JD.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4096 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.INTEGER },
            tailoredSummary: { type: Type.STRING },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            resumeImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
            interviewFocus: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["matchScore", "tailoredSummary", "missingSkills", "resumeImprovements", "interviewFocus"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No analysis generated");

    return JSON.parse(jsonText) as JobMatchAnalysis;

  } catch (error) {
    console.error("Error analyzing job match:", error);
    throw error;
  }
};

export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  context?: string
): Promise<string> => {
  try {
    let systemInstruction = "You are a helpful Career Coach for students. Answer questions about the generated resume, interview prep, or job search strategy.";
    
    if (context) {
      systemInstruction += `\n\nStudent's Career Kit Context:\n${context}`;
    }

    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: history,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

export const generateSpeechFromText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};