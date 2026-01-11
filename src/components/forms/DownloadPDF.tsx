import jsPDF from "jspdf";

export const handleDownloadPDF = async (invoiceId: string) => {
  try {
    const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}`);
    const { data: invoice } = await res.json();

    const doc = new jsPDF("p", "mm", "a4");

    let y = 10;

    // ================= HEADER =================
    doc.setFontSize(12);
    doc.text("ORIGINAL", 105, y, { align: "center" });
    y += 6;

    doc.setFontSize(16);
    doc.text("INVOICE", 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(10);
    doc.text("GST:", 10, y);
    doc.text("FSSAI:", 40, y);
    doc.text("HSN:", 75, y);

    doc.text("Contact:", 150, y);
    y += 8;

    // ================= BUSINESS =================
    doc.setFontSize(12);
    doc.text("Thirumani Traders", 105, y, { align: "center" });
    y += 6;

    doc.setFontSize(10);
    doc.text(
      "61, Thulasi Ram Street, Meenakshi Nagar,\nVillapuram, Madurai - 625012\nTamil Nadu",
      105,
      y,
      { align: "center" }
    );
    y += 18;

    // ================= BILL DETAILS =================
    doc.rect(10, y, 120, 18);
    doc.text("To:", 12, y + 6);
    doc.text(invoice.customer_name, 12, y + 12);

    doc.rect(130, y, 65, 18);
    doc.text(`Bill No: ${invoice.invoice_number}`, 132, y + 6);
    doc.text(`Date: ${formatDate(invoice.invoice_date)}`, 132, y + 12);
    y += 22;

    doc.text("GST:", 12, y);
    y += 6;

    // ================= TABLE =================
    doc.rect(10, y, 190, 8);
    doc.text("S.No", 12, y + 6);
    doc.text("Description of Items", 28, y + 6);
    doc.text("Qty", 110, y + 6);
    doc.text("Wt", 125, y + 6);
    doc.text("Rate", 145, y + 6);
    doc.text("Amount", 170, y + 6);

    y += 8;

    invoice.items.forEach((item: any, index: number) => {
      doc.rect(10, y, 190, 8);
      doc.text(String(index + 1), 12, y + 6);
      doc.text(item.item_name, 28, y + 6);
      doc.text(String(item.quantity), 110, y + 6);
      doc.text("-", 125, y + 6);
      doc.text(`₹${item.unit_price}`, 145, y + 6);
      doc.text(`₹${item.total_price}`, 170, y + 6);
      y += 8;
    });

    // ================= TOTAL =================
    doc.rect(10, y, 190, 10);
    doc.text("Total", 28, y + 7);
    doc.text(
      `₹${invoice.total_amount.toFixed(2)}`,
      170,
      y + 7
    );
    y += 14;

    // ================= BANK =================
    doc.rect(10, y, 95, 30);
    doc.text("Bank Details", 12, y + 6);
    doc.text("1. SBI", 12, y + 12);
    doc.text("2. Indian Bank", 12, y + 18);

    doc.rect(105, y, 95, 30);
    doc.text("GPay No:", 108, y + 6);
    y += 35;

    // ================= SIGN =================
    doc.text("For Thirumani Traders", 140, y);
    y += 10;
    doc.text("Authorised Sign", 150, y);

    doc.save(`invoice_${invoice.invoice_number}.pdf`);
  } catch (err) {
    console.error(err);
    alert("Failed to generate invoice PDF");
  }
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB");
