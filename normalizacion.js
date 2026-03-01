const csvdata = [
  [transactions_id, transactions_date]
]
const transactions = [];
const clients = [];
const invoices = [];
const platforms = [];

csvdata.forEach((row, i) => {
  if (i === 0) return;

  const transaction = {
    id: row[0],          // ID de la Transacción
    date: row[1],        // Fecha y Hora
    amount: row[2],      // Monto de la Transacción
    status: row[3],      // Estado
    type: row[4],        // Tipo
    amount_paid: row[14], // Monto Pagado en esta TX
    client_id: row[6],    // FK a Clientes
    invoice_num: row[11], // FK a Facturas
    platform_name: row[10] // FK a Plataformas
  };

  const client = {
    id: row[6],          // Número de Identificación
    name: row[5],        // Nombre del Cliente
    address: row[7],     // Dirección
    phone: row[8],       // Teléfono
    email: row[9]        // Correo Electrónico
  };

  const invoice = {
    number: row[11],     // Número de Factura
    period: row[12],     // Periodo de Facturación
    total_amount: row[13] // Monto Facturado
  };

  const platform = {
    name: row[10]        // Plataforma Utilizada
  };

  transactions.push(transaction);

  if (clients.findIndex(c => c.id === client.id) === -1) {
    clients.push(client);
  }
  if (invoices.findIndex(inv => inv.number === invoice.number) === -1) {
    invoices.push(invoice);
  }
  if (platforms.findIndex(p => p.name === platform.name) === -1) {
    platforms.push(platform);
  }
});
