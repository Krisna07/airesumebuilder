'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Input from '../Input';
import Datepicker from './Datepicker';

type CustomSectionType =
  | 'projects'
  | 'awards'
  | 'customSections'
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
  customSections: [
    { key: 'title', label: 'Section Title', placeholder: 'Section Title' },
    { key: 'subsectionTitle', label: 'Subsection Title', placeholder: 'Subsection Title' },
    { key: 'content', label: 'Content', textarea: true, placeholder: 'Content' },
    { key: 'date', label: 'Date', type: 'date', placeholder: 'Date (Optional)', optional: true }
  ],
  projects: [
    { key: 'name', label: 'Project Name', placeholder: 'Project Name' },
    { key: 'url', label: 'URL', type: 'url', placeholder: 'Link', optional: true },
    { key: 'role', label: 'Role', placeholder: 'Role', optional: true },
    { key: 'techStack', label: 'Tech Stack', placeholder: 'Created On', optional: true },
    { key: 'description', label: 'Description', textarea: true, placeholder: 'Short summary or impact' }
  ],
  awards: [
    { key: 'name', label: 'Award Name', placeholder: 'Award Name' },
    { key: 'provider', label: 'Issuer / Organization', placeholder: 'Place Awarded' },
    { key: 'year', label: 'Year', type: 'number', placeholder: 'Year Awarded' }
  ],
  publications: [
    { key: 'title', label: 'Title', placeholder: 'Title' },
    { key: 'publisher', label: 'Publisher / Journal', placeholder: 'Publisher' },
    { key: 'date', label: 'Publication Date', type: 'Date' },
    { key: 'url', label: 'URL', type: 'url', placeholder: 'Link', optional: true },
    { key: 'summary', label: 'Summary', textarea: true, placeholder: 'Overview', optional: true }
  ],
  volunteer: [
    { key: 'organization', label: 'Organization', placeholder: 'Volunteer At' },
    { key: 'role', label: 'Role', placeholder: 'Role' },
    { key: 'startDate', label: 'Start Date', type: 'Date' },
    { key: 'endDate', label: 'End Date', type: 'date', optional: true },
    { key: 'description', label: 'Description', textarea: true, placeholder: 'Description' }
  ],
  custom: [
    { key: 'label', label: 'Label', placeholder: 'Label' },
    { key: 'value', label: 'Value / Detail', placeholder: 'Detail', textarea: true }
  ]
};

const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID
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
    data && data.length ? data : [createEmptySection('customSections')]
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
    <>
      <div className="space-y-4">
        {sections.map((section) => {
          const fieldDefinitions = SECTION_FIELD_DEFINITIONS[section.type];
            return (
            <div
              key={section.id}
                className="rounded-lg bg-white shadow-sm divide-y"
            >
              <div className="p-4 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 md:items-end">
                  <div className="flex-1 space-y-3">
                      <div className="flex max-sm:flex-col gap-3">
                        <div className='w-full grid gap-1 transition-all ease-in-out text-[14px] font-sans'>
                          <label className="block  text-[14px] text-gray-700 font-semibold px-1">
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
                            className="w-full outline-none ring-1 focus:ring-green-600 ring-gray-200 transition-all ease-in-out duration-300 px-[8px] py-[4px] text-[14px] rounded-md relative z-10"
                        >

                          <option value="projects">Projects</option>
                          <option value="awards">Awards</option>
                          <option value="customSections">Custom Sections</option>
                          <option value="publications">Publications</option>
                          <option value="volunteer">Volunteer</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                        <Input
                          type="text"
                          name={`section_title_${section.id}`}
                          placeholder={`Type`}
                          value={section.title}
                          onChange={event =>
                            updateSectionMeta(section.id, {
                              title: event.target.value
                            })
                          }
                        />

                      </div>
                      {/* <p className="text-[11px] text-gray-500">
                      Section {sectionIndex + 1} · {section.items.length} item
                      {section.items.length !== 1 && 's'}
                    </p> */}
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

                <div className="">
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
                                field.type === 'date' ? <Datepicker index={0} target={''} update={() => { }} /> :
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
            onClick={() => addSection('customSections')}
            className="text-sm px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100"
          >
            + Custom Section
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
    </>
  );
};

export default AddSection;
