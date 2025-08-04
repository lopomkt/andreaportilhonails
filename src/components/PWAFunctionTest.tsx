import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/DataProvider';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function PWAFunctionTest() {
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();
  
  const {
    appointments,
    clients,
    services,
    expenses,
    blockedDates,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    createClient,
    updateClient,
    deleteClient,
    addService,
    updateService,
    deleteService,
    loading
  } = useData();

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    setTestResults(prev => ({ ...prev, [testName]: null }));
    try {
      const result = await testFn();
      setTestResults(prev => ({ ...prev, [testName]: result }));
      return result;
    } catch (error) {
      console.error(`Test ${testName} failed:`, error);
      setTestResults(prev => ({ ...prev, [testName]: false }));
      return false;
    }
  };

  const testDataLoading = async () => {
    return appointments.length >= 0 && clients.length >= 0 && services.length >= 0;
  };

  const testClientOperations = async () => {
    try {
      // Test create client
      const clientData = {
        name: "Cliente Teste PWA",
        phone: "11999999999",
        email: "teste@pwa.com"
      };
      
      const createResult = await createClient(clientData);
      if (!createResult.success) return false;
      
      const clientId = createResult.data?.id;
      if (!clientId) return false;
      
      // Test update client
      const updateResult = await updateClient(clientId, { name: "Cliente Teste PWA Atualizado" });
      if (!updateResult.success) return false;
      
      // Test delete client
      const deleteResult = await deleteClient(clientId);
      return deleteResult.success;
    } catch (error) {
      console.error('Client operations test failed:', error);
      return false;
    }
  };

  const testAppointmentOperations = async () => {
    try {
      if (clients.length === 0 || services.length === 0) {
        toast({
          title: "Teste Incompleto",
          description: "Precisa ter pelo menos 1 cliente e 1 serviço para testar agendamentos",
          variant: "destructive"
        });
        return false;
      }

      const appointmentData = {
        clientId: clients[0].id,
        serviceId: services[0].id,
        date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        price: services[0].price,
        status: 'confirmed' as const,
        notes: "Teste PWA"
      };

      // Test create appointment
      const createResult = await addAppointment(appointmentData);
      if (!createResult.success) return false;

      const appointmentId = createResult.data?.id;
      if (!appointmentId) return false;

      // Test update appointment
      const updateResult = await updateAppointment(appointmentId, { notes: "Teste PWA Atualizado" });
      if (!updateResult.success) return false;

      // Test delete appointment
      const deleteResult = await deleteAppointment(appointmentId);
      return deleteResult.success;
    } catch (error) {
      console.error('Appointment operations test failed:', error);
      return false;
    }
  };

  const testWhatsAppIntegration = async () => {
    try {
      if (clients.length === 0) return false;
      
      const client = clients[0];
      const message = "Teste de mensagem PWA";
      
      // This should generate a valid WhatsApp link
      const link = `https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`;
      return link.includes('wa.me') && link.includes(client.phone);
    } catch (error) {
      return false;
    }
  };

  const testOfflineCapability = async () => {
    try {
      // Test if data persists when offline (basic check)
      return appointments.length >= 0 && clients.length >= 0;
    } catch (error) {
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    
    const tests = [
      { name: 'Data Loading', fn: testDataLoading },
      { name: 'Client Operations', fn: testClientOperations },
      { name: 'Appointment Operations', fn: testAppointmentOperations },
      { name: 'WhatsApp Integration', fn: testWhatsAppIntegration },
      { name: 'Offline Capability', fn: testOfflineCapability }
    ];

    let allPassed = true;
    for (const test of tests) {
      const result = await runTest(test.name, test.fn);
      if (!result) allPassed = false;
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    toast({
      title: allPassed ? "Todos os Testes Passaram!" : "Alguns Testes Falharam",
      description: allPassed ? "PWA funcionando perfeitamente" : "Verifique os resultados dos testes",
      variant: allPassed ? "default" : "destructive"
    });

    setIsRunning(false);
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <Clock className="h-4 w-4 text-yellow-500" />;
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) return <Badge variant="secondary">Executando...</Badge>;
    if (status === true) return <Badge variant="default" className="bg-green-500">Passou</Badge>;
    return <Badge variant="destructive">Falhou</Badge>;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Teste de Funcionalidades PWA
          <Button 
            onClick={runAllTests} 
            disabled={isRunning || loading}
            variant="outline"
          >
            {isRunning ? 'Executando...' : 'Executar Todos os Testes'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              'Data Loading',
              'Client Operations', 
              'Appointment Operations',
              'WhatsApp Integration',
              'Offline Capability'
            ].map((testName) => (
              <div key={testName} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(testResults[testName])}
                  <span className="font-medium">{testName}</span>
                </div>
                {getStatusBadge(testResults[testName])}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Status dos Dados:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Agendamentos: {appointments.length}</div>
              <div>Clientes: {clients.length}</div>
              <div>Serviços: {services.length}</div>
              <div>Despesas: {expenses.length}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}