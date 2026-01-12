import jsPDF from "jspdf";

type InvoiceCopy = "ORIGINAL" | "DUPLICATE";

export const generateInvoicePDF = async (
  invoiceId: string,
  copyType?: InvoiceCopy,
  printMode: boolean = false
) => {
  const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}`);
  const { data: invoice } = await res.json();

  const doc = new jsPDF("p", "mm", "a5");
  let y = 8;

  // ================= HEADER =================
  doc.setFontSize(13);
  doc.text("THIRUMANI TRADERS", 74, y, { align: "center" });
  y += 6;

  if (copyType) {
    doc.setFontSize(9);
    doc.text(`INVOICE ${copyType}`, 74, y, { align: "center" });
    y += 6;
  }

  doc.setFontSize(9);
  doc.text(`Invoice No: ${invoice.invoice_number}`, 10, y);
  doc.text(`Date: ${formatDate(invoice.invoice_date)}`, 105, y);
  y += 6;

  doc.text(`Customer: ${invoice.customer_name}`, 10, y);
  y += 6;

  // ================= ITEMS =================
  doc.setFontSize(9);
  doc.text("Items", 10, y);
  y += 4;

  invoice.items.forEach((item: any, index: number) => {
    doc.text(
      `${index + 1}. ${item.item_name}  x${item.quantity}  ₹${item.total_price}`,
      10,
      y
    );
    y += 4;
  });

  y += 4;

  // ================= TOTAL =================
  doc.setFontSize(10);
  doc.text(`Total Amount: ₹${invoice.total_amount}`, 10, y);

  // ================= ACTION =================
  if (printMode) {
    printPDF(doc);
  } else {
    doc.save(`Invoice_${invoice.invoice_number}.pdf`);
  }
};

// ================= PRINT (POPUP – NOT NEW TAB) =================
const printPDF = (doc: jsPDF) => {
  const blobUrl = doc.output("bloburl").toString();

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";

  iframe.src = blobUrl;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB");
