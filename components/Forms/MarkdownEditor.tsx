'use client';
import React, { useState, useRef } from 'react';
import { List, ListOrdered, Type } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Enter text...",
  className = ""
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertList = (listType: 'bullet' | 'numbered') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText;
    const listPrefix = listType === 'bullet' ? '• ' : '1. ';
    
    if (selectedText) {
      // Convert selected lines to list items
      const lines = selectedText.split('\n');
      const listItems = lines.map((line, index) => {
        if (line.trim()) {
          const prefix = listType === 'bullet' ? '• ' : `${index + 1}. `;
          return prefix + line.trim();
        }
        return line;
      }).join('\n');
      
      newText = value.substring(0, start) + listItems + value.substring(end);
    } else {
      // Insert new list item at cursor
      const beforeCursor = value.substring(0, start);
      const afterCursor = value.substring(end);
      
      // Check if we're at the beginning of a line or need a new line
      const needsNewLineBefore = beforeCursor.length > 0 && !beforeCursor.endsWith('\n');
      const prefix = needsNewLineBefore ? '\n' + listPrefix : listPrefix;
      
      newText = beforeCursor + prefix + afterCursor;
    }
    
    onChange(newText);
    
    // Set cursor position after the operation
    setTimeout(() => {
      const beforeCursor = value.substring(0, start);
      const newCursorPos = selectedText ? 
        start + (listType === 'bullet' ? 2 : 3) : 
        start + listPrefix.length + (beforeCursor.length > 0 && !beforeCursor.endsWith('\n') ? 1 : 0);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }> = ({ onClick, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className={`border border-gray-300 rounded-md ${className} ${isFocused ? 'ring-2 ring-blue-500 border-transparent' : ''}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200/50 p-2 flex items-center gap-1 bg-gray-50 rounded-t-md">
        <ToolbarButton
          onClick={() => insertList('bullet')}
          title="Bullet List"
        >
          <List size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => insertList('numbered')}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        
        <div className="w-px bg-gray-300 mx-2" />
        
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Type size={12} />
          <span>Click buttons to add bullet or numbered lists</span>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={4}
          className="w-full p-3 resize-none outline-none text-sm leading-relaxed rounded-b-md"
         
        />
      </div>

      {/* Preview area showing formatted text
      {value && (
        <div className="px-3 pb-2">
          <div className="text-xs text-gray-500 mb-1">Preview:</div>
          <div 
            className="text-sm text-gray-700 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: value
                .replace(/^• (.+)$/gm, '<li style="list-style-type: disc; margin-left: 20px;">$1</li>')
                .replace(/^(\d+)\. (.+)$/gm, '<li style="list-style-type: decimal; margin-left: 20px;">$2</li>')
                .replace(/\n/g, '<br>')
            }}
          />
        </div>
      )} */}
    </div>
  );
};

export default RichTextEditor;