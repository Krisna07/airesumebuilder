'use client';
import React, { useState, useEffect } from 'react';
import Button from '../UI/Button';
import { Plus, X } from 'lucide-react';
import Input from '../Input';
import Datepicker from './Datepicker';
import MarkdownEditor from './MarkdownEditor';

import { CustomSectionData, CustomSubsection } from '@/types/types';

interface CustomSectionBuilderProps {
    data?: CustomSectionData[];
    onChange?: (data: CustomSectionData[]) => void;
}

const CustomSectionBuilder: React.FC<CustomSectionBuilderProps> = ({ data = [], onChange }) => {
    const [sections, setSections] = useState<CustomSectionData[]>(data);

    const MAX_SECTIONS = 2;
    const MAX_SUBSECTIONS = 2;

    // Sync with parent component - only when data prop changes
    useEffect(() => {
        if (data && data.length > 0) {
            setSections(data);
        }
    }, [data]);

    // Notify parent of changes
    const updateSections = (newSections: CustomSectionData[]) => {
        console.log('Custom sections updated:', newSections);
        setSections(newSections);
        onChange?.(newSections);
    };

    // Validation helpers
    const hasRequiredFields = (subsection: CustomSubsection): boolean => {
        return subsection.title.trim() !== '' && subsection.content.trim() !== '';
    };

    const canAddSubsection = (section: CustomSectionData): boolean => {
        if (section.subsections.length === 0) return true;
        const lastSubsection = section.subsections[section.subsections.length - 1];
        return hasRequiredFields(lastSubsection) && section.subsections.length < MAX_SUBSECTIONS;
    };

    const canAddSection = (): boolean => {
        if (sections.length === 0) return true;
        const lastSection = sections[sections.length - 1];
        return lastSection.subsections.some((subsection) => hasRequiredFields(subsection));
    };

    const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

    const handleAddSection = () => {
        if (sections.length >= MAX_SECTIONS) return;

        // Check if current sections have valid data before adding new one
        if (!canAddSection() && sections.length > 0) {
            console.log('Cannot add section: Previous section needs at least one subsection with title and summary filled');
            return;
        }

        const newSection: CustomSectionData = {
            id: Date.now().toString(),
            title: '',
            subsections: [
                {
                id: Date.now().toString() + '_sub',
                title: '',
                content: '',
                date: ''
              }
          ]
        };
        updateSections([...sections, newSection]);
    };

    const handleAddSubsection = (sectionId: string) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section || section.subsections.length >= MAX_SUBSECTIONS) return;

        // Check if current subsections are complete before adding new one
        if (!canAddSubsection(section)) {
            console.log('Cannot add subsection: Previous subsection needs title and summary filled');
            return;
        }

        const newSubsection: CustomSubsection = {
            id: generateId(),
            title: '',
            content: '',
            date: ''
        };

        updateSections(sections.map((s) => (s.id === sectionId ? { ...s, subsections: [...s.subsections, newSubsection] } : s)));
    };

    const updateSectionTitle = (sectionId: string, title: string) => {
        updateSections(sections.map((section) => (section.id === sectionId ? { ...section, title } : section)));
    };

    const updateSubsection = (sectionId: string, subsectionId: string, updates: Partial<CustomSubsection>) => {
        updateSections(
            sections.map((section) =>
                section.id === sectionId
                    ? {
                        ...section,
                        subsections: section.subsections.map((subsection) => (subsection.id === subsectionId ? { ...subsection, ...updates } : subsection))
                    }
                    : section
            )
        );
    };

    const removeSubsection = (sectionId: string, subsectionId: string) => {
        updateSections(sections.map((section) => (section.id === sectionId ? { ...section, subsections: section.subsections.filter((sub) => sub.id !== subsectionId) } : section)));
    };

    const removeSection = (sectionId: string) => {
        updateSections(sections.filter((section) => section.id !== sectionId));
    };

    // const duplicateSubsection = (sectionId: string, subsectionId: string) => {
    //     const section = sections.find(s => s.id === sectionId);
    //     const subsection = section?.subsections.find(sub => sub.id === subsectionId);
    //     if (!subsection || !section || section.subsections.length >= MAX_SUBSECTIONS) return;

    //     const duplicatedSubsection: CustomSubsection = {
    //         id: generateId(),
    //         title: subsection.title,
    //         summary: subsection.summary,
    //         hasDate: subsection.hasDate,
    //         date: subsection.date
    //     };

    //     updateSections(
    //         sections.map(s =>
    //             s.id === sectionId
    //                 ? { ...s, subsections: [...s.subsections, duplicatedSubsection] }
    //                 : s
    //         )
    //     );
    // };

    const handleDateUpdate = (sectionId: string, subsectionId: string) => {
        return (index: number, target: string, value: string) => {
            updateSubsection(sectionId, subsectionId, { date: value });
        };
    };

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                {/* <div>
                    <h3 className="text-lg font-semibold">Custom Sections</h3>
                    <p className="text-sm text-gray-600">
                        Create up to {MAX_SECTIONS} custom sections, each with up to {MAX_SUBSECTIONS} subsections
                    </p>
                </div> */}
                <div className='w-full grid gap-1'>
                    <Button variant='primary' size='small' onClick={handleAddSection} disabled={sections.length >= MAX_SECTIONS || (sections.length > 0 && !canAddSection())} className='whitespace-nowrap'>
                        <Plus size={16} /> Add Section ({sections.length}/{MAX_SECTIONS})
                    </Button>
                    {sections.length < MAX_SECTIONS && sections.length > 0 && !canAddSection() && <span className='text-xs text-red-500'>Complete current section before adding new one</span>}
                </div>
            </div>

            {/* Sections */}
            {sections.length === 0 ? (
                <div className='text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg'>
                    <p>No custom sections yet.</p>
                    <p className='text-sm'>Click &quot;Add Section&quot; to create your first custom section.</p>
                </div>
            ) : (
                    <div className='space-y-6'>
                        {sections.map((section, count) => (
                            <div key={count} className='border-2 border-gray-200 rounded-lg p-4 space-y-4 bg-white shadow-sm'>
                                {/* Section Header */}
                                <div className='flex gap-4 pb-3 border-b border-gray-200'>
                                    <div className='flex-1'>
                                        <Input
                                            type='text'
                                            name={`section-title-${section.id}`}
                                            value={section.title}
                                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                            placeholder='Section Title (e.g., Awards, Projects, Volunteer)'
                                        />
                                    </div>
                                    <button onClick={() => removeSection(section.id)} className='w-fit h-fit text-red-600 hover:text-red-700 p-2 rounded-full bg-gray-300/30'>
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Add Subsection Button */}
                                <div className='grid gap-1'>
                                    <Button variant='secondary' size='small' onClick={() => handleAddSubsection(section.id)} disabled={!canAddSubsection(section)} className='whitespace-nowrap'>
                                        <Plus size={16} /> Add Subsection ({section.subsections.length}/{MAX_SUBSECTIONS})
                                    </Button>
                                    {section.subsections.length >= MAX_SUBSECTIONS ? (
                                        <span className='text-xs text-gray-500'>(Max {MAX_SUBSECTIONS} subsections per section)</span>
                                    ) : section.subsections.length > 0 && !canAddSubsection(section) ? (
                                        <span className='text-xs text-red-500'>(Complete current subsection with title & summary)</span>
                                    ) : null}
                                </div>

                                {/* Subsections */}
                                {section.subsections.length === 0 ? (
                                    <div className='text-center py-8 text-gray-400 text-sm border border-dashed border-gray-300 rounded'>
                                        No subsections yet. Click &quot;Add Subsection&quot; to create your first subsection.
                                    </div>
                                ) : (
                                        <div className='space-y-4'>
                                            {section.subsections.map((subsection, subsectionIndex) => (
                                              <div key={subsectionIndex} className='border border-gray-300 rounded p-4 bg-gray-50/50 space-y-4'>
                                                  {/* Subsection Header */}
                                                  <div className='flex items-center justify-between'>
                                                      <div className='flex items-center gap-2'>
                                                          <h4 className='font-medium text-gray-800'>Subsection {subsectionIndex + 1}</h4>
                                                          {hasRequiredFields(subsection) ? (
                                                              <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>✓ Complete</span>
                                                          ) : (
                                                              <span className='text-xs bg-red-100 text-red-800 px-2 py-1 rounded'>Fill required fields</span>
                                                          )}
                                                      </div>

                                                      <div className='flex items-center gap-2'>
                                                          {/* <button
                                                        type="button"
                                                        onClick={() => duplicateSubsection(section.id, subsection.id)}
                                                        disabled={section.subsections.length >= MAX_SUBSECTIONS}
                                                        className="text-blue-500 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                                                        aria-label="Duplicate subsection"
                                                        title="Duplicate this subsection"
                                                    >
                                                        <Copy size={14} />
                                                    </button> */}
                                                          <button type='button' onClick={() => removeSubsection(section.id, subsection.id)} className='text-red-500 hover:text-red-700 p-1' aria-label='Remove subsection'>
                                                              <X size={14} />
                                                          </button>
                                                      </div>
                                                  </div>

                                                  {/* Subsection Fields */}
                                                  <div className='space-y-3'>
                                                      {/* Title */}
                                                      <div>
                                                          <label className='block text-sm font-medium text-gray-700 mb-1'>Title *</label>
                                                          <Input
                                                              type='text'
                                                              value={subsection.title}
                                                              onChange={(e) => updateSubsection(section.id, subsection.id, { title: e.target.value })}
                                                              placeholder='e.g., Project Name, Award Title, Organization'
                                                              label={false}
                                                          />
                                                      </div>

                                                      {/* Summary */}
                                                      <div>
                                                          <label className='block text-sm font-medium text-gray-700 mb-1'>Summary *</label>
                                                          <MarkdownEditor
                                                              value={subsection.content}
                                                              onChange={(value: string) => updateSubsection(section.id, subsection.id, { content: value })}
                                                              placeholder='Describe the achievement, project details, or relevant information. Use the toolbar buttons to create bullet or numbered lists...'
                                                              className='text-sm'
                                                          />
                                                      </div>
                                                      {/* Date Picker */}
                                                      <div className='space-y-2'>
                                                          <label className='text-sm font-medium text-gray-700'>Date (Optional)</label>
                                                          <Datepicker value={subsection.date || ''} index={0} target='date' update={handleDateUpdate(section.id, subsection.id)} />
                                                      </div>
                                                  </div>
                                              </div>
                                          ))}
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default CustomSectionBuilder;
