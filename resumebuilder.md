# Resume Builder (Next.js Application)

Resume Builder is a Next.js application that empowers users to build professional resumes using AI. Leveraging the Gemini Free Context API, Supabase (Postgres) with Prisma ORM, Vercel serverless functions, and a web scraping utility, the app streamlines the resume creation process and tailors content to job requirements.

## Features

- **AI-Powered Resume Generation**: Uses Gemini API to generate and enhance resumes.
- **Resume Upload & Parsing**: Users can upload existing resumes (PDF/DOCX). The app reads and extracts data using JavaScript, then formats and feeds it to the AI.
- **Job Description Scraping**: Web scraping utility fetches job details from listings to tailor resumes.
- **Step-by-Step Resume Builder**: Guided input for personal details, work experience, education, projects, and more.
- **Custom AI Models**: Specialized AI actions for extracting, formatting, and generating resumes.
- **Supabase + Prisma + Postgres**: Secure, scalable database for storing user and resume data.
- **Vercel Serverless Functions**: Efficient backend logic and AI actions.

## Architecture Overview

- **Frontend**: Next.js (React) with a step-based form process.
    - **Project Structure**:
        - `/app/builder`: Main route for the resume building flow.
        - `/components/steps`: Individual forms for each section (Personal, Work, etc.).
        - `/components/ResumeUpload.tsx`: Handles file upload and calls the extraction API.
        - `/components/ResumePreview.tsx`: Displays a live preview of the resume.
        - `/components/JobDescriptionInput.tsx`: Text area for the target job description.
        - `/components/GenerateButton.tsx`: Triggers the AI generation process.
    - **State Management**: React Context (`ResumeContext`) to manage resume data across all steps.
    - **Data Flow**:
        1. **Upload (Optional)**: User uploads a resume. `ResumeUpload` sends it to an API (`/api/ai/extract-resume`) which uses Gemini to parse the data and returns a JSON object.
        2. **Prefill**: The returned JSON populates the `ResumeContext`, pre-filling the form fields.
        3. **Step-by-Step Forms**: User moves through each form, editing or adding data. Changes are saved to the context in real-time.
        4. **Live Preview**: `ResumePreview` listens to context changes and shows the resume being built.
        5. **Generate**: On the final step, the user provides a job description and clicks the `GenerateButton`.
        6. **API Call**: All data (user's resume info + job description) is sent to `/api/ai/generate-resume`.
        7. **Display**: The AI-generated resume is returned and displayed in the `ResumePreview`. A "Regenerate" button allows for new attempts.
- **Backend**: Vercel serverless functions located in `/app/api`.
    - **`/api/ai/extract-resume`**: Handles resume file uploads (`POST`), extracts text using `pdf-parse`, and uses Gemini to convert it to structured JSON.
    - **`/api/ai/generate-resume`**: Takes the user's resume data and a job description (`POST`), prompts Gemini to write a tailored resume, and returns the generated text.
    - **`/api/scrape-job`**: Accepts a URL (`POST`), fetches the page content with `axios`, parses it with `cheerio` to find the job description, and returns the text.
- **Database**: Supabase (Postgres) with Prisma ORM.
    - **Schema**: Defined in `prisma/schema.prisma` with models for `User`, `Resume`, etc.
    - **Connection**: Managed by the Prisma client in `lib/prisma.ts`.
    - **API Routes**: Standard CRUD operations for resumes (`POST`, `GET`, `PUT`, `DELETE` in `/api/resume`).
- **AI Integration**: Gemini Free Context API.
    - **API Key**: Stored as a secure environment variable (`GEMINI_API_KEY`).
    - **Prompt Engineering**:
        - **Extraction Prompt**: Instructs the AI to act as a resume parser and return a specific JSON structure.
        - **Generation Prompt**: Instructs the AI to act as a professional resume writer, using the user's data and a job description to create a tailored result.
- **Web Scraping**: Utility using `axios` and `cheerio` to fetch and parse job descriptions from URLs.

## AI Actions

1. **Extract & Format Resume**
   - Reads uploaded resume files.
   - Extracts structured data (personal, work, education, projects, etc).
   - Formats data for AI processing.
2. **Generate Resume**
   - Uses extracted/formatted data and job description.
   - Generates a tailored resume using the AI model.

## Resume Input Steps & Models

1. **Personal Details**
   - Name
   - Contact Information
   - LinkedIn/GitHub/Portfolio
2. **Work Experience**
   - Company Name
   - Role/Title
   - Duration
   - Responsibilities & Achievements
3. **Education**
   - Institution
   - Degree
   - Field of Study
   - Duration
4. **Projects**
   - Project Name
   - Description
   - Technologies Used
   - Role/Contributions
5. **Skills & Certifications**
   - List of skills
   - Certifications (if any)
6. **Additional Sections** (optional)
   - Awards
   - Languages
   - Volunteer Experience

## Example Data Models (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  resumes   Resume[]
}

model Resume {
  id             String         @id @default(uuid())
  userId         String
  personal       PersonalDetail
  work           WorkExperience[]
  education      Education[]
  projects       Project[]
  skills         String[]
  certifications String[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  user           User           @relation(fields: [userId], references: [id])
}

model PersonalDetail {
  id        String @id @default(uuid())
  name      String
  contact   String
  linkedin  String?
  github    String?
  portfolio String?
}

model WorkExperience {
  id          String @id @default(uuid())
  company     String
  role        String
  duration    String
  description String
}

model Education {
  id         String @id @default(uuid())
  institution String
  degree      String
  field       String
  duration    String
}

model Project {
  id          String @id @default(uuid())
  name        String
  description String
  techStack   String[]
  role        String
}
```

## Getting Started

1. **Clone the repository**
2. **Install dependencies**
3. **Set up Supabase and Prisma**
4. **Configure Gemini API credentials**
5. **Deploy on Vercel**

---

This project aims to make resume building seamless, intelligent, and tailored to each user's career goals.
