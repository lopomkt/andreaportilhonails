
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard immediately
    navigate("/", { replace: true });
  }, [navigate]);

  // Loading state while redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nail-400 to-nail-700">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4 font-heading">Andrea Portilho</h1>
        <p className="text-xl mb-8">Nail Designer CRM</p>
        <div className="w-16 h-16 border-t-4 border-l-4 border-white rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

export default Index;
