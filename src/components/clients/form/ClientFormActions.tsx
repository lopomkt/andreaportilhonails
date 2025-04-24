
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface ClientFormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onDelete?: () => void;
  isEditing: boolean;
}

export function ClientFormActions({
  isSubmitting,
  onCancel,
  onDelete,
  isEditing
}: ClientFormActionsProps) {
  return (
    <div className="flex justify-between">
      {isEditing && onDelete ? (
        <Button 
          type="button"
          variant="destructive"
          onClick={onDelete}
          className="gap-1"
        >
          <Trash2 className="h-4 w-4" />
          Excluir Cliente
        </Button>
      ) : (
        <Button 
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      )}
      
      <div className="flex gap-2">
        {isEditing && (
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        )}
        <Button 
          type="submit"
          className="bg-nail-500 hover:bg-nail-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </div>
  );
}
