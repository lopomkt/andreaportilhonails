
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ClientNotesProps {
  notes: string;
  setNotes: (notes: string) => void;
}

export function ClientNotes({
  notes,
  setNotes
}: ClientNotesProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Observações</Label>
      <Textarea 
        id="notes"
        placeholder="Adicione informações importantes sobre o cliente..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
      />
    </div>
  );
}
