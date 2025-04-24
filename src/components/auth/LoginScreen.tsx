
import { useState, useEffect, FormEvent } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Animation } from "@/components/ui/animation";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const LoginScreen = () => {
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpired, setIsExpired] = useLocalStorage("acessoAndrea", "");
  const navigate = useNavigate();
  
  const validateLogin = async (event: FormEvent) => {
    event.preventDefault();
    
    if (!password) {
      toast.error("Por favor, digite uma senha");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Tentativa de login com senha");
      
      // Senha fixa para validação
      const correctPassword = "141226";
      
      if (password === correctPassword) {
        console.log("Senha correta, autenticando...");
        
        // Armazena data de login
        const now = new Date();
        const nowString = now.toISOString();
        
        // Usar diretamente o localStorage para evitar problemas com o hook
        localStorage.setItem("acessoAndrea", JSON.stringify(nowString));
        
        // Também tenta fazer login no Supabase (opcional, para manter consistência)
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: 'andrea@crm.com',
            password: correctPassword,
          });
          
          if (error) {
            console.log("Erro no login do Supabase, mas continuando com autenticação local:", error);
          }
        } catch (supabaseError) {
          console.log("Erro ao tentar login no Supabase, mas continuando com autenticação local:", supabaseError);
        }
        
        toast.success("Login realizado com sucesso!", {
          description: "Bem-vinda ao seu sistema de gerenciamento, Andrea!"
        });
        
        // Redireciona para o dashboard
        setTimeout(() => {
          console.log("Redirecionando para o dashboard...");
          setIsLoading(false);
          navigate("/", { replace: true });
        }, 800);
      } else {
        console.error("Senha incorreta");
        toast.error("Senha inválida. Tente novamente.", {
          description: "Por favor, verifique sua senha e tente novamente."
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro ao processar login:", error);
      toast.error("Erro ao processar login", {
        description: "Ocorreu um erro ao processar seu login. Tente novamente."
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if login is still valid and redirect if necessary
    try {
      const storedAccess = localStorage.getItem("acessoAndrea");
      if (storedAccess) {
        const lastAccess = new Date(JSON.parse(storedAccess));
        const now = new Date();
        const hoursDiff = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60);
        
        console.log("Verificando acesso armazenado:", { 
          lastAccess, 
          hoursDiff 
        });
        
        // If less than 48 hours have passed and user is already logged in, redirect to dashboard
        if (hoursDiff < 48) {
          console.log("Acesso válido, redirecionando para o dashboard");
          navigate("/", { replace: true });
        } else {
          console.log("Acesso expirado após 48 horas");
          localStorage.removeItem("acessoAndrea");
        }
      } else {
        console.log("Nenhum acesso armazenado encontrado");
      }
      
      // Também verifica a sessão do Supabase
      const checkSupabaseSession = async () => {
        const { data, error } = await supabase.auth.getSession();
        if (data?.session) {
          console.log("Sessão do Supabase encontrada");
        }
      };
      
      checkSupabaseSession();
    } catch (error) {
      console.error("Erro ao verificar estado de autenticação:", error);
      localStorage.removeItem("acessoAndrea"); // Reset em caso de erro
    }
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-nail-50/50 p-4 animate-fade-in">
      <Card className="w-full max-w-md p-8 bg-white shadow-premium">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <Logo size="lg" className="text-nail-600" />
            <h1 className="text-2xl font-bold text-center">Sistema de Gerenciamento</h1>
            <p className="text-muted-foreground text-center text-sm">
              Acesse sua conta para gerenciar seus agendamentos e clientes.
            </p>
          </div>
          
          <form onSubmit={validateLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-center w-full block">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="rememberMe" 
                checked={rememberMe}
                onCheckedChange={(checked) => {
                  if (typeof checked === 'boolean') setRememberMe(checked);
                }}
                disabled={isLoading}
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                Manter Logado
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-nail-500 hover:bg-nail-600"
              disabled={!password || isLoading}
            >
              {isLoading ? (
                <>
                  <Animation className="mr-2 h-4 w-4" />
                  Entrando...
                </>
              ) : "Entrar"}
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Nail Designer CRM - Andrea Portilho
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
