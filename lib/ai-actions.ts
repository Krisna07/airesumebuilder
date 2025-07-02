import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResumeData } from "@/types/types";

const api = `${process.env.GEMINI_API_KEY}`;

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

export async function GenerateResume(userdata?: ResumeData, data?: string, jobDescription?: string) {

  const prompt = `Create a professional resume using the following information and taylor to align wirth the job decription provided:

  ${userdata ? `
  Name: ${userdata.profile.fullname}
  Email: ${userdata.profile.email}
  Phone: ${userdata.profile.phone}
  Links: ${userdata.profile.links}
  
  Work Experience:
  ${userdata.experience
        .map((exp) => `
    - Position: ${exp.title}
      Company: ${exp.company}
      Duration: ${exp.startDate} to ${exp.endDate ? exp.endDate : "current"}
      Current: ${exp.current}
      Description: 
        ${exp.responsibilities?.join("\n")}
    `)
        .join("\n")}
  
  Education:
  ${userdata.education
        .map((edu) => `
    - Degree: ${edu.degree}
      Location: ${edu.location}
      University: ${edu.university}
      Start Date: ${edu.startDate}
      End Date: ${edu.endDate}
      Current: ${edu.current ? "Yes" : "No"}
    `)
        .join("\n")}
  
  Certifications:
  ${userdata.certificates.map((cert) => `
    - Title: ${cert.title}
      Issued By: ${cert.issued_by}
      Year: ${cert.year}
  `).join("\n")}
  
  Skills:
  ${userdata.skills.join(", ")}
  ` : `${data}`}
  
  Job Description:
  ${jobDescription ? jobDescription : "No job description provided."}
  
  Please create a professional resume using the details above and output it in JSON format. The JSON structure should match the following format:
  
  {
    "profile": {
      "fullname": string,
      "email": string,
      "phone": string,
      "location": string,
      "links": [{ 
        "type": string,  // e.g., 'LinkedIn', 'GitHub', etc.
        "url": string
      }],
      "summary": string  // Provide a brief summary (max 50 words) aligning with the user's profile
    },
    "experience": [
      {
        "title": string,
        "company": string,
        "location": string,
        "startDate": string,  // Use 'Month-Year' format (e.g., Jan 2024)
        "endDate": string,  // Use 'Month-Year' format (e.g., Dec 2024) or "current"
        "current": boolean,  // true/false based on whether it's the current job
        "responsibilities": [string]  // List at least 5 key points of responsibilities
      }
    ],
    "education": [
      {
        "degree": string,
        "university": string,
        "location": string,
        "startDate": string,  // Use 'Month-Year' format
        "endDate": string,  // Use 'Month-Year' format or "current"
        "current": boolean  // true/false based on whether it's the current education
      }
    ],
    "skills": [
      {
        "type": string,  // e.g., 'Frontend', 'Backend', 'Tools', etc.
        "skills": string[]  // List of skills relevant to the user, based on the profile, experience, and provided skills
      }
    ],
    "certificates": [
      {
        "title": string,
        "issued_by": string,
        "year": string  // Year the certificate was issued
      }
    ]
  }
  
  Key Instructions:
  - Ensure that each work experience entry includes a description with at least 5 bullet points.
  - The resume's date format should be 'Month-Year' (e.g., Jan 2024).
  - Generate at least 10 relevant skills based on the user's profile, work experience, and education -> make sure to breakdown the types of skills, focus more on user input 
  - Align the summary with the user's overall profile, summarizing their expertise and career focus in 80 words or less.
  - For links, identify the type (e.g., 'LinkedIn', 'GitHub', etc.) and provide the respective URLs.
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