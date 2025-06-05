
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

interface ErrorDetails {
  message: string;
  code?: string;
  details?: any;
}

interface UseErrorHandlerReturn {
  handleError: (error: any, customMessage?: string) => void;
  handleSuccess: (message: string, description?: string) => void;
  handleWarning: (message: string, description?: string) => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const { toast } = useToast();

  const parseError = useCallback((error: any): ErrorDetails => {
    // Supabase errors
    if (error?.error?.message) {
      return {
        message: error.error.message,
        code: error.error.code,
        details: error.error.details
      };
    }

    // PostgreSQL errors
    if (error?.code && error?.message) {
      return {
        message: translatePostgresError(error.message, error.code),
        code: error.code,
        details: error.details
      };
    }

    // Standard errors
    if (error instanceof Error) {
      return {
        message: error.message,
        details: error.stack
      };
    }

    // String errors
    if (typeof error === 'string') {
      return { message: error };
    }

    // Unknown errors
    return {
      message: 'Ocorreu um erro inesperado. Tente novamente.',
      details: error
    };
  }, []);

  const translatePostgresError = useCallback((message: string, code: string): string => {
    const translations: Record<string, string> = {
      '23505': 'Este registro já existe no sistema.',
      '23503': 'Não é possível excluir este item pois está sendo usado em outro lugar.',
      '23502': 'Campo obrigatório não preenchido.',
      '22001': 'Texto muito longo para este campo.',
      '22003': 'Valor numérico fora do intervalo permitido.',
      '42601': 'Erro de sintaxe na consulta.',
      '42P01': 'Tabela não encontrada.',
      '42703': 'Coluna não encontrada.',
      'P0001': 'Erro de validação: dados inválidos.',
    };

    return translations[code] || message || 'Erro no banco de dados.';
  }, []);

  const handleError = useCallback((error: any, customMessage?: string) => {
    const errorDetails = parseError(error);
    
    console.error('Application Error:', {
      error,
      parsed: errorDetails,
      customMessage,
      timestamp: new Date().toISOString()
    });

    toast({
      title: customMessage || "Erro",
      description: errorDetails.message,
      variant: "destructive",
    });
  }, [parseError, toast]);

  const handleSuccess = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "default",
    });
  }, [toast]);

  const handleWarning = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "default",
    });
  }, [toast]);

  return {
    handleError,
    handleSuccess,
    handleWarning
  };
};
