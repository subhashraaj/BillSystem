import { CSSProperties, forwardRef } from "react";

type InvoiceItem = {
    id: number;
    name: string;
    quantity: number;
    temp_rate: number;
};

type DuplicateTemplateProps = {
    invoice?: {
        invoice_number: string;
        invoice_date: string;
        customer_name: string;
        customer_city?: string;
        customer_phone?: string;
        items: InvoiceItem[];
        total_amount: number;
    };
};

const styles: Record<string, CSSProperties> = {
    invoice: {
        maxWidth: "900px",
        margin: "auto",
        padding: "25px",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#000",
    },
    title: {
        textAlign: "center",
        marginBottom: "5px",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"

    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "6px",
        marginTop: "10px"
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
        marginRight: "15px",
        height: "100px",
        width: "100px",

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
    },
    duplicate: {
        width: "4.5rem",
        height: "2rem",
        backgroundColor: "black",
        color: "white",
        padding: "5px",
        borderRadius: "4px",
    },
    contact:{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        
    }
};

const DuplicateTemplate = forwardRef<HTMLDivElement, DuplicateTemplateProps>(
    ({ invoice }, ref) => {
        return (
            <div ref={ref} style={styles.invoice}>
                <h2 style={styles.title}><strong>உ</strong></h2>
                <h2 style={styles.title}>அருள்மிகு ஐந்து விட்டு சுவாமி துணை</h2>
                <h2 style={styles.title}>Thirumani Traders</h2>

                <div style={styles.header} >
                    <p style={styles.duplicate} ><strong>Duplicate</strong></p>
                    <h2 style={styles.title}>Arrow Appalam</h2>
                    <p>{invoice?.invoice_date}</p>

                </div>
                {/* Top GST / Contact */}
                <div style={styles.row}>
                    {/* Company Details */}
                    <div>
                        <p><strong>GST:</strong> 123456789012345</p>
                        <p><strong>FSSAI:</strong> 5432109876543210</p>
                        <p><strong>HSN:</strong> 12345678</p>
                    </div>
                    <img style={styles.image} alt="omm image" src="https://media.istockphoto.com/id/1462596965/vector/hindu-religion-om-symbol-with-vel-in-tamil-language.jpg?s=612x612&w=0&k=20&c=8alWUjyZQqwwxalI5ubFZPs4fsodyurCdS85vaqAl70=" />
                </div>
                <div style={styles.line}></div>

                {/* Bill / To */}
                <div style={styles.billTable}>
                    <div>
                        <strong>To:</strong> {invoice?.customer_name}<br />
                        <strong>City:</strong> {invoice?.customer_city}<br />
                        <strong>Phone:</strong> {invoice?.customer_phone ?? "-"}<br />
                    </div>
                    <div>
                        <strong>Bill No:</strong> {invoice?.invoice_number} <br />

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
                        <strong>Thirumani Traders</strong><br />
                        61, Thulaisiram Street,<br />
                        Meenakshi Nagar, Villapuram,<br />
                        Madurai – 625012,Tamil Nadu.
                    </div>

                </div>


                {/* Signature */}
                <div style={styles.contact}>
                    Email: thirumanitradersarrow@gmail.com<br />
                    Contact: 9443929822
                    <div style={styles.sign}>
                        <strong>Thirumani Traders</strong><br /><br />
                        Authorised Sign
                    </div>
                </div>
            </div>
        );
    }
);

export default DuplicateTemplate;
