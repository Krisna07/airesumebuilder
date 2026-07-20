/**
 * Example usage and test of the text-based resume extractor
 */

import { extractResumeFromText, cleanResumeText } from '@/services/textResumeExtractor';

// Example resume text
const sampleResumeText = `
JOHN SMITH
john.smith@email.com | (555) 123-4567 | New York, NY
LinkedIn: https://linkedin.com/in/johnsmith | GitHub: https://github.com/johnsmith

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 5+ years of experience developing scalable web applications.
Specialized in React, Node.js, and cloud technologies. Strong track record of delivering high-quality
solutions that improve user engagement and system performance.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, SQL, HTML, CSS
Frontend: React, Vue.js, Tailwind CSS, Material UI
Backend: Node.js, Express, Django, FastAPI
Databases: PostgreSQL, MongoDB, Redis
Tools: Git, Docker, AWS, Kubernetes, GitHub Actions
Cloud: AWS EC2, S3, Lambda, RDS

PROFESSIONAL EXPERIENCE

Senior Software Engineer – TechCorp Inc., New York, NY
January 2022 – Present
• Led development of microservices architecture handling 10M+ daily requests
• Reduced API response time by 40% through optimization and caching strategies
• Mentored 3 junior developers and conducted code reviews for team of 8
• Implemented CI/CD pipeline using GitHub Actions, reducing deployment time by 60%

Full Stack Developer – StartupXYZ, Remote
June 2020 – December 2021
• Designed and built customer dashboard used by 5,000+ active users
• Implemented real-time data synchronization using WebSockets
• Improved frontend performance by 35% through lazy loading and code splitting
• Collaborated with product team to deliver 2 major product releases quarterly

Junior Developer – WebAgency, Brooklyn, NY
March 2018 – May 2020
• Developed and maintained 15+ client websites using React and WordPress
• Fixed critical bugs and implemented new features for existing applications
• Participated in daily stand-ups and sprint planning with agile team

EDUCATION

Bachelor of Science in Computer Science
New York University, New York, NY
Graduated: May 2018
GPA: 3.8/4.0

CERTIFICATIONS
AWS Certified Solutions Architect – Associate
Google Cloud Associate Cloud Engineer

PROJECTS & ACHIEVEMENTS
• Open Source Contributor - React Query (100+ merged pull requests)
• Technical Speaker - "Scaling Node.js Applications" at JSConf 2023
• Blog Author - "Modern Web Development Practices" with 50K+ monthly readers
`;

// Test extraction
export async function testResumeExtraction() {
  try {
    // Clean the raw text
    const cleanedText = cleanResumeText(sampleResumeText);

    // Extract resume from text
    const extractedResume = extractResumeFromText(
      cleanedText,
      'user-123',
      'Extracted Resume - John Smith'
    );

    console.log('=== EXTRACTED RESUME ===\n');
    console.log('Profile:', extractedResume.profile);
    console.log('\nSkills:', extractedResume.skills);
    console.log('\nExperiences:', extractedResume.experiences);
    console.log('\nEducations:', extractedResume.educations);
    console.log('\nCustom Sections:', extractedResume.customSections);

    return extractedResume;
  } catch (error) {
    console.error('Extraction failed:', error);
    throw error;
  }
}

// Example of how it's used in the AI service as a fallback
export async function demonstrateFallback() {
  const AIService = require('@/services/aiServices').default;

  try {
    // This would try AI first, then fall back to text extraction if AI fails
    const resume = await AIService.generateResume(undefined, sampleResumeText);
    console.log('Generated resume:', resume);
  } catch (error) {
    console.error('Resume generation failed:', error);
  }
}
