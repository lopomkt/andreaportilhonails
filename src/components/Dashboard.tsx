
import { Card } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-700">Total de Clientes</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">12</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-gray-700">Negócios Ativos</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">5</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-gray-700">Vendas do Mês</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">R$ 25.000</p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
