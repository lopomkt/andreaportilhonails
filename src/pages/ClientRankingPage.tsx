
import React from 'react';
import { ClientRanking } from '@/components/ClientRanking';

const ClientRankingPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold">Ranking de Clientes</h1>
      </div>
      
      <div className="w-full">
        <ClientRanking />
      </div>
    </div>
  );
};

export default ClientRankingPage;
