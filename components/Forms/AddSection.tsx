'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Input from '../Input';

type CustomSectionType =
  | 'projects'
  | 'awards'
  | 'certificates'
  | 'publications'
  | 'volunteer'
  | 'custom';

interface FieldDefinition {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  optional?: boolean;
  textarea?: boolean;
}

interface DynamicSectionItem {
  id: string;
  fields: Record<string, string>;
}

export interface DynamicCustomSection {
  id: string;
  type: CustomSectionType;
  title: string;
  items: DynamicSectionItem[];
}

interface DynamicCustomSectionProps {
  data?: DynamicCustomSection[];
  onChange?: (data: DynamicCustomSection[]) => void; // made optional
  maxSections?: number;
  maxItemsPerSection?: number;
}

const SECTION_FIELD_DEFINITIONS: Record<CustomSectionType, FieldDefinition[]> = {
  projects: [
    { key: 'name', label: 'Project Name', placeholder: 'e.g., Portfolio Revamp' },
    { key: 'url', label: 'URL', type: 'url', placeholder: 'https://...', optional: true },
    { key: 'role', label: 'Role', placeholder: 'e.g., Lead Developer', optional: true },
    { key: 'techStack', label: 'Tech Stack', placeholder: 'React, Node.js, PostgreSQL', optional: true },
    { key: 'description', label: 'Description', textarea: true, placeholder: 'Short summary or impact' }
  ],
  awards: [
    { key: 'name', label: 'Award Name', placeholder: 'e.g., Employee of the Year' },
    { key: 'provider', label: 'Issuer / Organization', placeholder: 'e.g., Company XYZ' },
    { key: 'year', label: 'Year', type: 'number', placeholder: '2024' }
  ],
  certificates: [
    { key: 'name', label: 'Certificate Name', placeholder: 'e.g., AWS Solutions Architect' },
    { key: 'provider', label: 'Provider', placeholder: 'e.g., Amazon' },
    { key: 'awardedDate', label: 'Awarded Date', type: 'date' }
  ],
  publications: [
    { key: 'title', label: 'Title', placeholder: 'e.g., Scaling Microservices' },
    { key: 'publisher', label: 'Publisher / Journal', placeholder: 'e.g., Tech Journal' },
    { key: 'date', label: 'Publication Date', type: 'date' },
    { key: 'url', label: 'URL', type: 'url', placeholder: 'https://...', optional: true },
    { key: 'summary', label: 'Summary', textarea: true, placeholder: 'Brief overview (1–2 lines)', optional: true }
  ],
  volunteer: [
    { key: 'organization', label: 'Organization', placeholder: 'e.g., Red Cross' },
    { key: 'role', label: 'Role', placeholder: 'e.g., Coordinator' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date', optional: true },
    { key: 'description', label: 'Description', textarea: true, placeholder: 'Impact / responsibilities' }
  ],
  custom: [
    { key: 'label', label: 'Label', placeholder: 'e.g., Item Name' },
    { key: 'value', label: 'Value / Detail', placeholder: 'Description or detail', textarea: true }
  ]
};

const generateId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2));

const createEmptyItem = (sectionType: CustomSectionType): DynamicSectionItem => {
  const defs = SECTION_FIELD_DEFINITIONS[sectionType];
  const fields: Record<string, string> = {};
  defs.forEach(def => {
    fields[def.key] = '';
  });
  return { id: generateId(), fields };
};

