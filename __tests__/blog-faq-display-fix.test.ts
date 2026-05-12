/**
 * Bug Condition Exploration Test for FAQ Display Fix
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 * 
 * This test encodes the EXPECTED behavior (FAQ sections as list type with proper structure).
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * When run on unfixed code, it will surface counterexamples showing:
 * - FAQ sections generated with type: 'paragraph' instead of type: 'list'
 * - All Q&A pairs concatenated into a single content string
 * - Lack of visual separation between Q&A pairs
 * 
 * After the fix is implemented, this same test will PASS, confirming the bug is resolved.
 */

import { describe, it, expect } from '@jest/globals'
import { generateSeoBlogPrompt } from '@/lib/prompts'
import type { BlogSection, HeadingSection, ParagraphSection, QuoteSection, ListSection, ImageSection } from '@/types/blog'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import BlogSectionRenderer from '@/components/blog/BlogSectionRenderer'

describe('Bug Condition Exploration: FAQ Display Fix', () => {
  describe('Property 1: Bug Condition - FAQ Sections Generated as Paragraph Type', () => {
    /**
     * This test verifies the EXPECTED behavior: FAQ sections should be generated
     * as list type with each Q&A pair as a separate item.
     * 
     * **EXPECTED OUTCOME ON UNFIXED CODE**: Test FAILS
     * - FAQ section will have type: 'paragraph' (bug condition)
     * - Content will be a single string with all Q&A pairs concatenated
     * 
     * **EXPECTED OUTCOME AFTER FIX**: Test PASSES
     * - FAQ section will have type: 'list' (expected behavior)
     * - Each Q&A pair will be a separate item in the items array
     */
    it('should generate FAQ sections as list type with separate Q&A items (EXPECTED TO FAIL on unfixed code)', () => {
      // Arrange: Get the blog generation prompt
      const title = 'Resume Writing Tips for Software Engineers'
      const author = 'ResumeCraft Team'
      const targetKeywords = ['resume', 'ATS', 'software engineer']
      
      const prompt = generateSeoBlogPrompt(title, author, targetKeywords)
      
      // Assert: Verify the prompt instructs AI to generate FAQ as list type
      // This assertion checks the EXPECTED behavior encoded in the prompt
      
      // The bug is that the current prompt says:
      // "11. **Paragraph** (200+ words) — Format as Q&A pairs: <strong>Q: [Question]</strong> A: [Answer]"
      // 
      // The expected behavior is:
      // "11. **List** (3-4 items) — Each item should be formatted as: <strong>Q: [Question]</strong><br>A: [Answer]"
      
      // Check if prompt contains the buggy instruction (paragraph type for FAQ)
      const hasBuggyInstruction = prompt.includes('**Paragraph**') && 
                                   prompt.includes('Format as Q&A pairs') &&
                                   prompt.includes('Frequently Asked Questions')
      
      // Check if prompt contains the expected instruction (list type for FAQ)
      const hasExpectedInstruction = prompt.includes('**List**') && 
                                      prompt.includes('Q&A') &&
                                      prompt.includes('Frequently Asked Questions')
      
      // EXPECTED BEHAVIOR: FAQ should be instructed as list type
      // On unfixed code, this will FAIL because the prompt uses paragraph type
      expect(hasBuggyInstruction).toBe(false) // Should NOT have buggy paragraph instruction
      expect(hasExpectedInstruction).toBe(true) // Should HAVE list instruction
      
      // Additional check: Verify the OUTPUT SCHEMA example shows FAQ as list
      const hasListSchemaExample = prompt.includes('"type": "list"') && 
                                    prompt.includes('"items":') &&
                                    prompt.includes('Q:')
      
      expect(hasListSchemaExample).toBe(true) // Schema should show FAQ as list type
    })

    /**
     * This test verifies that the STRICT CONSTRAINTS section includes
     * the requirement for FAQ sections to use list type.
     * 
     * **EXPECTED OUTCOME ON UNFIXED CODE**: Test FAILS
     * - No constraint about FAQ list type will be present
     * 
     * **EXPECTED OUTCOME AFTER FIX**: Test PASSES
     * - Constraint will specify FAQ sections must use list type
     */
    it('should include constraint requiring FAQ sections to use list type (EXPECTED TO FAIL on unfixed code)', () => {
      // Arrange
      const title = 'How to Optimize Your Resume for ATS'
      const prompt = generateSeoBlogPrompt(title)
      
      // Assert: Check for the expected constraint in STRICT CONSTRAINTS section
      const hasStrictConstraintsSection = prompt.includes('STRICT CONSTRAINTS')
      expect(hasStrictConstraintsSection).toBe(true)
      
      // The expected constraint should state:
      // "FAQ sections MUST use type 'list' with each Q&A pair as a separate item"
      const hasFaqListConstraint = prompt.includes('FAQ') && 
                                    prompt.includes('MUST use type') &&
                                    prompt.includes('list') &&
                                    prompt.includes('separate item')
      
      // On unfixed code, this will FAIL because no such constraint exists
      expect(hasFaqListConstraint).toBe(true)
    })

    /**
     * This test documents the specific counterexample from the bug description.
     * It verifies that the prompt does NOT instruct the AI to create the buggy format.
     * 
     * **EXPECTED OUTCOME ON UNFIXED CODE**: Test FAILS
     * - Prompt will contain instruction to format FAQ as paragraph with inline Q&A
     * 
     * **EXPECTED OUTCOME AFTER FIX**: Test PASSES
     * - Prompt will NOT contain the buggy paragraph instruction
     */
    it('should NOT instruct AI to format FAQ as paragraph with inline Q&A pairs (EXPECTED TO FAIL on unfixed code)', () => {
      // Arrange
      const title = 'Common Resume Mistakes to Avoid'
      const prompt = generateSeoBlogPrompt(title)
      
      // The buggy instruction pattern from the current code:
      // "**Paragraph** (200+ words) — Format as Q&A pairs: <strong>Q: [Question]</strong> A: [Answer]"
      
      // Check for the specific buggy pattern
      const buggyPattern1 = prompt.includes('**Paragraph**') && 
                            prompt.includes('Format as Q&A pairs')
      
      const buggyPattern2 = prompt.includes('Paragraph') && 
                            prompt.includes('<strong>Q: [Question]</strong> A: [Answer]')
      
      // On unfixed code, these will be true (indicating the bug exists)
      // After fix, these should be false
      expect(buggyPattern1).toBe(false)
      expect(buggyPattern2).toBe(false)
      
      // The prompt should instead instruct list format
      const hasListInstruction = prompt.includes('**List**') && 
                                  prompt.includes('Q:') &&
                                  prompt.includes('<br>')
      
      expect(hasListInstruction).toBe(true)
    })
  })

  describe('Documentation of Expected Counterexamples', () => {
    /**
     * This test documents what counterexamples we expect to see when the test fails
     * on unfixed code. This helps understand the root cause.
     */
    it('documents the expected bug manifestation in generated blog sections', () => {
      // This is a documentation test that describes what we expect to see
      // when a blog is actually generated with the buggy prompt.
      
      // Expected counterexample structure (what the bug produces):
      const buggyFaqSection = {
        id: 'sec_11',
        type: 'paragraph' as const, // BUG: Should be 'list'
        content: '<strong>Q: How long should my resume be?</strong> A: Your resume should be 1-2 pages... <strong>Q: Should I include a photo?</strong> A: In most cases, no...' // BUG: All Q&A in single string
      }
      
      // Expected correct structure (what the fix should produce):
      const expectedFaqSection = {
        id: 'sec_11',
        type: 'list' as const, // CORRECT: List type
        items: [ // CORRECT: Separate items
          '<strong>Q: How long should my resume be?</strong><br>A: Your resume should be 1-2 pages...',
          '<strong>Q: Should I include a photo?</strong><br>A: In most cases, no...',
          '<strong>Q: What file format is best?</strong><br>A: PDF is generally preferred...'
        ]
      }
      
      // Verify the structures are different (documenting the bug vs expected behavior)
      expect(buggyFaqSection.type).not.toBe(expectedFaqSection.type)
      expect('content' in buggyFaqSection).toBe(true)
      expect('items' in expectedFaqSection).toBe(true)
      
      // This test always passes - it's just documentation of the bug condition
      expect(true).toBe(true)
    })
  })
})


