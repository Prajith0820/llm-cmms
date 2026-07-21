import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.inventoryTransaction.deleteMany();
  await prisma.maintenanceHistory.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.preventiveMaintenance.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();

  // ─── USERS ────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const techPassword  = await bcrypt.hash('tech123', 10);

  const admin = await prisma.user.create({
    data: { name: 'Admin User',    email: 'admin@fixbyte.com', password: adminPassword, role: 'ADMIN' }
  });

  const tech1 = await prisma.user.create({
    data: { name: 'Raj Sharma',    email: 'raj@fixbyte.com',   password: techPassword,  role: 'TECHNICIAN' }
  });

  const tech2 = await prisma.user.create({
    data: { name: 'Priya Nair',    email: 'priya@fixbyte.com', password: techPassword,  role: 'TECHNICIAN' }
  });

  const tech3 = await prisma.user.create({
    data: { name: 'Arjun Mehta',   email: 'arjun@fixbyte.com', password: techPassword,  role: 'TECHNICIAN' }
  });

  console.log('✅ Users created');

  // ─── ASSETS ───────────────────────────────────────────────────────────────
  const pump = await prisma.asset.create({
    data: {
      name: 'Centrifugal Pump CP-101',
      category: 'Pump',
      location: 'Plant A - Building 1',
      manufacturer: 'Grundfos',
      serialNumber: 'GF-CP-2021-001',
      status: 'OPERATIONAL',
      description: 'Main cooling water pump for Plant A.'
    }
  });

  const generator = await prisma.asset.create({
    data: {
      name: 'Diesel Generator DG-02',
      category: 'Generator',
      location: 'Plant A - Utility Block',
      manufacturer: 'Cummins',
      serialNumber: 'CUM-DG-2020-002',
      status: 'OPERATIONAL',
      description: 'Backup power generator, 500 kVA capacity.'
    }
  });

  const conveyor = await prisma.asset.create({
    data: {
      name: 'Belt Conveyor BC-305',
      category: 'Conveyor',
      location: 'Plant B - Production Line 3',
      manufacturer: 'Flexlink',
      serialNumber: 'FL-BC-2022-005',
      status: 'MAINTENANCE',
      description: 'Material handling conveyor belt for production line 3.'
    }
  });

  const compressor = await prisma.asset.create({
    data: {
      name: 'Air Compressor AC-201',
      category: 'Compressor',
      location: 'Plant B - Utility Room',
      manufacturer: 'Atlas Copco',
      serialNumber: 'AC-GA30-2021-003',
      status: 'OPERATIONAL',
      description: '30 kW rotary screw air compressor.'
    }
  });

  const hvac = await prisma.asset.create({
    data: {
      name: 'HVAC Unit HV-401',
      category: 'HVAC',
      location: 'Office Block - Rooftop',
      manufacturer: 'Carrier',
      serialNumber: 'CAR-AHU-2023-001',
      status: 'DOWN',
      description: 'Air handling unit for office block climate control.'
    }
  });

  console.log('✅ Assets created');

  // ─── WORK ORDERS ──────────────────────────────────────────────────────────
  await prisma.workOrder.createMany({
    data: [
      {
        woNumber: 'WO-2024-001',
        title: 'Pump bearing replacement',
        description: 'Replace worn bearings on Centrifugal Pump CP-101. Vibration levels exceeding threshold.',
        priority: 'HIGH',
        type: 'CORRECTIVE',
        status: 'IN_PROGRESS',
        assetId: pump.id,
        assignedToId: tech1.id
      },
      {
        woNumber: 'WO-2024-002',
        title: 'Generator oil change',
        description: 'Scheduled oil and filter change for DG-02 at 500-hour service interval.',
        priority: 'MEDIUM',
        type: 'PREVENTIVE',
        status: 'OPEN',
        assetId: generator.id,
        assignedToId: tech2.id
      },
      {
        woNumber: 'WO-2024-003',
        title: 'Conveyor belt tension adjustment',
        description: 'Belt slipping on BC-305. Adjust tensioner and inspect for wear.',
        priority: 'HIGH',
        type: 'CORRECTIVE',
        status: 'OPEN',
        assetId: conveyor.id,
        assignedToId: tech3.id
      },
      {
        woNumber: 'WO-2024-004',
        title: 'Compressor filter replacement',
        description: 'Air filter clogged. Replace inline filter cartridge on AC-201.',
        priority: 'MEDIUM',
        type: 'PREVENTIVE',
        status: 'COMPLETED',
        assetId: compressor.id,
        assignedToId: tech1.id,
        closedAt: new Date('2024-12-01')
      },
      {
        woNumber: 'WO-2024-005',
        title: 'HVAC unit inspection',
        description: 'HVAC unit not cooling effectively. Inspect refrigerant levels and coils.',
        priority: 'CRITICAL',
        type: 'CORRECTIVE',
        status: 'OPEN',
        assetId: hvac.id
      }
    ]
  });

  console.log('✅ Work Orders created');

  // ─── PREVENTIVE MAINTENANCE ───────────────────────────────────────────────
  await prisma.preventiveMaintenance.createMany({
    data: [
      {
        title: 'Pump Monthly Inspection',
        description: 'Check seals, bearings, and flow rate.',
        frequencyDays: 30,
        nextMaintenance: new Date('2025-01-15'),
        assetId: pump.id
      },
      {
        title: 'Generator 500-Hour Service',
        description: 'Full service including oil, filters, and battery check.',
        frequencyDays: 90,
        nextMaintenance: new Date('2025-02-01'),
        assetId: generator.id
      },
      {
        title: 'Compressor Annual Overhaul',
        description: 'Complete overhaul including valve replacement and oil analysis.',
        frequencyDays: 365,
        nextMaintenance: new Date('2025-06-01'),
        assetId: compressor.id
      }
    ]
  });

  console.log('✅ Preventive Maintenance schedules created');

  // ─── INVENTORY ────────────────────────────────────────────────────────────
  const bearing = await prisma.inventory.create({
    data: { name: 'Deep Groove Ball Bearing 6205', quantity: 24, unit: 'pcs', minQuantity: 5,
            description: 'SKF 6205 bearing for pump and motor applications.' }
  });

  await prisma.inventory.createMany({
    data: [
      { name: 'Oil Filter - Generator',   quantity: 8,  unit: 'pcs',    minQuantity: 2, description: 'Cummins generator oil filter.' },
      { name: 'Engine Oil 15W-40',        quantity: 50, unit: 'liters', minQuantity: 20, description: 'Mineral engine oil for generator.' },
      { name: 'V-Belt Type A60',          quantity: 12, unit: 'pcs',    minQuantity: 3, description: 'Replacement drive belt for conveyor.' },
      { name: 'Air Filter Cartridge',     quantity: 4,  unit: 'pcs',    minQuantity: 2, description: 'Atlas Copco inline air filter cartridge.' },
      { name: 'Hydraulic Seal Kit',       quantity: 6,  unit: 'sets',   minQuantity: 2, description: 'Seal kit for hydraulic cylinders.' },
      { name: 'Grease - Lithium EP2',     quantity: 10, unit: 'kg',     minQuantity: 3, description: 'General purpose lithium complex grease.' }
    ]
  });

  // Add a transaction for the bearing
  await prisma.inventoryTransaction.create({
    data: { inventoryId: bearing.id, quantity: 24, type: 'IN', notes: 'Initial stock entry' }
  });

  console.log('✅ Inventory created');

  // ─── MAINTENANCE HISTORY ──────────────────────────────────────────────────
  await prisma.maintenanceHistory.createMany({
    data: [
      { assetId: pump.id,       description: 'Replaced mechanical seal. Pump running normally post service.', performedBy: tech1.name, date: new Date('2024-10-15') },
      { assetId: generator.id,  description: 'Completed 250-hour service. Oil changed, filters replaced.', performedBy: tech2.name,   date: new Date('2024-11-01') },
      { assetId: compressor.id, description: 'Replaced air filter cartridge. Pressure restored to normal.', performedBy: tech1.name,  date: new Date('2024-12-01') }
    ]
  });

  console.log('✅ Maintenance History created');
  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('Login Credentials:');
  console.log('  Admin     → admin@fixbyte.com  / admin123');
  console.log('  Tech 1    → raj@fixbyte.com    / tech123');
  console.log('  Tech 2    → priya@fixbyte.com  / tech123');
  console.log('  Tech 3    → arjun@fixbyte.com  / tech123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
