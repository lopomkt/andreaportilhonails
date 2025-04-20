
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const clients = [
  { id: 1, name: "João Silva", company: "Tech Solutions", email: "joao@tech.com" },
  { id: 2, name: "Maria Santos", company: "Design Co", email: "maria@design.co" },
  { id: 3, name: "Pedro Alves", company: "Marketing Pro", email: "pedro@mkt.com" },
];

const ClientList = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar clientes..." className="pl-8" />
        </div>
      </div>
      <Card>
        <div className="divide-y divide-gray-200">
          {clients.map((client) => (
            <div key={client.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.company}</p>
                </div>
                <p className="text-sm text-gray-500">{client.email}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ClientList;