const createEmptySection = (sectionType: CustomSectionType = 'custom'): DynamicCustomSection => ({
  id: generateId(),
  type: sectionType,
  title: sectionType === 'custom' ? 'Custom Section' : capitalize(sectionType),
  items: [createEmptyItem(sectionType)]
});

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const AddSection: React.FC<DynamicCustomSectionProps> = ({
  data,
  onChange,
  maxSections = 6,
  maxItemsPerSection = 15
}) => {
  const [sections, setSections] = useState<DynamicCustomSection[]>(
    data && data.length ? data : [createEmptySection('projects')]
  );

  // Sync incoming controlled updates
  useEffect(() => {
    if (data && data.length) setSections(data);
  }, [data]);

  const emitChange = useCallback(
    (next: DynamicCustomSection[]) => {
      setSections(next);
      if (typeof onChange === 'function') {
        onChange(next);
      }
    },
    [onChange]
  );

  const changeSectionType = (sectionId: string, nextType: CustomSectionType) => {
    emitChange(
      sections.map(section => {
        if (section.id !== sectionId) return section;
        const nextDefs = SECTION_FIELD_DEFINITIONS[nextType];
        return {
          ...section,
          type: nextType,
          title:
            section.title && section.title !== capitalize(section.type)
              ? section.title
              : capitalize(nextType),
          items: section.items.length
            ? section.items.map(item => {
                const newFields: Record<string, string> = {};
                nextDefs.forEach(def => {
                  newFields[def.key] = item.fields[def.key] || '';
                });
                return { ...item, fields: newFields };
              })
            : [createEmptyItem(nextType)]
        };
      })
    );
  };

  const updateSectionMeta = (
    sectionId: string,
    patch: Partial<Omit<DynamicCustomSection, 'items' | 'id'>>
  ) => {
    emitChange(
      sections.map(section =>
        section.id === sectionId ? { ...section, ...patch } : section
      )
    );
  };

  const updateItemField = (
    sectionId: string,
    itemId: string,
    fieldKey: string,
    value: string
  ) => {
    emitChange(
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      fields: { ...item.fields, [fieldKey]: value }
                    }
                  : item
              )
            }
          : section
      )
    );
  };

  const addItem = (sectionId: string) => {
    emitChange(
      sections.map(section =>
        section.id === sectionId
          ? section.items.length >= maxItemsPerSection
            ? section
            : {
                ...section,
                items: [...section.items, createEmptyItem(section.type)]
              }
          : section
      )
    );
  };

  const removeItem = (sectionId: string, itemId: string) => {
    emitChange(
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items:
                section.items.length === 1
                  ? section.items
                  : section.items.filter(item => item.id !== itemId)
            }
          : section
      )
    );
  };

  const addSection = (type: CustomSectionType = 'custom') => {
    if (sections.length >= maxSections) return;
    emitChange([...sections, createEmptySection(type)]);
  };

  const removeSection = (sectionId: string) => {
    if (sections.length === 1) return;
    emitChange(sections.filter(section => section.id !== sectionId));
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-lg font-semibold">Additional / Custom Sections</h2>
        <p className="text-sm text-gray-600">
          Add flexible sections (Projects, Awards, Certificates, Publications, Volunteer, or fully custom).
        </p>
      </header>

      <div className="space-y-10">
        {sections.map((section, sectionIndex) => {
          const fieldDefinitions = SECTION_FIELD_DEFINITIONS[section.type];
            return (
            <div
              key={section.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm divide-y"
            >
              <div className="p-4 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 md:items-end">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 uppercase mb-1">
                          Section Type
                        </label>
                        <select
                          value={section.type}
                          onChange={event =>
                            changeSectionType(
                              section.id,
                              event.target.value as CustomSectionType
                            )
                          }
                          className="w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="projects">Projects</option>
                          <option value="awards">Awards</option>
                          <option value="certificates">Certificates</option>
                          <option value="publications">Publications</option>
                          <option value="volunteer">Volunteer</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <Input
                          type="text"
                          name={`section_title_${section.id}`}
                          placeholder={`e.g., ${capitalize(section.type)}`}
                          value={section.title}
                          onChange={event =>
                            updateSectionMeta(section.id, {
                              title: event.target.value
                            })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Section {sectionIndex + 1} · {section.items.length} item
                      {section.items.length !== 1 && 's'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="text-xs px-3 py-2 rounded border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        Remove Section
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {section.items.map(item => (
                  <div
                    key={item.id}
                    className="rounded-md border border-gray-200 p-4 bg-gray-50/60 space-y-4 relative"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      {fieldDefinitions.map(field => {
                        const value = item.fields[field.key] ?? '';
                        const inputName = `${section.id}_${item.id}_${field.key}`;
                        return (
                          <div
                            key={field.key}
                            className={field.textarea ? 'md:col-span-2' : ''}
                          >
                            {field.textarea ? (
                              <div className="flex flex-col gap-1">
                                <label
                                  htmlFor={inputName}
                                  className="text-xs font-medium text-gray-700 uppercase"
                                >
                                  {field.label}
                                  {field.optional && (
                                    <span className="text-gray-400 font-normal">
                                      {' '}
                                      (optional)
                                    </span>
                                  )}
                                </label>
                                <textarea
                                  id={inputName}
                                  name={inputName}
                                  value={value}
                                  placeholder={field.placeholder}
                                  onChange={event =>
                                    updateItemField(
                                      section.id,
                                      item.id,
                                      field.key,
                                      event.target.value
                                    )
                                  }
                                  className="w-full rounded border border-gray-300 px-2 py-2 text-sm resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            ) : (
                              <Input
                                type={field.type || 'text'}
                                name={inputName}
                                placeholder={`${field.placeholder}`}
                                value={value}
                                onChange={event =>
                                  updateItemField(
                                    section.id,
                                    item.id,
                                    field.key,
                                    event.target.value
                                  )
                                }
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end">
                      {section.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(section.id, item.id)
                          }
                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        >
                          Remove Item
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div>
                  <button
                    type="button"
                    onClick={() => addItem(section.id)}
                    disabled={section.items.length >= maxItemsPerSection}
                    className="text-xs px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
                  >
                    + Add {capitalize(section.type)} Item
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sections.length < maxSections && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addSection('projects')}
            className="text-sm px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100"
          >
            + Projects Section
          </button>
          <button
            type="button"
            onClick={() => addSection('awards')}
            className="text-sm px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100"
          >
            + Awards Section
          </button>
          <button
            type="button"
            onClick={() => addSection('certificates')}
            className="text-sm px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100"
          >
            + Certificates Section
          </button>
          <button
            type="button"
            onClick={() => addSection('publications')}
            className="text-sm px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100"
          >
            + Publications Section
          </button>
          <button
            type="button"
            onClick={() => addSection('volunteer')}
            className="text-sm px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100"
          >
            + Volunteer Section
          </button>
          <button
            type="button"
            onClick={() => addSection('custom')}
            className="text-sm px-3 py-2 rounded border border-blue-300 bg-blue-50 hover:bg-blue-100"
          >
            + Custom Section
          </button>
        </div>
      )}
    </div>
  );
};

export default AddSection;
