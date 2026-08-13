import { OdooAccountMapping, ManualAdjustment, NormalizedTransaction } from '../../types';

export class OdooDataMapper {
  private static defaultMappings: Map<string, OdooAccountMapping> = new Map([
    [
      'SHORTAGE_WRITE_OFF',
      {
        id: 'MAP-01',
        legalEntityId: 'LE-ETH-01',
        reconCategory: 'SHORTAGE_WRITE_OFF',
        odooAccountId: 'ACC-600500',
        odooAccountCode: '600500',
        odooAccountName: 'Cash Shortages Expense',
        odooJournalId: 'JOURNAL-MISC',
        analyticAccountId: 'ANALYTIC-ADD-01',
      },
    ],
    [
      'COMMISSION_CORRECTION',
      {
        id: 'MAP-02',
        legalEntityId: 'LE-ETH-01',
        reconCategory: 'COMMISSION_CORRECTION',
        odooAccountId: 'ACC-400200',
        odooAccountCode: '400200',
        odooAccountName: 'Commission Income / Revenue Adjustment',
        odooJournalId: 'JOURNAL-COMMISSION',
        analyticAccountId: 'ANALYTIC-ADD-01',
      },
    ],
    [
      'BANK_FEE',
      {
        id: 'MAP-03',
        legalEntityId: 'LE-ETH-01',
        reconCategory: 'BANK_FEE',
        odooAccountId: 'ACC-600100',
        odooAccountCode: '600100',
        odooAccountName: 'Bank Charges & Commission Expense',
        odooJournalId: 'JOURNAL-BANK',
      },
    ],
    [
      'FLOAT_TRANSFER',
      {
        id: 'MAP-04',
        legalEntityId: 'LE-ETH-01',
        reconCategory: 'FLOAT_TRANSFER',
        odooAccountId: 'ACC-101200',
        odooAccountCode: '101200',
        odooAccountName: 'Agent Mobile Money Float Transit',
        odooJournalId: 'JOURNAL-CASH',
      },
    ],
    [
      'OTHER',
      {
        id: 'MAP-05',
        legalEntityId: 'LE-ETH-01',
        reconCategory: 'OTHER',
        odooAccountId: 'ACC-699900',
        odooAccountCode: '699900',
        odooAccountName: 'Miscellaneous Operational Adjustments',
        odooJournalId: 'JOURNAL-MISC',
      },
    ],
  ]);

  /**
   * Returns current mapping for a category
   */
  static getMappingForCategory(category: string, legalEntityId: string): OdooAccountMapping {
    const found = OdooDataMapper.defaultMappings.get(category);
    if (found) return { ...found, legalEntityId };

    return {
      id: `MAP-${Date.now()}`,
      legalEntityId,
      reconCategory: category,
      odooAccountId: 'ACC-699900',
      odooAccountCode: '699900',
      odooAccountName: 'Miscellaneous Adjustments',
      odooJournalId: 'JOURNAL-MISC',
    };
  }

  /**
   * Formats a ReconFlow adjustment into Odoo Journal Entry Payload (`account.move`)
   */
  static mapAdjustmentToOdooJournalEntry(
    adjustment: ManualAdjustment,
    mapping: OdooAccountMapping
  ) {
    const isCredit = adjustment.adjustmentType === 'CREDIT';
    const amount = Math.abs(adjustment.amount);

    return {
      model: 'account.move',
      method: 'create',
      args: [
        {
          journal_id: mapping.odooJournalId,
          date: adjustment.createdAt.split('T')[0],
          ref: `ReconFlow Adj Ref: ${adjustment.id} - ${adjustment.category}`,
          narration: `ReconFlow Approved Adjustment: ${adjustment.reason}. Created by ${adjustment.createdBy}, Approved by ${adjustment.approvedBy}`,
          currency_id: adjustment.transaction_currency || 'ETB',
          company_id: adjustment.legal_entity_id,
          line_ids: [
            // Debit line
            [
              0,
              0,
              {
                account_id: isCredit ? mapping.odooAccountCode : '101000', // Cash or Expense
                debit: amount,
                credit: 0,
                name: `${adjustment.category} - ${adjustment.reason}`,
                analytic_distribution: mapping.analyticAccountId
                  ? { [mapping.analyticAccountId]: 100 }
                  : undefined,
              },
            ],
            // Credit line
            [
              0,
              0,
              {
                account_id: isCredit ? '101000' : mapping.odooAccountCode,
                debit: 0,
                credit: amount,
                name: `${adjustment.category} - Balancing Line`,
              },
            ],
          ],
        },
      ],
      kwargs: {},
    };
  }
}
