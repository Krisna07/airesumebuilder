/**
 * Unit tests for BlogSectionRenderer FAQ detection and styling
 * 
 * **Validates: Requirements 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 3.3**
 * 
 * These tests verify that:
 * 1. FAQ lists are detected correctly based on '<strong>Q:' pattern
 * 2. FAQ lists render with special styling (no bullets, increased spacing, border)
 * 3. Non-FAQ lists continue to render with standard bullet styling
 */

import { describe, it, expect } from '@jest/globals'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import BlogSectionRenderer from '@/components/blog/BlogSectionRenderer'
import type { ListSection } from '@/types/blog'

describe('BlogSectionRenderer FAQ Detection and Styling', () => {
  describe('FAQ List Detection', () => {
    it('should detect FAQ list when items start with <strong>Q:', () => {
      // Arrange: FAQ list with Q: pattern at start
      const faqSection: ListSection = {
        id: 'faq_1',
        type: 'list',
        items: [
          '<strong>Q: How long should my resume be?</strong><br>A: Your resume should be 1-2 pages.',
          '<strong>Q: Should I include a photo?</strong><br>A: In most cases, no.',
          '<strong>Q: What file format is best?</strong><br>A: PDF is generally preferred.'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: faqSection })
      )

      // Assert: Should have FAQ styling (no bullets, increased spacing, border)
      expect(rendered).toContain('list-none')
      expect(rendered).toContain('space-y-6')
      expect(rendered).toContain('border-l-2')
      expect(rendered).toContain('border-teal-500/30')
      
      // Should NOT have standard list styling
      expect(rendered).not.toContain('list-disc')
      expect(rendered).not.toContain('ml-6')
    })

    it('should detect FAQ list when items contain <strong>Q: in the middle', () => {
      // Arrange: FAQ list with Q: pattern not at start
      const faqSection: ListSection = {
        id: 'faq_2',
        type: 'list',
        items: [
          'Common question: <strong>Q: What is ATS?</strong><br>A: ATS stands for Applicant Tracking System.',
          'Another question: <strong>Q: How do I optimize for ATS?</strong><br>A: Use relevant keywords.'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: faqSection })
      )

      // Assert: Should have FAQ styling
      expect(rendered).toContain('list-none')
      expect(rendered).toContain('space-y-6')
      expect(rendered).toContain('border-l-2')
    })

    it('should NOT detect FAQ list when items do not contain Q: pattern', () => {
      // Arrange: Standard list without Q: pattern
      const standardList: ListSection = {
        id: 'list_1',
        type: 'list',
        items: [
          'Use action verbs to describe accomplishments',
          'Quantify achievements with metrics',
          'Tailor resume to each job application'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: standardList })
      )

      // Assert: Should have standard list styling
      expect(rendered).toContain('list-disc')
      expect(rendered).toContain('ml-6')
      expect(rendered).toContain('space-y-2')
      
      // Should NOT have FAQ styling
      expect(rendered).not.toContain('list-none')
      expect(rendered).not.toContain('space-y-6')
      expect(rendered).not.toContain('border-l-2')
    })
  })

  describe('FAQ List Rendering', () => {
    it('should render FAQ list with proper visual hierarchy', () => {
      // Arrange
      const faqSection: ListSection = {
        id: 'faq_3',
        type: 'list',
        items: [
          '<strong>Q: How long should my resume be?</strong><br>A: Your resume should be 1-2 pages for most positions.',
          '<strong>Q: Should I include references?</strong><br>A: References are typically provided upon request, not on the resume itself.'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: faqSection })
      )

      // Assert: Verify FAQ content is preserved
      expect(rendered).toContain('How long should my resume be?')
      expect(rendered).toContain('Your resume should be 1-2 pages')
      expect(rendered).toContain('Should I include references?')
      expect(rendered).toContain('References are typically provided upon request')
      
      // Verify styling classes
      expect(rendered).toContain('list-none')
      expect(rendered).toContain('ml-0')
      expect(rendered).toContain('mb-6')
      expect(rendered).toContain('space-y-6')
      expect(rendered).toContain('text-slate-700')
      expect(rendered).toContain('dark:text-slate-300')
      
      // Verify list item styling
      expect(rendered).toContain('pl-4')
      expect(rendered).toContain('border-l-2')
      expect(rendered).toContain('border-teal-500/30')
      expect(rendered).toContain('py-2')
    })

    it('should render single FAQ item correctly', () => {
      // Arrange
      const faqSection: ListSection = {
        id: 'faq_4',
        type: 'list',
        items: [
          '<strong>Q: What is the best resume format?</strong><br>A: The reverse-chronological format is most commonly preferred by employers.'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: faqSection })
      )

      // Assert: Should still have FAQ styling even with single item
      expect(rendered).toContain('list-none')
      expect(rendered).toContain('space-y-6')
      expect(rendered).toContain('border-l-2')
      expect(rendered).toContain('What is the best resume format?')
    })

    it('should render multiple FAQ items with consistent spacing', () => {
      // Arrange
      const faqSection: ListSection = {
        id: 'faq_5',
        type: 'list',
        items: [
          '<strong>Q: Question 1?</strong><br>A: Answer 1',
          '<strong>Q: Question 2?</strong><br>A: Answer 2',
          '<strong>Q: Question 3?</strong><br>A: Answer 3',
          '<strong>Q: Question 4?</strong><br>A: Answer 4'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: faqSection })
      )

      // Assert: Verify all items are rendered
      const liCount = (rendered.match(/<li/g) || []).length
      expect(liCount).toBe(4)
      
      // Verify spacing class is applied
      expect(rendered).toContain('space-y-6')
    })
  })

  describe('Non-FAQ List Rendering (Preservation)', () => {
    it('should render standard list with bullets and normal spacing', () => {
      // Arrange
      const standardList: ListSection = {
        id: 'list_2',
        type: 'list',
        items: [
          'First tip for resume writing',
          'Second tip for resume writing',
          'Third tip for resume writing'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: standardList })
      )

      // Assert: Verify standard list styling
      expect(rendered).toContain('list-disc')
      expect(rendered).toContain('ml-6')
      expect(rendered).toContain('mb-4')
      expect(rendered).toContain('space-y-2')
      expect(rendered).toContain('text-slate-700')
      expect(rendered).toContain('dark:text-slate-300')
      
      // Verify content is preserved
      expect(rendered).toContain('First tip')
      expect(rendered).toContain('Second tip')
      expect(rendered).toContain('Third tip')
    })

    it('should render list with <strong> tags but no Q: pattern as standard list', () => {
      // Arrange: List with bold text but not FAQ format
      const standardList: ListSection = {
        id: 'list_3',
        type: 'list',
        items: [
          '<strong>Technical Skills:</strong> List programming languages',
          '<strong>Soft Skills:</strong> Highlight communication abilities',
          '<strong>Certifications:</strong> Include relevant credentials'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: standardList })
      )

      // Assert: Should have standard list styling (not FAQ)
      expect(rendered).toContain('list-disc')
      expect(rendered).toContain('ml-6')
      expect(rendered).toContain('space-y-2')
      
      // Should NOT have FAQ styling
      expect(rendered).not.toContain('list-none')
      expect(rendered).not.toContain('space-y-6')
      expect(rendered).not.toContain('border-l-2')
      
      // Content should be preserved
      expect(rendered).toContain('<strong>Technical Skills:</strong>')
      expect(rendered).toContain('<strong>Soft Skills:</strong>')
    })
  })

  describe('Edge Cases', () => {
    it('should handle FAQ list with empty items array', () => {
      // Arrange
      const emptyFaqSection: ListSection = {
        id: 'faq_6',
        type: 'list',
        items: []
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: emptyFaqSection })
      )

      // Assert: Should render ul tag even with no items
      expect(rendered).toContain('<ul')
      expect(rendered).toContain('</ul>')
    })

    it('should handle FAQ with malformed HTML gracefully', () => {
      // Arrange
      const malformedFaqSection: ListSection = {
        id: 'faq_7',
        type: 'list',
        items: [
          '<strong>Q: What if HTML is malformed?<br>A: It should still render',
          '<strong>Q: Another question?</strong><br>A: Another answer'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: malformedFaqSection })
      )

      // Assert: Should detect as FAQ and render with FAQ styling
      expect(rendered).toContain('list-none')
      expect(rendered).toContain('space-y-6')
      expect(rendered).toContain('border-l-2')
    })

    it('should handle FAQ with special characters', () => {
      // Arrange
      const faqSection: ListSection = {
        id: 'faq_8',
        type: 'list',
        items: [
          '<strong>Q: What about &amp; symbols?</strong><br>A: They should work fine.',
          '<strong>Q: How about &lt; and &gt;?</strong><br>A: Those too.'
        ]
      }

      // Act
      const rendered = renderToStaticMarkup(
        React.createElement(BlogSectionRenderer, { section: faqSection })
      )

      // Assert: Should render with FAQ styling and preserve entities
      expect(rendered).toContain('list-none')
      expect(rendered).toContain('space-y-6')
      expect(rendered).toContain('&amp;')
    })
  })
})
