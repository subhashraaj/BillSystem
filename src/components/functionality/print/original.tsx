import { CSSProperties, forwardRef } from "react";

type InvoiceItem = {
    id: number;
    name: string;
    quantity: number;
    temp_rate: number;
};

type OriginalTemplateProps = {
    invoice?: {
        invoice_number: string;
        invoice_date: string;
        customer_name: string;
        customer_city?: string;
        items: InvoiceItem[];
        total_amount: number;
    };
};

const styles: Record<string, CSSProperties> = {
    invoice: {
        maxWidth: "900px",
        margin: "auto",
        border: "1px solid #000",
        padding: "25px",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#000",
    },
    title: {
        textAlign: "center",
        marginBottom: "5px",
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "6px",
    },
    box: {
        border: "1px solid #000",
        padding: "4px",
        width: "40%",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "6px",
        border: "1px solid black"
    },
    footer: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "20px",
    },
    sign: {
        textAlign: "right",
        marginTop: "40px",
    },
    company_details: {
        textAlign: "right",
        marginTop: "10px"

    },
    image: {
        marginTop: "10px",
        height: "75px",
        width: "75px",

    },
    line: {
        borderBottom: "1px solid black"
    },
    billTable: {
        marginTop: "10px",
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "6px",
    },
    cell: {
        border: "1px solid black"
    },
    table_text: {
        textAlign: "center"
    }
};

const OriginalTemplate = forwardRef<HTMLDivElement, OriginalTemplateProps>(
    ({ invoice }, ref) => {
        console.log(invoice)
        return (
            <div ref={ref} style={styles.invoice}>
                <h2 style={styles.title}>உ</h2>
                <h2 style={styles.title}>அருள்மிகு ஐந்து விட்டு சுவாமி துணை</h2>
                <h2 style={styles.title}>Original Invoice</h2>

                {/* Top GST / Contact */}
                <div style={styles.row}>
                    {/* Company Details */}
                    <div>
                        <strong>Thirumani Traders</strong><br />
                        61, Thulaisiram Street,Meenakshi Nagar,<br />
                        Villapuram,Madurai – 625012,Tamil Nadu.<br />
                        Email: thirumanitradersarrow@gmail.com<br />
                        Contact: 9443929822

                    </div>
                    <div>
                        <p><strong>GST: 123456789012345</strong></p>
                        <p><strong>FSSAI: 5432109876543210</strong></p>
                        <p><strong>HSN: 12345678</strong></p>
                        <img style={styles.image} alt="omm image" src="https://media.istockphoto.com/id/1462596965/vector/hindu-religion-om-symbol-with-vel-in-tamil-language.jpg?s=612x612&w=0&k=20&c=8alWUjyZQqwwxalI5ubFZPs4fsodyurCdS85vaqAl70=" />
                    </div>

                </div>
                <div style={styles.line}></div>

                {/* Bill / To */}
                <div style={styles.billTable}>
                    <div>
                        <strong>To:</strong> {invoice?.customer_name}<br />
                        <strong>City:</strong> {invoice?.customer_city}<br />
                        
                    </div>
                    <div>
                        <strong>Bill No:</strong> {invoice?.invoice_number} <br />
                        <strong>Date:</strong> {invoice?.invoice_date}
                    </div>
                </div>

                {/* Items Table */}
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.cell}>
                            <th style={styles.cell}>S.No</th>
                            <th style={styles.cell}>Description of Items</th>
                            <th style={styles.cell}>Quantity</th>
                            <th style={styles.cell}>Rate per</th>
                            <th style={styles.cell}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice?.items?.map((item: any, index) => (
                            <tr key={item.item_id}>
                                <td style={styles.table_text}>{index + 1}</td>
                                <td style={styles.table_text}>{item.item_name ?? "-"}</td>
                                <td style={styles.table_text}>{item.quantity ?? 0}</td>
                                <td style={styles.table_text}>₹{item.unit_price ?? 0}</td>
                                <td style={styles.table_text}>₹{item.total_price ?? 0}</td>
                            </tr>
                        ))}

                        <tr>
                            <td colSpan={4} style={styles.cell}>
                                <strong>Total</strong>
                            </td>
                            <td style={styles.cell}>
                                <strong>₹{invoice?.total_amount ?? 0}</strong>
                            </td>
                        </tr>
                    </tbody>

                </table>

                {/* Footer */}
                <div style={styles.footer}>
                    <div>
                        <strong>Bank Details</strong><br />
                        1. SBI<br />
                        2. Indian Bank
                    </div>
                    <div>
                        <strong>Gpay No:</strong>
                    </div>
                </div>

                {/* Signature */}
                <div style={styles.sign}>
                    <strong>Thirumani Traders</strong><br /><br />
                    Authorised Sign
                </div>
            </div>
        );
    }
);

export default OriginalTemplate;
