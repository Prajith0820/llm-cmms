import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import prisma from '../prisma';

const router = Router();

router.get('/work-orders', async (_req: Request, res: Response) => {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include: { asset: true, assignedTechnician: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=work_orders_report.pdf');
    doc.pipe(res);

    doc.fontSize(20).fillColor('#1a1a2e').text('FixByte CMMS — Work Orders Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    workOrders.forEach((wo, i) => {
      doc.fontSize(12).fillColor('#000').text(`${i + 1}. ${wo.workOrderNumber} — ${wo.title}`);
      doc.fontSize(9).fillColor('#555')
        .text(`   Asset: ${wo.asset.assetName}  |  Priority: ${wo.priority}  |  Status: ${wo.status}`)
        .text(`   Assigned to: ${wo.assignedTechnician?.fullName || 'Unassigned'}  |  Created: ${wo.createdAt.toLocaleDateString()}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.post('/monthly', async (_req: Request, res: Response) => {
  try {
    const [assets, workOrders, inventory] = await Promise.all([
      prisma.asset.count(),
      prisma.workOrder.findMany({ include: { asset: true } }),
      prisma.sparePart.findMany()
    ]);

    const openWOs      = workOrders.filter(w => w.status === 'OPEN').length;
    const completedWOs = workOrders.filter(w => w.status === 'COMPLETED').length;
    const lowStock     = inventory.filter(i => i.currentStock <= i.minimumStock).length;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=monthly_maintenance_report.pdf');
    doc.pipe(res);

    doc.fontSize(22).fillColor('#1a1a2e').text('FixByte CMMS', { align: 'center' });
    doc.fontSize(14).fillColor('#4a4a8a').text('Monthly Maintenance Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#888').text(`Report Date: ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor('#000').text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333')
      .text(`Total Assets:         ${assets}`)
      .text(`Total Work Orders:    ${workOrders.length}`)
      .text(`Open Work Orders:     ${openWOs}`)
      .text(`Completed This Month: ${completedWOs}`)
      .text(`Low Stock Items:      ${lowStock}`);

    doc.moveDown(1.5);
    doc.fontSize(14).fillColor('#000').text('Work Order Details', { underline: true });
    doc.moveDown(0.5);

    workOrders.slice(0, 15).forEach((wo, i) => {
      doc.fontSize(10).fillColor('#000').text(`${i + 1}. [${wo.status}] ${wo.workOrderNumber} — ${wo.title} (${wo.asset.assetName})`);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;
