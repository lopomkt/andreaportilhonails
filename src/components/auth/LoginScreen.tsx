
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
    setIsLoading(true);
    
    console.log("Tentativa de login com senha:", password);
    
    try {
      // Senha fixa para validação
      const correctPassword = "141226";
      
      if (password === correctPassword) {
        console.log("Senha correta, autenticando...");
        
        const now = new Date();
        setIsExpired(now.toISOString());
        
        toast.success("Login realizado com sucesso!", {
          description: "Bem-vinda ao seu sistema de gerenciamento, Andrea!"
        });
        
        // Adicionar um pequeno delay para a toast aparecer antes da navegação
        setTimeout(() => {
          console.log("Redirecionando para o dashboard...");
          navigate("/", { replace: true });
        }, 500);
      } else {
        console.error("Senha incorreta:", password);
        setIsLoading(false);
        toast.error("Senha inválida. Tente novamente.", {
          description: "Por favor, verifique sua senha e tente novamente."
        });
      }
    } catch (error) {
      console.error("Erro ao processar login:", error);
      setIsLoading(false);
      toast.error("Erro ao processar login", {
        description: "Ocorreu um erro ao processar seu login. Tente novamente."
      });
    }
  };

  useEffect(() => {
    // Check if login is still valid and redirect if necessary
    try {
      const storedAccess = localStorage.getItem("acessoAndrea");
      if (storedAccess) {
        const lastAccess = new Date(storedAccess);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60);
        
        console.log("Verificando acesso armazenado:", { 
          lastAccess: lastAccess.toISOString(), 
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
    } catch (error) {
      console.error("Erro ao verificar estado de autenticação:", error);
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
              Nail Designer CRM v1.0
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
