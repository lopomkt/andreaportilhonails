
import { Client } from '@/types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { format, differenceInYears } from 'date-fns';

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const calculateAge = (birthdate: string | undefined) => {
    if (!birthdate) return null;
    return differenceInYears(new Date(), new Date(birthdate));
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] min-w-[150px]">Nome</TableHead>
            <TableHead className="min-w-[120px]">Telefone</TableHead>
            <TableHead className="min-w-[80px]">Idade</TableHead>
            <TableHead className="min-w-[140px]">Último Agendamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>
                {client.birthdate ? `${calculateAge(client.birthdate)} anos` : '-'}
              </TableCell>
              <TableCell>
                {client.lastAppointment 
                  ? format(new Date(client.lastAppointment), 'dd/MM/yyyy')
                  : '-'
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
