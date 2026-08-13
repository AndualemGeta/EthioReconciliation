import { OdooSyncLog } from '../../types';
import { OdooErrorLogService } from './OdooErrorLogService';

export interface OdooWebhookPayload {
  event: 'account.move.posted' | 'account.payment.created' | 'pos.order.sync';
  company_id: number;
  res_id: number;
  odoo_reference: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export class OdooWebhookHandler {
  /**
   * Processes inbound webhook event from Odoo
   */
  static processWebhook(payload: OdooWebhookPayload): {
    received: boolean;
    status: string;
    details: string;
  } {
    const log: OdooSyncLog = {
      id: `WH-${Date.now()}`,
      tenant_id: 'TNT-GLOBAL-01',
      group_id: 'GRP-AFRICA-01',
      legal_entity_id: 'LE-ETH-01',
      entityType: payload.event === 'pos.order.sync' ? 'POS_SALES' : 'PAYMENTS',
      direction: 'INBOUND',
      recordsProcessed: 1,
      status: 'SUCCESS',
      details: `Received Odoo Webhook: ${payload.event} for ${payload.odoo_reference} (${payload.currency} ${payload.amount}).`,
      timestampUtc: new Date().toISOString(),
    };

    OdooErrorLogService.logSync(log);

    return {
      received: true,
      status: 'PROCESSED',
      details: `Event ${payload.event} processed and linked to Odoo Ref ${payload.odoo_reference}`,
    };
  }
}
