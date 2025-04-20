
import { Home, Users, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-purple-600">SimpleCRM</h1>
      </div>
      <nav className="flex-1">
        <div className="px-4 space-y-2">
          <Link
            to="/"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg"
          >
            <Home className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link
            to="/clients"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg"
          >
            <Users className="w-5 h-5 mr-3" />
            Clientes
          </Link>
          <Link
            to="/settings"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg"
          >
            <Settings className="w-5 h-5 mr-3" />
            Configurações
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
