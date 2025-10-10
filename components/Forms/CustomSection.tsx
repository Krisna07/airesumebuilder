'use client';
import React, { useState, useEffect } from 'react';
import Button from '../UI/Button';
import { Plus, X, Copy } from 'lucide-react';
import Input from '../Input';
import Datepicker from './Datepicker';

interface CustomField {
    id: string;
    type: 'text' | 'date' | 'summary';
    title: string;
    value: string;
}

interface CustomSubsection {
    id: string;
    fields: CustomField[];
}

interface CustomSection {
    id: string;
    sectionTitle: string;
    subsections: CustomSubsection[];
}

interface CustomSectionBuilderProps {
    data?: CustomSection[];
    onChange?: (data: CustomSection[]) => void;
}

const CustomSectionBuilder: React.FC<CustomSectionBuilderProps> = ({
    data = [],
    onChange
}) => {
    const [sections, setSections] = useState<CustomSection[]>(data);

    const fieldTypes = [
        { type: 'text', label: 'Text Field' },
        { type: 'date', label: 'Date Field' },
        { type: 'summary', label: 'Summary Field' }
    ] as const;

    const MAX_SECTIONS = 2;
    const MAX_SUBSECTIONS = 2;

    // Sync with parent component - only when data prop changes
    useEffect(() => {
        if (data && data.length > 0) {
            setSections(data);
        }
    }, [data]);

    // Notify parent of changes
    const updateSections = (newSections: CustomSection[]) => {
        console.log('Custom sections updated:', newSections);
        setSections(newSections);
        onChange?.(newSections);
    };

    // Validation helpers
    const hasRequiredFields = (subsection: CustomSubsection): boolean => {
        const hasTextField = subsection.fields.some(field => 
            field.type === 'text' && field.value.trim() !== ''
        );
        const hasSummaryField = subsection.fields.some(field => 
            field.type === 'summary' && field.value.trim() !== ''
        );
        return hasTextField && hasSummaryField;
    };

    const getRequiredFieldsStatus = (subsection: CustomSubsection) => {
        const hasTextField = subsection.fields.some(field => field.type === 'text');
        const hasTextValue = subsection.fields.some(field => 
            field.type === 'text' && field.value.trim() !== ''
        );
        const hasSummaryField = subsection.fields.some(field => field.type === 'summary');
        const hasSummaryValue = subsection.fields.some(field => 
            field.type === 'summary' && field.value.trim() !== ''
        );
        
        return {
            hasTextField,
            hasTextValue,
            hasSummaryField,
            hasSummaryValue,
            isComplete: hasTextValue && hasSummaryValue
        };
    };

    const canAddSubsection = (section: CustomSection): boolean => {
        if (section.subsections.length === 0) return true;
        const lastSubsection = section.subsections[section.subsections.length - 1];
        return hasRequiredFields(lastSubsection);
    };

    const canAddSection = (): boolean => {
        if (sections.length === 0) return true;
        const lastSection = sections[sections.length - 1];
        return lastSection.subsections.some(subsection => hasRequiredFields(subsection));
    };

    const generateId = () =>
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2);

    const handleAddSection = () => {
        if (sections.length >= MAX_SECTIONS) return;
        
        // Check if current sections have valid data before adding new one
        if (!canAddSection()) {
            console.log('Cannot add section: Previous section needs at least one subsection with text and summary fields filled');
            return;
        }

        const newSection: CustomSection = {
            id: generateId(),
            sectionTitle: `Custom Section ${sections.length + 1}`,
            subsections: []
        };
        updateSections([...sections, newSection]);
    };

    const handleAddSubsection = (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section || section.subsections.length >= MAX_SUBSECTIONS) return;

        // Check if current subsection has required fields before adding new one
        if (!canAddSubsection(section)) {
            console.log('Cannot add subsection: Previous subsection needs both text and summary fields with values');
            return;
        }

        const newSubsection: CustomSubsection = {
            id: generateId(),
            fields: []
        };

        updateSections(
            sections.map(section =>
                section.id === sectionId
                    ? { ...section, subsections: [...section.subsections, newSubsection] }
                    : section
            )
        );
    };

    const handleAddField = (sectionId: string, subsectionId: string, fieldType: 'text' | 'date' | 'summary') => {
        const newField: CustomField = {
            id: generateId(),
            type: fieldType,
            title: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
            value: ''
        };

        updateSections(
            sections.map(section =>
                section.id === sectionId
                    ? {
                        ...section,
                        subsections: section.subsections.map(subsection =>
                            subsection.id === subsectionId
                                ? { ...subsection, fields: [...subsection.fields, newField] }
                                : subsection
                        )
                    }
                    : section
            )
        );
    };

    const updateSectionTitle = (sectionId: string, title: string) => {
        updateSections(
            sections.map(section =>
                section.id === sectionId ? { ...section, sectionTitle: title } : section
            )
        );
    };

    const updateField = (sectionId: string, subsectionId: string, fieldId: string, updates: Partial<CustomField>) => {
        updateSections(
            sections.map(section =>
                section.id === sectionId
                    ? {
                        ...section,
                        subsections: section.subsections.map(subsection =>
                            subsection.id === subsectionId
                                ? {
                                    ...subsection,
                                    fields: subsection.fields.map(field =>
                                        field.id === fieldId ? { ...field, ...updates } : field
                                    )
                                }
                                : subsection
                        )
                    }
                    : section
            )
        );
    };

    const removeField = (sectionId: string, subsectionId: string, fieldId: string) => {
        updateSections(
            sections.map(section =>
                section.id === sectionId
                    ? {
                        ...section,
                        subsections: section.subsections.map(subsection =>
                            subsection.id === subsectionId
                                ? { ...subsection, fields: subsection.fields.filter(field => field.id !== fieldId) }
                                : subsection
                        )
                    }
                    : section
            )
        );
    };

    const removeSubsection = (sectionId: string, subsectionId: string) => {
        updateSections(
            sections.map(section =>
                section.id === sectionId
                    ? { ...section, subsections: section.subsections.filter(sub => sub.id !== subsectionId) }
                    : section
            )
        );
    };

    const removeSection = (sectionId: string) => {
        updateSections(sections.filter(section => section.id !== sectionId));
    };

    const duplicateSubsection = (sectionId: string, subsectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        const subsection = section?.subsections.find(sub => sub.id === subsectionId);
        if (!subsection || !section || section.subsections.length >= MAX_SUBSECTIONS) return;

        const duplicatedSubsection: CustomSubsection = {
            id: generateId(),
            fields: subsection.fields.map(field => ({
                ...field,
                id: generateId(),
                value: '' // Clear values for the duplicate
            }))
        };

        updateSections(
            sections.map(section =>
                section.id === sectionId
                    ? { ...section, subsections: [...section.subsections, duplicatedSubsection] }
                    : section
            )
        );
    };

    const handleDateUpdate = (sectionId: string, subsectionId: string, fieldId: string) => {
        return (index: number, target: string, value: string) => {
            // Datepicker calls update(index, target, value) — we ignore index/target here
            updateField(sectionId, subsectionId, fieldId, { value });
        };
    };

    const renderFieldInput = (section: CustomSection, subsection: CustomSubsection, field: CustomField) => {
        switch (field.type) {
            case 'text':
                return (
                    <Input
                        type="text"
                        value={field.value}
                        onChange={e => updateField(section.id, subsection.id, field.id, { value: e.target.value })}
                        placeholder="Enter text value"
                        label={false}
                    />
                );

            case 'date':
                return (
                    <Datepicker
                        value={field.value}
                        index={0}
                        target={field.id}
                        label={false}
                        update={handleDateUpdate(section.id, subsection.id, field.id)}
                    />
                );

            case 'summary':
                return (
                    <textarea
                        value={field.value}
                        onChange={e => updateField(section.id, subsection.id, field.id, { value: e.target.value })}
                        placeholder="Enter summary or detailed text..."
                        className="w-full border rounded px-3 py-2 text-sm resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Custom Sections</h3>
                    <p className="text-sm text-gray-600">
                        Create up to {MAX_SECTIONS} custom sections, each with up to {MAX_SUBSECTIONS} subsections
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Button
                        variant="primary"
                        size="small"
                        onClick={handleAddSection}
                        disabled={sections.length >= MAX_SECTIONS || !canAddSection()}
                    >
                        <Plus size={16} /> Add Section ({sections.length}/{MAX_SECTIONS})
                    </Button>
                    {sections.length < MAX_SECTIONS && !canAddSection() && (
                        <span className="text-xs text-red-500">
                            Complete current section before adding new one
                        </span>
                    )}
                </div>
            </div>

            {/* Sections */}
            {sections.length === 0 ? (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    <p>No custom sections yet.</p>
                    <p className="text-sm">Click &quot;Add Section&quot; to create your first custom section.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            className="border-2 border-gray-200 rounded-lg p-4 space-y-4 bg-white shadow-sm"
                        >
                            {/* Section Header */}
                            <div className="flex items-center gap-4 pb-3 border-b border-gray-200">
                                <div className="flex-1">
                                    <Input
                                        type="text"
                                        value={section.sectionTitle}
                                        onChange={e => updateSectionTitle(section.id, e.target.value)}
                                        placeholder="Section Title (e.g., Awards, Projects, Volunteer)"
                                        label={false}
                                    />
                                </div>

                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {section.subsections.length}/{MAX_SUBSECTIONS} subsections
                                </span>

                                <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => removeSection(section.id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <X size={16} />
                                </Button>
                            </div>

                            {/* Add Subsection Button */}
                            <div className="flex justify-between items-center">
                                <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => handleAddSubsection(section.id)}
                                    disabled={section.subsections.length >= MAX_SUBSECTIONS || !canAddSubsection(section)}
                                >
                                    <Plus size={16} /> Add Subsection to &quot;{section.sectionTitle}&quot;
                                </Button>
                                {section.subsections.length >= MAX_SUBSECTIONS ? (
                                    <span className="text-xs text-gray-500">
                                        (Max {MAX_SUBSECTIONS} subsections per section)
                                    </span>
                                ) : !canAddSubsection(section) ? (
                                    <span className="text-xs text-red-500">
                                        (Complete current subsection with text & summary fields)
                                    </span>
                                ) : null}
                            </div>

                            {/* Subsections */}
                            {section.subsections.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-300 rounded">
                                    No subsections yet. Click &quot;Add Subsection&quot; to create your first subsection.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {section.subsections.map((subsection, subsectionIndex) => (
                                        <div
                                            key={subsection.id}
                                            className="border border-gray-300 rounded p-4 bg-gray-50/50 space-y-4"
                                        >
                                            {/* Subsection Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-gray-800">
                                                        Subsection {subsectionIndex + 1} ({subsection.fields.length} fields)
                                                    </h4>
                                                    {(() => {
                                                        const status = getRequiredFieldsStatus(subsection);
                                                        if (status.isComplete) {
                                                            return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Complete</span>;
                                                        } else if (!status.hasTextField || !status.hasSummaryField) {
                                                            return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Need: {!status.hasTextField ? 'Text' : ''}{!status.hasTextField && !status.hasSummaryField ? ' & ' : ''}{!status.hasSummaryField ? 'Summary' : ''}</span>;
                                                        } else {
                                                            return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Fill required fields</span>;
                                                        }
                                                    })()}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => duplicateSubsection(section.id, subsection.id)}
                                                        disabled={section.subsections.length >= MAX_SUBSECTIONS}
                                                        className="text-blue-500 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                                                        aria-label="Duplicate subsection"
                                                        title="Duplicate this subsection"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSubsection(section.id, subsection.id)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        aria-label="Remove subsection"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Add Field Controls */}
                                            <div className="flex gap-2 flex-wrap items-center">
                                                <span className="text-sm text-gray-600 font-medium">Add Field:</span>
                                                {fieldTypes.map(({ type, label }) => {
                                                    const status = getRequiredFieldsStatus(subsection);
                                                    const isRequired = type === 'text' || type === 'summary';
                                                    const hasField = type === 'text' ? status.hasTextField : 
                                                                    type === 'summary' ? status.hasSummaryField : true;
                                                    const needsField = isRequired && !hasField;
                                                    
                                                    return (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => handleAddField(section.id, subsection.id, type)}
                                                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                                                needsField 
                                                                    ? 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200' 
                                                                    : 'bg-gray-200 hover:bg-blue-200'
                                                            }`}
                                                        >
                                                            + {label} {needsField ? '(Required)' : ''}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Fields */}
                                            {subsection.fields.length === 0 ? (
                                                <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded">
                                                    <p>No fields yet. Add at least one <strong>Text Field</strong> and one <strong>Summary Field</strong> to get started.</p>
                                                    <p className="text-xs mt-1">Both are required to add another subsection or section.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {subsection.fields.map((field) => (
                                                        <div
                                                            key={field.id}
                                                            className="border border-gray-200 rounded p-3 bg-white space-y-3"
                                                        >
                                                            {/* Field Header */}
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1">
                                                                    <Input
                                                                        type="text"
                                                                        value={field.title}
                                                                        onChange={e => updateField(section.id, subsection.id, field.id, { title: e.target.value })}
                                                                        placeholder="Field Name (e.g., Project Name, Award Title)"
                                                                        label={false}
                                                                    />
                                                                </div>

                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                                                                    {field.type}
                                                                </span>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeField(section.id, subsection.id, field.id)}
                                                                    className="text-red-500 hover:text-red-700 p-1"
                                                                    aria-label="Remove field"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>

                                                            {/* Field Input */}
                                                            {renderFieldInput(section, subsection, field)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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