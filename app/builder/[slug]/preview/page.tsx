'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ClassicTemplate, MinimalTemplate, ModernTemplate } from '@/components/Templates';
import { ResumeData, UserResume } from '@/types/types';
import { ResumeStorage } from '@/lib/resume-storage';

const PreviewPage = () => {
    const params = useParams();
    const slug = params.slug as string;

    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<UserResume['template']>('modern');
    const [loading, setLoading] = useState(true);

    // Template configuration
    const templates = [
        {
            id: 'modern' as const,
            name: 'Modern',
            description: 'Clean design with gradient header',
            icon: '🎨'
        },
        {
            id: 'classic' as const,
            name: 'Classic',
            description: 'Traditional professional layout',
            icon: '📄'
        },
        {
            id: 'minimal' as const,
            name: 'Minimal',
            description: 'Simple, elegant design',
            icon: '✨'
        }
    ];

    // Load resume data on component mount
    useEffect(() => {
        if (!slug) return;

        // Ensure we're on the client side
        if (typeof window === 'undefined') return;

        try {
            const stored = ResumeStorage.load(slug);
            if (stored) {
                setResumeData(stored.resumeData);
                setSelectedTemplate(stored.template);
            } else {
                console.warn('No resume data found for UUID:', slug);
                window.location.href = '/builder';
                return;
            }
        } catch (error) {
            console.error('Error loading resume data:', error);
            window.location.href = '/builder';
            return;
        }

        setLoading(false);
    }, [slug]);

    // Handle template selection
    const handleTemplateChange = (templateId: UserResume['template']) => {
        setSelectedTemplate(templateId);
        if (typeof window !== 'undefined') {
            // Save the updated template selection with the current resume data
            const stored = ResumeStorage.load(slug);
            if (stored) {
                ResumeStorage.save(slug, templateId, stored.resumeData);
            }
        }
    };

    // Render the selected template
    const renderTemplate = () => {
        if (!resumeData) return null;

        switch (selectedTemplate) {
            case 'modern':
                return <ModernTemplate data={resumeData} />;
            case 'classic':
                return <ClassicTemplate data={resumeData} />;
            case 'minimal':
                return <MinimalTemplate data={resumeData} />;
            default:
                return <ModernTemplate data={resumeData} />;
        }
    };

    // Handle PDF download
    const handleDownloadPDF = async () => {
        if (!resumeData) return;

        try {
            console.log('🔄 Starting PDF download...');

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resumeData,
                    template: selectedTemplate
                }),
            });

            console.log('📡 Response status:', response.status);

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                console.log('📄 Content type:', contentType);

                if (contentType?.includes('application/pdf')) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${resumeData.profile.fullname || 'Resume'}_${selectedTemplate}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    console.log('✅ PDF downloaded successfully');
                } else {
                    throw new Error('Invalid response type: ' + contentType);
                }
            } else {
                const errorData = await response.json();
                console.error('❌ PDF generation error:', errorData);
                alert(`Error: ${errorData.details || errorData.error || 'PDF generation failed'}`);
            }
        } catch (error) {
            console.error('❌ PDF download error:', error);
            alert('Error generating PDF. Please try again.');
        }
    };

    // Handle save resume
    const handleSaveResume = () => {
        if (!resumeData || typeof window === 'undefined') return;
        ResumeStorage.save(slug, selectedTemplate, resumeData);
        alert('Resume saved successfully!');
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading preview...</p>
                </div>
            </div>
        );
    }

    // No data state
    if (!resumeData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">No Resume Data</h2>
                    <p className="text-gray-600 mb-6">Please complete your resume before previewing.</p>
                    <button
                        onClick={() => window.location.href = '/builder'}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Builder
                    </button>
                </div>
            </div>
        );
    }

    // Incomplete data state
    const hasMinimumData = resumeData.profile.fullname && resumeData.profile.email;
    if (!hasMinimumData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Incomplete Resume</h2>
                    <p className="text-gray-600 mb-6">Please complete at least your name and email before previewing.</p>
                    <button
                        onClick={() => window.location.href = `/builder/${slug}`}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Continue Editing
                    </button>
                </div>
            </div>
        );
    }

    // Main preview page
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Preview</h1>
                    <p className="text-gray-600">Choose a template and preview your resume</p>
                </div>

                {/* Template Selector */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Template</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleTemplateChange(template.id)}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${selectedTemplate === template.id
                                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{template.icon}</span>
                                    <h3 className={`font-semibold ${selectedTemplate === template.id ? 'text-blue-700' : 'text-gray-800'
                                        }`}>
                                        {template.name}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-600">{template.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Resume Preview */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                    <div className="bg-gray-100 px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {templates.find(t => t.id === selectedTemplate)?.name} Template Preview
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="transform scale-75 origin-top-left w-[133.33%] min-h-[800px]">
                            {renderTemplate()}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 flex-wrap">
                    <button
                        onClick={handleDownloadPDF}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                    >
                        📄 Download PDF
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                const response = await fetch('/api/test-pdf');
                                if (response.ok) {
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'test.pdf';
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                } else {
                                    alert('Test PDF generation failed');
                                }
                            } catch (error) {
                                console.error('Test error:', error);
                                alert('Test failed');
                            }
                        }}
                        className="px-8 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium shadow-md"
                    >
                        🧪 Test PDF
                    </button>
                    <button
                        onClick={handleSaveResume}
                        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md"
                    >
                        💾 Save Resume
                    </button>
                    <button
                        onClick={() => window.location.href = `/builder/${slug}`}
                        className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md"
                    >
                        ✏️ Edit Resume
                    </button>
                    <button
                        onClick={() => window.location.href = '/builder'}
                        className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium shadow-md"
                    >
                        ➕ New Resume
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreviewPage;