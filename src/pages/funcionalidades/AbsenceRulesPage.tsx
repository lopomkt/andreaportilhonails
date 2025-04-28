
import React from 'react';
import { AbsenceRule } from '@/types';

const AbsenceRulesPage: React.FC = () => {
  // This is just a stub implementation to fix the type error.
  // You can replace this with actual implementation when needed.
  const rules: AbsenceRule[] = [
    {
      id: '1',
      name: 'Regra padrão',
      description: 'Cliente deve avisar com 24h de antecedência',
      daysInAdvance: 1,
      active: true
    }
  ];

  return (
    <div>
      <h1>Regras de Ausência</h1>
      <p>Esta página está em desenvolvimento.</p>
    </div>
  );
};

export default AbsenceRulesPage;
