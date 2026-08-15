export interface DeployWebhookQuery {
  token: string;
}

export interface DeployWebhookResponse {
  status: 'success' | 'error';
  message: string;
  deployment_id?: string;
  timestamp?: string;
}
