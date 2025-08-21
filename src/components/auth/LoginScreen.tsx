
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Animation } from "@/components/ui/animation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const validateLogin = async (event: FormEvent) => {
    event.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor, preencha email e senha");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        toast.error("Erro no login", {
          description: error.message
        });
        return;
      }
      
      toast.success("Login realizado com sucesso!", {
        description: "Bem-vinda ao seu sistema de gerenciamento!"
      });
      
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Erro ao processar login:", error);
      toast.error("Erro ao processar login", {
        description: "Ocorreu um erro ao processar seu login. Tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  
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
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            
            <Button 
              type="submit" 
              className="w-full bg-nail-500 hover:bg-nail-600"
              disabled={!email || !password || isLoading}
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
