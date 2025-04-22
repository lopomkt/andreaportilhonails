
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const LoginScreen = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  useEffect(() => {
    const storedAccess = localStorage.getItem("acessoAndrea");
    if (storedAccess) {
      const lastAccess = new Date(storedAccess);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 48) {
        setIsAuthenticated(true);
        document.body.style.overflow = "auto";
      } else {
        localStorage.removeItem("acessoAndrea");
      }
    }
  }, []);

  const handleLogin = () => {
    if (password === "141226") {
      setIsAuthenticated(true);
      document.body.style.overflow = "auto";
      
      if (keepLoggedIn) {
        localStorage.setItem("acessoAndrea", new Date().toISOString());
      }
    } else {
      alert("Senha incorreta. Tente novamente.");
      setPassword("");
      document.getElementById("input-senha")?.focus();
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center z-50">
      <div 
        id="tela-login"
        className="w-full max-w-[320px] bg-white p-8 rounded-[24px] shadow-lg transition-opacity duration-400"
      >
        <h1
          id="titulo-login"
          className="text-center text-[20px] font-semibold text-[#333] font-sans"
        >
          Acesso Exclusivo | Andrea Portilho
        </h1>
        
        <Input
          id="input-senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={6}
          inputMode="numeric"
          placeholder="Digite a senha (6 dígitos)"
          className="h-[48px] mt-6 rounded-xl border-[#ccc] px-4"
        />
        
        <div className="flex items-center space-x-2 my-4">
          <Checkbox
            id="manter-logado"
            checked={keepLoggedIn}
            onCheckedChange={(checked) => setKeepLoggedIn(checked === true)}
          />
          <Label htmlFor="manter-logado">Manter logado</Label>
        </div>
        
        <button
          id="botao-entrar"
          onClick={handleLogin}
          className="w-full h-[48px] bg-[#F9C7D7] text-white font-semibold text-base rounded-xl mt-2 hover:bg-[#f0b5c7] transition-colors"
        >
          Entrar
        </button>
      </div>
    </div>
  );
};
