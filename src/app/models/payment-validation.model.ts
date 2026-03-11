export interface PaymentValidation {
    case_id: number;
    sender_id: string;
    bank_name: string;
    transaction_type: string;
    receipt_reference_number: string;
    receipt_date: string;
    receipt_time: string;
    receipt_amount: number;
    amount_sent: number;
    sender_name: string;
    raw_text: string;
    erp_status: string;
    harmony_state: string;
    erp_reference_number: string;
    payment_date: string;
    payment_time: string;
    erp_amount: number;
    client_document: string;
    erp_id: number;
    client_name: string;
    contract_id: number;
}
