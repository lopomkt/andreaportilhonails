
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Verify the connection to Supabase by making a simple query
 * @returns boolean indicating if the connection was successful
 */
export const verifySupabaseConnection = async (): Promise<boolean> => {
  try {
    // Test the connection by fetching a single record from the configurations table
    const { data, error } = await supabase
      .from('configuracoes')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error("Supabase connection error:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao banco de dados. Verifique sua conexão com a internet.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Unexpected error verifying Supabase connection:", err);
    toast({
      title: "Erro de conexão",
      description: "Ocorreu um erro ao verificar a conexão com o banco de dados.",
      variant: "destructive",
    });
    return false;
  }
};
