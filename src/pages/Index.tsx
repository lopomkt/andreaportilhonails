
import { Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import ClientList from "@/components/ClientList";

const Index = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientList />} />
          <Route path="/settings" element={<div className="p-6">Configurações</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default Index;
