"use client"
import React from 'react';
import Button from '@/components/Ui/Button';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

export default function SectionRegenerateButton({ onClick, disabled, loading, label = 'Regenerate' }: Props) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="small"
      onClick={onClick}
      disabled={disabled || loading}
      className="whitespace-nowrap"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
      {loading ? 'Generating...' : label}
    </Button>
  );
}
