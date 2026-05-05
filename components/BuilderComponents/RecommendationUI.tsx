import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Sparkles, Plus } from 'lucide-react';
import { matchRole } from '@/lib/roleMatcher';
import { generateRecommendations } from '@/lib/recommendationEngine';

interface RecommendationUIProps {
  title: string;
  onAddBullet: (bullet: string) => void;
  isInputActive: boolean;
  responsibilitiesCount: number;
  inputValue: string;
  existingResponsibilities: string[];
}

type Specialization = 'frontend' | 'backend' | 'general';

const RecommendationUI: React.FC<RecommendationUIProps> = ({
  title,
  onAddBullet,
  isInputActive,
  responsibilitiesCount,
  inputValue,
  existingResponsibilities
}) => {
  // Helper: Check if role is tech-related
  const isTechRole = (roleTitle: string) => {
    const lowerTitle = roleTitle.toLowerCase();
    return lowerTitle.includes('engineer') ||
      lowerTitle.includes('developer') ||
      lowerTitle.includes('analyst') ||
      lowerTitle.includes('programmer') ||
      lowerTitle.includes('architect') ||
      lowerTitle.includes('data scientist') ||
      lowerTitle.includes('it ');
  };

  // --- State ---
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [source, setSource] = useState<'builtin' | 'db_cache' | 'ai_generated'>('builtin');
  const [specialization, setSpecialization] = useState<Specialization>('general');
  const [seniority, setSeniority] = useState<'junior' | 'senior'>('junior');
  const [showUI, setShowUI] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasAutoFetched, setHasAutoFetched] = useState(false);
  
  const [inspectionTasks, setInspectionTasks] = useState<string[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState<string | null>(null);
  const [techStack, setTechStack] = useState({
    frontend_stack: 'React',
    backend_stack: 'Node.js',
    cloud_platform: 'AWS',
  });

  // --- Derived State (Performance optimized) ---
  const filteredRecommendations = useMemo(() => {
    const normalizedExisting = new Set(existingResponsibilities.map(r => r.trim().toLowerCase()));
    
    return recommendations
      .filter(rec => !normalizedExisting.has(rec.trim().toLowerCase()))
      .filter(rec => !inputValue || rec.toLowerCase().includes(inputValue.toLowerCase()))
      .sort((a, b) => {
        if (!inputValue) return 0;
        const aStarts = a.toLowerCase().startsWith(inputValue.toLowerCase());
        const bStarts = b.toLowerCase().startsWith(inputValue.toLowerCase());
        return aStarts === bStarts ? a.localeCompare(b) : aStarts ? -1 : 1;
      });
  }, [recommendations, existingResponsibilities, inputValue]);

  // --- Actions ---
  const fetchRecommendations = useCallback(async (isAIRequest = false) => {
    if (!title || title.length < 3) {
      setShowUI(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    isAIRequest ? setAiLoading(true) : setLoading(true);

    try {
      // 1. Try Local Engine first if not a forced AI request
      if (!isAIRequest) {
        const roleKey = matchRole(title);
        if (roleKey) {
          const localRecs = generateRecommendations({ roleKey, specialization, seniority, techStack });
          if (localRecs?.length) {
            setRecommendations(localRecs);
            setSource('builtin');
            setShowUI(true);
            setLoading(false);
            return;
          }
        }
      }

      // 2. Fallback to API
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: title,
          specialization,
          seniority,
          techStack,
          isAI: isAIRequest,
          existingBullets: isAIRequest ? [...recommendations, ...existingResponsibilities] : []
        })
      });

      const data = await response.json();
      
      if (isAIRequest) {
        setRecommendations(prev => [...prev, ...(data.recommendations || [])]);
        setSource(data.source || 'ai_generated');
        if (data.tasks) setInspectionTasks(data.tasks);
        if (data.notes) setInspectionNotes(data.notes);
      } else {
        if (data.recommendations?.length) {
          setRecommendations(data.recommendations);
          setSource(data.source || 'builtin');
          setShowUI(true);
        } else if (specialization !== 'general') {
          setSpecialization('general'); // Retry with general
        }
      }
    } catch (error) {
      console.error('Recommendation Error:', error);
    } finally {
      setLoading(false);
      setAiLoading(false);
      setHasAutoFetched(true);
    }
  }, [title, specialization, seniority, techStack, recommendations, existingResponsibilities]);

  // --- Effects ---

  // Auto-fetch/refetch when title or specialization change
  // Seniority is NOT included - it's already passed to API via closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setHasAutoFetched(false);
    fetchRecommendations();
  }, [title, specialization]);
  useEffect(() => {
    if (!loading && !aiLoading && hasAutoFetched && title.length >= 3 && filteredRecommendations.length < 5) {
      fetchRecommendations(true);
    }
  }, [aiLoading, filteredRecommendations.length, hasAutoFetched, loading, title.length]);

  // --- Render Logic ---
  const isVisible = isHovered || isInputActive || (responsibilitiesCount === 0 && isInputActive);
  if (!isVisible || (!showUI && !loading && !aiLoading)) return null;

  return (
    <div
      className="w-full bg-blue-50 dark:bg-slate-800 p-3 rounded-lg border border-blue-200 dark:border-slate-700 my-2 anim-fade-in shadow-sm relative z-20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-500 w-4 h-4" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Smart Recommendations</span>
          {/* Source Badge */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${source === 'builtin' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
            source === 'db_cache' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
              'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
            }`}>
            {source === 'builtin' ? 'Built-in' : source === 'db_cache' ? 'Cached' : 'AI-Generated'}
          </span>
        </div>
        
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-blue-100 dark:border-slate-700">
          {(['junior', 'senior'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSeniority(level)}
              className={`text-[10px] px-2 py-0.5 rounded capitalize ${seniority === level ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">Loading recommendations...</span>
        </div>
      )}

      {/* Controls - Only show for tech roles when not loading */}
      {!loading && isTechRole(title) && (
        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value as Specialization)}
            className="text-xs p-1 rounded border dark:bg-slate-900 dark:border-slate-600 outline-none"
          >
            <option value="general">General</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
          </select>

          <input
            type="text"
            placeholder="Tech (e.g. React)"
            className="text-xs p-1 rounded border dark:bg-slate-900 dark:border-slate-600 outline-none w-24"
            value={specialization === 'backend' ? techStack.backend_stack : techStack.frontend_stack}
            onChange={(e) => setTechStack(prev => ({
              ...prev,
              [specialization === 'backend' ? 'backend_stack' : 'frontend_stack']: e.target.value
            }))}
          />
        </div>
      )}

      {/* List Content */}
      {!loading && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {filteredRecommendations.map((bullet, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-gray-100 dark:border-slate-700 text-[11px] shadow-sm group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <p className="text-gray-700 dark:text-gray-300 italic">{bullet}</p>
              <button
                type="button"
                onClick={() => onAddBullet(bullet)}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 p-1.5 rounded flex-shrink-0"
              >
                <Plus size={14} />
              </button>
            </div>
          ))}

          {filteredRecommendations.length === 0 && !aiLoading && (
            <p className="text-[10px] text-gray-500 text-center py-4">No matching recommendations.</p>
          )}

          {!aiLoading && (
            <button
              type="button"
              onClick={() => fetchRecommendations(true)}
              className="w-full py-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center justify-center gap-1"
            >
              <Sparkles size={12} /> Load more smart recommendations
            </button>
          )}

          {aiLoading && (
            <div className="flex items-center justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-blue-500" /></div>
          )}

          {/* AI Inspection Box */}
          {inspectionTasks.length > 0 && (
            <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded border border-blue-100 dark:border-slate-700">
              <div className="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-wider">AI Analysis</div>
              <ul className="list-disc ml-4 text-[11px] space-y-1 text-gray-700 dark:text-gray-300">
                {inspectionTasks.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
              {inspectionNotes && <div className="mt-2 text-[10px] text-gray-500 italic">Note: {inspectionNotes}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendationUI;