import { Resume } from "@/types/Resume";
import { GoogleGenerativeAI } from "@google/generative-ai";


const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function analyseResumeToJobDescription(userdata?: Resume, jobDescription?: string) {


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

export async function GenerateResume(userdata?: Resume, data?: string, jobDescription?: string) {

    const prompt = `Create a professional resume using the following information and taylor to align wirth the job decription provided:

  ${userdata ? `
  Name: ${userdata.personal?.name}
  Email: ${userdata.personal?.email}
  Phone: ${userdata.personal?.phone}
  Location: ${userdata.personal?.location}
  LinkedIn: ${userdata.personal?.linkedin}
  GitHub: ${userdata.personal?.github}
  Portfolio: ${userdata.personal?.portfolio}
  
  Work Experience:
  ${userdata.work
                ?.map((exp) => `
    - Position: ${exp.role}
      Company: ${exp.company}
      Duration: ${exp.duration}
      Description: ${exp.description}
    `)
                .join("\n")}
  
  Education:
  ${userdata.education
                ?.map((edu) => `
    - Degree: ${edu.degree}
      Institution: ${edu.institution}
      Field of Study: ${edu.field}
      Duration: ${edu.duration}
    `)
                .join("\n")}
    
  Projects:
  ${userdata.projects?.map((proj) => `
    - Name: ${proj.name}
      Description: ${proj.description}
      Tech Stack: ${proj.techStack}
      Role: ${proj.role}
  `).join("\n")}

  Skills:
  ${userdata.skills ? `
  Technical: ${userdata.skills.technical?.join(", ")}
  Soft: ${userdata.skills.soft?.join(", ")}
  ` : ''}
  
  Certifications:
  ${userdata.certifications?.map((cert) => `
    - Name: ${cert.name}
      Issuer: ${cert.issuer}
      Date: ${cert.date}
  `).join("\n")}
  ` : `${data}`}
  
  Job Description:
  ${jobDescription ? jobDescription : "No job description provided."}
  
  Please create a professional resume using the details above and output it in JSON format. The JSON structure should match the following format:
  
  {
    "personal": {
      "name": string,
      "email": string,
      "phone": string,
      "location": string,
      "linkedin": string,
      "github": string,
      "portfolio": string
    },
    "work": [
      {
        "company": string,
        "role": string,
        "duration": string,
        "description": string
      }
    ],
    "education": [
      {
        "institution": string,
        "degree": string,
        "field": string,
        "duration": string
      }
    ],
    "projects": [
        {
            "name": string,
            "description": string,
            "techStack": string,
            "role": string
        }
    ],
    "skills": {
        "technical": [string],
        "soft": [string]
    },
    "certifications": [
        {
            "name": string,
            "issuer": string,
            "date": string
        }
    ]
  }
  
  Key Instructions:
  - Ensure that each work experience entry includes a detailed description.
  - The resume's date format should be consistent (e.g., Month Year - Month Year).
  - Generate relevant skills based on the user's profile.
  - Align the summary with the user's overall profile, summarizing their expertise and career focus in 80 words or less.
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
