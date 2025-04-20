
import { supabase } from '@/integrations/supabase/client';
import { toast as toastFunc } from '@/hooks/use-toast';

export const verifySupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('configuracoes').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      
      // Use toast directly from the import
      toastFunc({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
      
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error verifying Supabase connection:', err);
    
    // Use toast directly from the import for the unexpected error
    toastFunc({
      title: "Erro de conexão",
      description: "Ocorreu um erro ao verificar a conexão com o servidor. Tente novamente.",
      variant: "destructive",
    });
    
    return false;
  }
};
