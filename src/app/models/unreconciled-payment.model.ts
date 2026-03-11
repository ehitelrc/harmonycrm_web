export interface UnreconciledPayment {
    id_record: number;
    erp_id: number;
    erp_status: string;
    harmony_state: string;
    bank_name: string;
    reference_number: string;
    payment_date: string;
    payment_time: string;
    erp_amount: number;
    client_document: string;
    client_name: string;
    contract_id: number;
    receipt_type: string;
    created_at: string;
}
