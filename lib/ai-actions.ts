import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResumeData } from "@/types/types";

const api = process.env.GEMINI_API_KEY;

if (!api) {
  throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.');
}

const genAI = new GoogleGenerativeAI(api);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function analyseResumeToJobDescription(userdata?: ResumeData, jobDescription?: string) {


  const prompt = `Analyze the following resume data and job description to provide a detailed analysis:

  Resume Data:
  ${JSON.stringify(userdata, null, 2)}

  Job Description:
  ${jobDescription}

  Please provide a comprehensive analysis that includes:
  - A brief description of the candidate's qualifications.
  - The percentage match between the resume and the job description.
  - Suggestions for improving the resume to better fit the job description.

  Please provide the analysis in JSON format with the following structure:{
  "jobDescription": string, // The job description provided
  "matchingPercentage": number, // Percentage match between the resume and job description
  "description": string, // Brief description of the candidate's qualifications
  "suggestions": string[], // List of suggestions for improving the resume
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    const text = await response.text();
    if (text) {
      const jsonResponse = text.split("`json")[1]?.split("`")[0];
      return JSON.parse(jsonResponse);
    } else {
      throw new Error("Response text does not contain valid JSON format");
    }
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw new Error("Failed to analyze resume");
  }

}

export async function GenerateResume(
  userdata?: ResumeData,
  data?: string,
  jobDescription?: string
) {
  const prompt = `You are an expert resume writer.

Using the information below, generate a professional and well-structured resume. Tailor the resume to align with the provided job description.

---

### Candidate Information:
${userdata ? `
**Name:** ${userdata.profile.fullname}  
**Email:** ${userdata.profile.email}  
**Phone:** ${userdata.profile.phone}  
**Links:** ${userdata.profile.links}

**Work Experience:**
${userdata.experiences.map((exp) => `
- **Position:** ${exp.title}  
  **Company:** ${exp.company}  
  **Duration:** ${exp.startDate} to ${exp.endDate ? exp.endDate : "current"}  
  **Current Role:** ${exp.current ? "Yes" : "No"}  
  **Responsibilities:**  
  ${exp.responsibilities?.map((r) => `  - ${r}`).join("\n")}
`).join("\n")}

**Education:**
${userdata.educations.map((edu) => `
- **Degree:** ${edu.degree}  
  **University:** ${edu.university}  
  **Location:** ${edu.location}  
  **Start Date:** ${edu.startDate}  
  **End Date:** ${edu.endDate}  
  **Currently Enrolled:** ${edu.current ? "Yes" : "No"}
`).join("\n")}

**Certifications:**
${userdata.certificates.map((cert) => `
- **Title:** ${cert.title}  
  **Issued By:** ${cert.issued_by}  
  **Year:** ${cert.year}
`).join("\n")}

**Skills:** ${userdata.skills.join(", ")}
` : `${data}`}

---

### Job Description:
${jobDescription || "No job description provided."}

---

### Output Requirements:

Return the resume in **valid JSON format** matching this structure:

\`\`\`json
{
  "profile": {
    "fullname": string,
    "email": string,
    "phone": string,
    "location": string,
    "links": [
      {
        "type": string, // e.g., "LinkedIn", "GitHub"
        "url": string
      }
    ],
    "summary": string // Career summary, max 80 words
  },
  "experiences": [
    {
      "title": string,
      "company": string,
      "location": string,
      "startDate": string, // Format: "Month-Year"
      "endDate": string, // "Month-Year" or "current"
      "current": boolean,
      "responsibilities": [string] // At least 5 detailed bullet points
    }
  ],
  "educations": [
    {
      "degree": string,
      "university": string,
      "location": string,
      "startDate": string, // "Month-Year"
      "endDate": string, // "Month-Year" or "current"
      "current": boolean
    }
  ],
  "skills": [
    {
      "type": string, // e.g., "Frontend", "Backend", "Tools"
      "skills": string[] // Grouped and relevant to the profile
    }
  ],
  "certificates": [
    {
      "title": string,
      "issued_by": string,
      "year": string
    }
  ]
}
\`\`\`

---

### Guidelines:

- Use the 'Month-Year' format for all dates (e.g., "Jan-2024").
- Break down **at least 10 relevant skills** into types based on the employment and other details (e.g., Frontend, Backend, Tools).
- Ensure each experience includes **at least 5 strong responsibility bullet points**.
- Write a brief, tailored **summary** (max 80 words) that captures the candidate’s expertise.
- Extract link types (e.g., "LinkedIn", "GitHub") from the URLs.
- Focus on aligning the resume with the provided job description.

---

Return **only** the JSON result with no extra explanations or formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    const text = await response.text();

    if (text) {
      const jsonResponse = text.split("```json")[1]?.split("```")[0];
      return JSON.parse(jsonResponse);
    } else {
      throw new Error("Response text does not contain valid JSON format");
    }
  } catch (error) {
    console.error("Error generating resume:", error);
    throw new Error("Failed to generate resume");
  }
}


export async function extractUrlData(url: string) {
  const prompt = `Extract the following data from the URL provided:
  
  URL: ${url}
  
  Please provide the extracted data in JSON format with the following structure:
  
  {
    "title": string, // The title of the page
    "description": string, // A brief description of the content
    "image": string, // URL of an image associated with the content
    "keywords": string[] // List of keywords related to the content
  }
  
  Ensure that the extracted data is accurate and relevant to the content of the page.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("Response:", response);

    const text = await response.text();
    if (text) {
      const jsonResponse = text.split("`json")[1]?.split("`")[0];
      return JSON.parse(jsonResponse);
    } else {
      throw new Error("Response text does not contain valid JSON format");
    }
  } catch (error) {
    console.error("Error extracting URL data:", error);
    throw new Error("Failed to extract URL data");
  }
}