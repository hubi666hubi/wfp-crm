import { jsPDF } from "jspdf";
import "jspdf-autotable";

export interface AuditData {
  companyName: string;
  driftPercentage: string;
  totalLeak: string;
  anomalies: { item: string; cost: string }[];
  recommendation: string;
}

export const generateMcKinseyAudit = (data: AuditData) => {
  const doc = new jsPDF();

  // Title & Header
  doc.setFontSize(22);
  doc.setTextColor(0, 51, 153); // McKinsey Blue
  doc.text("STRATEGIC OPERATIONAL AUDIT", 20, 30);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`PREPARED FOR: ${data.companyName}`, 20, 40);
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, 20, 45);
  doc.text("CLASSIFICATION: HIGH-TICKET // CONFIDENTIAL", 20, 50);

  // Executive Summary
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("1. Executive Summary", 20, 65);
  doc.setFontSize(10);
  const summary = `Technical analysis using Antigrawiti regression models has identified a critical conversion drift of ${data.driftPercentage} in current infrastructure. This performance lag accounts for a compounded financial leak estimated at ${data.totalLeak} per month.`;
  doc.text(doc.splitTextToSize(summary, 170), 20, 75);

  // Table of Losses
  (doc as any).autoTable({
    startY: 95,
    head: [['Anomalous Friction Point (The Waste)', 'Estimated Monthly Loss (PLN)']],
    body: data.anomalies.map(a => [a.item, a.cost]),
    theme: 'grid',
    headStyles: { fillStyle: [0, 51, 153] }
  });

  // Recommendation
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(14);
  doc.text("2. Strategic Recommendation", 20, finalY);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(data.recommendation, 170), 20, finalY + 10);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("WFP PRO ELITE LEGACY // ANOMALY DETECTION UNIT", 20, 280);

  return doc;
};