/**
 * Preservation Property Tests for FAQ Display Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 * 
 * These tests verify that non-FAQ sections continue to render correctly
 * after the fix is implemented. They establish the baseline behavior
 * that must be preserved.
 * 
 * **IMPORTANT**: These tests should PASS on UNFIXED code.
 * They document the current correct behavior for non-FAQ sections.
 */

describe('Property 2: Preservation - Non-FAQ Section Rendering Unchanged', () => {
  describe('Heading Section Preservation', () => {
    /**
     * **Validates: Requirement 3.1**
     * Heading sections (h2, h3, h4) must continue to render with proper styling
     */
    it('should render h2 heading sections with correct tag and styling', () => {
      // Arrange
      const headingSection: HeadingSection = {
        id: 'sec_1',
        type: 'heading',
        level: 2,
        content: 'Introduction to Resume Writing'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: headingSection })
      )

      // Assert: Verify h2 tag is present
      expect(rendered).toContain('<h2')
      expect(rendered).toContain('Introduction to Resume Writing')
      expect(rendered).toContain('</h2>')
      
      // Verify styling classes are present
      expect(rendered).toContain('font-semibold')
      expect(rendered).toContain('text-slate-900')
      expect(rendered).toContain('dark:text-slate-100')
    })

    it('should render h3 heading sections with correct tag and styling', () => {
      // Arrange
      const headingSection: HeadingSection = {
        id: 'sec_2',
        type: 'heading',
        level: 3,
        content: 'Key Skills to Highlight'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: headingSection })
      )

      // Assert
      expect(rendered).toContain('<h3')
      expect(rendered).toContain('Key Skills to Highlight')
      expect(rendered).toContain('</h3>')
      expect(rendered).toContain('font-semibold')
    })

    it('should render h4 heading sections with correct tag and styling', () => {
      // Arrange
      const headingSection: HeadingSection = {
        id: 'sec_3',
        type: 'heading',
        level: 4,
        content: 'Technical Skills'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: headingSection })
      )

      // Assert
      expect(rendered).toContain('<h4')
      expect(rendered).toContain('Technical Skills')
      expect(rendered).toContain('</h4>')
    })
  })

  describe('Paragraph Section Preservation', () => {
    /**
     * **Validates: Requirement 3.2**
     * Standard paragraph sections (non-FAQ) must continue to render as text blocks with HTML support
     */
    it('should render standard paragraph sections with HTML support', () => {
      // Arrange
      const paragraphSection: ParagraphSection = {
        id: 'sec_4',
        type: 'paragraph',
        content: 'A well-crafted resume is <strong>essential</strong> for landing your dream job. It should highlight your <em>key achievements</em> and demonstrate your value to potential employers.'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: paragraphSection })
      )

      // Assert: Verify div wrapper and content
      expect(rendered).toContain('<div')
      expect(rendered).toContain('</div>')
      
      // Verify HTML content is preserved
      expect(rendered).toContain('<strong>essential</strong>')
      expect(rendered).toContain('<em>key achievements</em>')
      
      // Verify styling classes
      expect(rendered).toContain('text-slate-700')
      expect(rendered).toContain('dark:text-slate-300')
      expect(rendered).toContain('leading-7')
    })

    it('should render paragraph sections with links and inline formatting', () => {
      // Arrange
      const paragraphSection: ParagraphSection = {
        id: 'sec_5',
        type: 'paragraph',
        content: 'Visit our <a href="/guide">comprehensive guide</a> for more tips on <strong>ATS optimization</strong> and <em>keyword placement</em>.'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: paragraphSection })
      )

      // Assert: Verify HTML is preserved
      expect(rendered).toContain('<a href="/guide">comprehensive guide</a>')
      expect(rendered).toContain('<strong>ATS optimization</strong>')
      expect(rendered).toContain('<em>keyword placement</em>')
    })

    it('should render long paragraph sections without truncation', () => {
      // Arrange
      const longContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10)
      const paragraphSection: ParagraphSection = {
        id: 'sec_6',
        type: 'paragraph',
        content: longContent
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: paragraphSection })
      )

      // Assert: Verify full content is rendered
      expect(rendered).toContain(longContent)
      expect(rendered.length).toBeGreaterThan(500)
    })
  })

  describe('Quote Section Preservation', () => {
    /**
     * **Validates: Requirement 3.4**
     * Quote sections must continue to render as styled blockquotes with citations
     */
    it('should render quote sections with blockquote styling', () => {
      // Arrange
      const quoteSection: QuoteSection = {
        id: 'sec_7',
        type: 'quote',
        content: 'Your resume is your personal marketing document. Make every word count.',
        citation: 'Career Expert, Jane Smith'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: quoteSection })
      )

      // Assert: Verify blockquote tag
      expect(rendered).toContain('<blockquote')
      expect(rendered).toContain('</blockquote>')
      
      // Verify quote content
      expect(rendered).toContain('Your resume is your personal marketing document')
      
      // Verify citation
      expect(rendered).toContain('<footer')
      expect(rendered).toContain('Career Expert, Jane Smith')
      expect(rendered).toContain('</footer>')
      
      // Verify styling classes
      expect(rendered).toContain('border-l-4')
      expect(rendered).toContain('border-teal-500/70')
      expect(rendered).toContain('italic')
    })

    it('should render quote sections without citation when not provided', () => {
      // Arrange
      const quoteSection: QuoteSection = {
        id: 'sec_8',
        type: 'quote',
        content: 'Quality over quantity - focus on achievements, not duties.'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: quoteSection })
      )

      // Assert: Verify blockquote is present
      expect(rendered).toContain('<blockquote')
      expect(rendered).toContain('Quality over quantity')
      
      // Verify no footer/citation is rendered
      expect(rendered).not.toContain('<footer')
    })

    it('should preserve whitespace in quote content', () => {
      // Arrange
      const quoteSection: QuoteSection = {
        id: 'sec_9',
        type: 'quote',
        content: 'First line of wisdom.\nSecond line of wisdom.\nThird line of wisdom.'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: quoteSection })
      )

      // Assert: Verify whitespace-pre-wrap class is present
      expect(rendered).toContain('whitespace-pre-wrap')
      expect(rendered).toContain('First line of wisdom')
    })
  })

  describe('Non-FAQ List Section Preservation', () => {
    /**
     * **Validates: Requirement 3.3**
     * Non-FAQ list sections must continue to render with bullet points and proper spacing
     */
    it('should render standard list sections with bullet points', () => {
      // Arrange
      const listSection: ListSection = {
        id: 'sec_10',
        type: 'list',
        items: [
          'Use action verbs to describe your accomplishments',
          'Quantify your achievements with specific metrics',
          'Tailor your resume to each job application',
          'Keep formatting clean and consistent'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: listSection })
      )

      // Assert: Verify ul tag
      expect(rendered).toContain('<ul')
      expect(rendered).toContain('</ul>')
      
      // Verify list items
      expect(rendered).toContain('<li')
      expect(rendered).toContain('Use action verbs')
      expect(rendered).toContain('Quantify your achievements')
      expect(rendered).toContain('Tailor your resume')
      expect(rendered).toContain('Keep formatting clean')
      
      // Verify bullet point styling
      expect(rendered).toContain('list-disc')
      expect(rendered).toContain('ml-6')
      expect(rendered).toContain('space-y-2')
    })

    it('should render list items with HTML formatting', () => {
      // Arrange
      const listSection: ListSection = {
        id: 'sec_11',
        type: 'list',
        items: [
          '<strong>Technical Skills:</strong> List programming languages and tools',
          '<strong>Soft Skills:</strong> Highlight communication and leadership',
          '<strong>Certifications:</strong> Include relevant professional certifications'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: listSection })
      )

      // Assert: Verify HTML is preserved in list items
      expect(rendered).toContain('<strong>Technical Skills:</strong>')
      expect(rendered).toContain('<strong>Soft Skills:</strong>')
      expect(rendered).toContain('<strong>Certifications:</strong>')
    })

    it('should render single-item lists correctly', () => {
      // Arrange
      const listSection: ListSection = {
        id: 'sec_12',
        type: 'list',
        items: [
          'The most important tip: Always proofread your resume multiple times'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: listSection })
      )

      // Assert
      expect(rendered).toContain('<ul')
      expect(rendered).toContain('<li')
      expect(rendered).toContain('Always proofread your resume')
      expect(rendered).toContain('list-disc')
    })

    it('should render lists with many items without truncation', () => {
      // Arrange
      const listSection: ListSection = {
        id: 'sec_13',
        type: 'list',
        items: Array.from({ length: 10 }, (_, i) => `Tip number ${i + 1} for resume success`)
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: listSection })
      )

      // Assert: Verify all items are rendered
      expect(rendered).toContain('Tip number 1')
      expect(rendered).toContain('Tip number 5')
      expect(rendered).toContain('Tip number 10')
      
      // Count li tags (should be 10)
      const liCount = (rendered.match(/<li/g) || []).length
      expect(liCount).toBe(10)
    })
  })

  describe('Image Section Preservation', () => {
    /**
     * **Validates: Requirement 3.5**
     * Image sections must continue to render as figures with captions
     */
    it('should render image sections with figure and caption', () => {
      // Arrange
      const imageSection: ImageSection = {
        id: 'sec_14',
        type: 'image',
        imageId: 'img_123',
        alt: 'Example of a well-formatted resume',
        caption: 'A professional resume template with clear sections and consistent formatting'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: imageSection })
      )

      // Assert: Verify figure tag
      expect(rendered).toContain('<figure')
      expect(rendered).toContain('</figure>')
      
      // Verify img tag and attributes
      expect(rendered).toContain('<img')
      expect(rendered).toContain('src="/api/blog-images/img_123"')
      expect(rendered).toContain('alt="Example of a well-formatted resume"')
      
      // Verify caption
      expect(rendered).toContain('<figcaption')
      expect(rendered).toContain('A professional resume template')
      expect(rendered).toContain('</figcaption>')
      
      // Verify styling
      expect(rendered).toContain('rounded-xl')
      expect(rendered).toContain('border')
    })

    it('should render image sections without caption when not provided', () => {
      // Arrange
      const imageSection: ImageSection = {
        id: 'sec_15',
        type: 'image',
        imageId: 'img_456',
        alt: 'Resume example'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: imageSection })
      )

      // Assert: Verify figure and img are present
      expect(rendered).toContain('<figure')
      expect(rendered).toContain('<img')
      expect(rendered).toContain('src="/api/blog-images/img_456"')
      
      // Verify no figcaption is rendered
      expect(rendered).not.toContain('<figcaption')
    })

    it('should render image sections with default alt text when not provided', () => {
      // Arrange
      const imageSection: ImageSection = {
        id: 'sec_16',
        type: 'image',
        imageId: 'img_789'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: imageSection })
      )

      // Assert: Verify default alt text
      expect(rendered).toContain('alt="Blog image"')
    })
  })

  describe('Mixed Content Preservation', () => {
    /**
     * **Validates: Requirement 3.6**
     * Multiple section types should render correctly together
     */
    it('should render multiple different section types correctly', () => {
      // Arrange: Create a mix of section types
      const sections: BlogSection[] = [
        {
          id: 'sec_1',
          type: 'heading',
          level: 2,
          content: 'Resume Writing Best Practices'
        },
        {
          id: 'sec_2',
          type: 'paragraph',
          content: 'Creating a strong resume requires attention to detail and strategic thinking.'
        },
        {
          id: 'sec_3',
          type: 'list',
          items: [
            'Use clear section headings',
            'Highlight key achievements',
            'Keep it concise'
          ]
        },
        {
          id: 'sec_4',
          type: 'quote',
          content: 'Your resume should tell a story of your professional journey.',
          citation: 'HR Professional'
        }
      ]

      // Act: Render each section
      const renderedSections = sections.map(section =>
        renderToStaticMarkup(React.createElement(BlogSectionRenderer, { section }))
      )

      // Assert: Verify each section type is rendered correctly
      expect(renderedSections[0]).toContain('<h2')
      expect(renderedSections[0]).toContain('Resume Writing Best Practices')
      
      expect(renderedSections[1]).toContain('<div')
      expect(renderedSections[1]).toContain('Creating a strong resume')
      
      expect(renderedSections[2]).toContain('<ul')
      expect(renderedSections[2]).toContain('list-disc')
      expect(renderedSections[2]).toContain('Use clear section headings')
      
      expect(renderedSections[3]).toContain('<blockquote')
      expect(renderedSections[3]).toContain('Your resume should tell a story')
    })
  })

  describe('Edge Cases and Robustness', () => {
    /**
     * **Validates: Requirement 3.7**
     * Edge cases should be handled gracefully
     */
    it('should handle empty paragraph content gracefully', () => {
      // Arrange
      const paragraphSection: ParagraphSection = {
        id: 'sec_17',
        type: 'paragraph',
        content: ''
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: paragraphSection })
      )

      // Assert: Should render div even with empty content
      expect(rendered).toContain('<div')
      expect(rendered).toContain('</div>')
    })

    it('should handle empty list items array gracefully', () => {
      // Arrange
      const listSection: ListSection = {
        id: 'sec_18',
        type: 'list',
        items: []
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: listSection })
      )

      // Assert: Should render ul even with no items
      expect(rendered).toContain('<ul')
      expect(rendered).toContain('</ul>')
    })

    it('should handle special characters in content', () => {
      // Arrange
      const paragraphSection: ParagraphSection = {
        id: 'sec_19',
        type: 'paragraph',
        content: 'Use symbols like &amp;, &lt;, &gt;, and &quot; correctly in your resume.'
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: paragraphSection })
      )

      // Assert: Verify HTML entities are preserved
      expect(rendered).toContain('&amp;')
      expect(rendered).toContain('&lt;')
      expect(rendered).toContain('&gt;')
    })

    it('should handle very long heading content', () => {
      // Arrange
      const longHeading = 'This is a very long heading that might wrap to multiple lines in the rendered output but should still maintain proper styling and structure'
      const headingSection: HeadingSection = {
        id: 'sec_20',
        type: 'heading',
        level: 2,
        content: longHeading
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: headingSection })
      )

      // Assert
      expect(rendered).toContain(longHeading)
      expect(rendered).toContain('<h2')
      expect(rendered).toContain('font-semibold')
    })
  })
})
