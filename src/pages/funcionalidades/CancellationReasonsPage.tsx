
import React from 'react';
import { CancellationReason } from '@/types';

const CancellationReasonsPage: React.FC = () => {
  // This is just a stub implementation to fix the type error.
  // You can replace this with actual implementation when needed.
  const reasons: CancellationReason[] = [
    {
      id: '1',
      reason: 'Cliente desmarcou'
    },
    {
      id: '2',
      reason: 'Estabelecimento precisou remarcar'
    }
  ];

  return (
    <div>
      <h1>Motivos de Cancelamento</h1>
      <p>Esta página está em desenvolvimento.</p>
    </div>
  );
};

export default CancellationReasonsPage;
