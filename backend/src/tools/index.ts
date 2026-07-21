import prisma from '../prisma';

async function generateWONumber(): Promise<string> {
  const year  = new Date().getFullYear();
  const count = await prisma.workOrder.count();
  return `WO-${year}-${String(count + 1).padStart(3, '0')}`;
}

export const backendTools = {

  getAssets: async (args?: { search?: string }) => {
    return prisma.asset.findMany({
      where: args?.search ? {
        OR: [
          { assetName:     { contains: args.search, mode: 'insensitive' } },
          { category:      { contains: args.search, mode: 'insensitive' } },
          { serialNumber:  { contains: args.search, mode: 'insensitive' } },
          { location:      { contains: args.search, mode: 'insensitive' } },
        ]
      } : {},
      orderBy: { assetName: 'asc' }
    });
  },

  getAsset: async (args: { id: string }) => {
    let resolvedId = args.id;
    if (resolvedId && !resolvedId.match(/^[0-9a-f-]{36}$/i)) {
      const found = await prisma.asset.findFirst({
        where: { assetName: { contains: resolvedId, mode: 'insensitive' } }
      });
      if (!found) return { error: `No asset found with name "${resolvedId}"` };
      resolvedId = found.id;
    }
    return prisma.asset.findUnique({
      where: { id: resolvedId },
      include: {
        workOrders: { include: { assignedTechnician: true }, orderBy: { createdAt: 'desc' } },
        preventiveMaintenances: { orderBy: { nextDueDate: 'asc' } },
      }
    });
  },

  createAsset: async (args: {
    assetName: string;
    category: string;
    location?: string;
    manufacturer?: string;
    serialNumber?: string;
    description?: string;
  }) => {
    return prisma.asset.create({
      data: {
        ...args,
        status: 'ACTIVE',
        assetCode: `AST-${Date.now()}`,
        organizationId: await prisma.organization.findFirst().then(o => o!.id),
        createdById: await prisma.user.findFirst().then(u => u!.id),
      } as any
    });
  },

  updateAsset: async (args: {
    id: string;
    assetName?: string;
    category?: string;
    location?: string;
    manufacturer?: string;
    serialNumber?: string;
    description?: string;
    status?: 'ACTIVE' | 'UNDER_MAINTENANCE' | 'BREAKDOWN' | 'IDLE' | 'RETIRED';
  }) => {
    const { id, ...data } = args;
    return prisma.asset.update({ where: { id }, data });
  },

  deleteAsset: async (args: { id: string }) => {
    return prisma.asset.delete({ where: { id: args.id } });
  },

  getWorkOrders: async (args?: { assetId?: string; status?: string }) => {
    const validStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'ACCEPTED', 'REJECTED', 'REOPENED', 'UNDER_REVIEW'];
    const rawAssetId = args?.assetId && args.assetId.trim() ? args.assetId.trim() : undefined;
    const statusFilter = args?.status && validStatuses.includes(args.status) ? args.status : undefined;

    let resolvedAssetId = rawAssetId;
    if (resolvedAssetId && !resolvedAssetId.match(/^[0-9a-f-]{36}$/i)) {
      const found = await prisma.asset.findFirst({
        where: { assetName: { contains: resolvedAssetId, mode: 'insensitive' } }
      });
      resolvedAssetId = found?.id;
    }

    return prisma.workOrder.findMany({
      where: {
        ...(resolvedAssetId ? { assetId: resolvedAssetId } : {}),
        ...(statusFilter ? { status: statusFilter as any } : {})
      },
      include: { asset: true, assignedTechnician: true },
      orderBy: { createdAt: 'desc' }
    });
  },

  createWorkOrder: async (args: {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    workType?: 'REACTIVE' | 'PREVENTIVE' | 'BREAKDOWN' | 'INSPECTION';
    assetId: string;
    assignedTechnicianId?: string;
  }) => {
    const woNumber = await generateWONumber();
    return prisma.workOrder.create({
      data: {
        ...args,
        workOrderNumber: woNumber,
        status: 'OPEN',
        workType: args.workType || 'REACTIVE',
        organizationId: await prisma.organization.findFirst().then(o => o!.id),
        createdById: await prisma.user.findFirst().then(u => u!.id),
      } as any,
      include: { asset: true, assignedTechnician: true }
    });
  },

  assignTechnician: async (args: { workOrderId: string; technicianId: string }) => {
    return prisma.workOrder.update({
      where: { id: args.workOrderId },
      data: { assignedTechnicianId: args.technicianId, status: 'ASSIGNED' },
      include: { assignedTechnician: true }
    });
  },

  closeWorkOrder: async (args: { workOrderId: string; notes?: string }) => {
    return prisma.workOrder.update({
      where: { id: args.workOrderId },
      data: { status: 'COMPLETED', assetRestoredAt: new Date() }
    });
  },

  getPMSchedules: async (args?: { assetId?: string }) => {
    return prisma.preventiveMaintenance.findMany({
      where: args?.assetId ? { assetId: args.assetId } : {},
      include: { asset: true },
      orderBy: { nextDueDate: 'asc' }
    });
  },

  schedulePM: async (args: {
    title: string;
    description?: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
    startDate: string;
    assetId: string;
  }) => {
    const start = new Date(args.startDate);
    return prisma.preventiveMaintenance.create({
      data: {
        title:           args.title,
        description:     args.description,
        frequency:       args.frequency,
        startDate:       start,
        nextDueDate:     start,
        assetId:         args.assetId,
        organizationId:  await prisma.organization.findFirst().then(o => o!.id),
        createdById:     await prisma.user.findFirst().then(u => u!.id),
        pmNumber:        `PM-${Date.now()}`,
      } as any,
      include: { asset: true }
    });
  },

  getInventory: async () => {
    return prisma.sparePart.findMany({ orderBy: { partName: 'asc' } });
  },

  checkStock: async (args: { itemName: string }) => {
    return prisma.sparePart.findMany({
      where: { partName: { contains: args.itemName, mode: 'insensitive' } }
    });
  },

  addInventory: async (args: { inventoryId: string; quantity: number; notes?: string }) => {
    const item = await prisma.sparePart.findUnique({ where: { id: args.inventoryId } });
    if (!item) throw new Error('Spare part not found');

    const [updated] = await prisma.$transaction([
      prisma.sparePart.update({
        where: { id: args.inventoryId },
        data:  { currentStock: item.currentStock + args.quantity }
      }),
      prisma.stockTransaction.create({
        data: {
          sparePartId: args.inventoryId,
          quantity: args.quantity,
          transactionType: 'RECEIVE',
          notes: args.notes,
          performedById: await prisma.user.findFirst().then(u => u!.id),
          organizationId: item.organizationId,
          warehouseId: item.warehouseId || undefined,
        }
      })
    ]);
    return updated;
  },

  issueInventory: async (args: { inventoryId: string; quantity: number; notes?: string }) => {
    const item = await prisma.sparePart.findUnique({ where: { id: args.inventoryId } });
    if (!item) throw new Error('Spare part not found');
    if (item.currentStock < args.quantity) throw new Error(`Insufficient stock. Available: ${item.currentStock} ${item.unit}`);

    const [updated] = await prisma.$transaction([
      prisma.sparePart.update({
        where: { id: args.inventoryId },
        data:  { currentStock: item.currentStock - args.quantity }
      }),
      prisma.stockTransaction.create({
        data: {
          sparePartId: args.inventoryId,
          quantity: args.quantity,
          transactionType: 'ISSUE',
          notes: args.notes,
          performedById: await prisma.user.findFirst().then(u => u!.id),
          organizationId: item.organizationId,
          warehouseId: item.warehouseId || undefined,
        }
      })
    ]);
    return updated;
  },

  getTechnicians: async () => {
    return prisma.user.findMany({
      where:  { role: { name: 'TECHNICIAN' } },
      select: { id: true, fullName: true, email: true, role: { select: { name: true } } }
    });
  },

  generateReport: async (args: { type: 'monthly' | 'work-orders' }) => {
    const reportUrl = `/api/reports/${args.type}`;
    return {
      success: true,
      message: `${args.type === 'monthly' ? 'Monthly Maintenance' : 'Work Orders'} report is ready.`,
      downloadUrl: reportUrl
    };
  }
};

export type ToolName = keyof typeof backendTools;
