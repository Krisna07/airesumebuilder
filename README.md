# AI-Powered Resume Builder

This is a full-stack, AI-powered resume builder built with Next.js, TypeScript, and Tailwind CSS. It leverages the Google Gemini API for intelligent resume generation and parsing, Supabase/Postgres with Prisma for the database, and Vercel for deployment.

The application provides a seamless, step-by-step interface for users to create, edit, and tailor their resumes for specific job applications.

**Live Demo:** [https://airesumebuilder-kota.vercel.app/](https://airesumebuilder-kota.vercel.app/)

## Features

- **Modern Tech Stack**: Next.js 14 (App Router), TypeScript, and Tailwind CSS.
- **AI-Powered Content**: Uses the Google Gemini API to:
    - Parse uploaded resumes from PDF files.
    - Generate tailored resume content based on user input and a target job description.
    - Analyze job descriptions to highlight key skills and keywords.
- **Step-by-Step UI**: A guided, multi-step form for inputting all necessary resume sections.
- **Client-Side PDF Parsing**: Securely parses resume files in the browser, avoiding unnecessary server uploads for text extraction.
- **Live Preview**: Instantly see changes to your resume as you type.
- **Job Description Scraping**: Fetches job descriptions from a URL to help tailor the resume.
- **Database Integration**: Uses Supabase (Postgres) with Prisma ORM for robust data management.
- **Scalable Backend**: Built with Vercel's serverless functions.
- **Component-Based Architecture**: Reusable React components for easy maintenance and extension.

## Architecture

The application is designed with a modern, decoupled architecture.

### Frontend

- **Framework**: Next.js 14 with the App Router.
- **Language**: TypeScript.
- **Styling**: Tailwind CSS for a utility-first styling approach.
- **State Management**: React Context API (`ResumeContext`) for managing resume data across the builder steps.
- **Key Components**:
    - `/app/builder/page.tsx`: The main page for the resume builder, orchestrating the steps and layout.
    - `/components/steps/*.tsx`: Individual components for each section of the resume (Personal Details, Work Experience, etc.).
    - `/components/ResumeUpload.tsx`: Handles client-side PDF file upload and parsing.
    - `/components/ResumePreview.tsx`: Renders a live preview of the resume.
    - `/components/JobDescriptionInput.tsx`: A text area for pasting or scraping a job description.
    - `/components/GenerateButton.tsx`: Triggers the AI generation process.

### Backend (Serverless Functions)

- **Location**: `/app/api/`
- **`/api/ai/generate-resume`**: The core AI endpoint. Takes the user's complete resume data and a job description, and uses the Gemini API to generate a tailored resume.
- **`/api/scrape-job`**: A simple API to fetch and parse the text content of a job description from a URL.
- **`/api/resume`**: Standard CRUD endpoints for saving, fetching, and managing user resumes in the database.

### AI Integration

- **Service**: Google Gemini API.
- **Core Logic**: Centralized in `/lib/ai-actions.ts`. This module contains functions for:
    - `GenerateResume`: The main function that constructs the prompt and calls the Gemini API to generate resume content.
    - `AnalyzeJobDescription`: (Future enhancement) A function to analyze a job description for keywords.
- **Prompt Engineering**: Prompts are carefully engineered to instruct the AI to act as a professional resume writer and return structured, high-quality content.

### Database

- **Provider**: Supabase (Postgres).
- **ORM**: Prisma for type-safe database access.
- **Schema**: Defined in `/prisma/schema.prisma`. Includes models for `User`, `Resume`, `PersonalDetail`, `WorkExperience`, `Education`, and `Project`.
- **Client**: The Prisma client is initialized in `/lib/prisma.ts`.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- A Supabase account for the database.
- A Google AI Studio API key for the Gemini API.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/airesumebuilder.git
    cd airesumebuilder
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add the following variables:

    ```env
    # Prisma / Supabase
    DATABASE_URL="postgresql://..."

    # Google Gemini API
    GEMINI_API_KEY="your-gemini-api-key"
    ```

    - Get your `DATABASE_URL` from your Supabase project settings.
    - Get your `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/).

4.  **Push the database schema:**

    This will sync your `prisma/schema.prisma` file with your Supabase database.

    ```bash
    npx prisma db push
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## How to Use

1.  **Upload (Optional)**: On the builder page, you can upload an existing PDF resume. The app will parse it and pre-fill the form fields.
2.  **Fill in the Details**: Go through each step, filling in your personal details, work experience, education, and other relevant information.
3.  **Add a Job Description**: Paste a job description or provide a URL to scrape it. This is crucial for tailoring your resume.
4.  **Generate**: Click the "Generate" button. The AI will use all the information you've provided to create a new, optimized resume.
5.  **Review and Save**: The generated resume will appear in the live preview. You can then save it to your account.
