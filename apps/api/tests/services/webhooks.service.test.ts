import { WebhooksService } from '../../src/modules/webhooks/webhooks.service.js';
import { WebhooksModel } from '../../src/modules/webhooks/webhooks.model.js';
import { config } from '../../src/config/env.js';

describe('WebhooksService - Unit Tests', () => {
  let webhooksService: WebhooksService;
  let mockModel: jest.Mocked<WebhooksModel>;

  beforeEach(() => {
    mockModel = {
      createDeployment: jest.fn().mockResolvedValue({ id: 'dep_1', status: 'pending' } as any),
      addLog: jest.fn().mockResolvedValue({ id: 1 } as any),
      updateDeploymentStatus: jest.fn(),
      findDeploymentById: jest.fn(),
      getDeployments: jest.fn(),
    } as any;

    webhooksService = new WebhooksService(mockModel);
  });

  describe('handleDeployWebhook()', () => {
    it('throws 401 Unauthorized when token is missing or incorrect', async () => {
      await expect(webhooksService.handleDeployWebhook()).rejects.toThrow('Unauthorized');
      await expect(webhooksService.handleDeployWebhook('invalid-token')).rejects.toThrow('Unauthorized');
    });

    it('creates deployment record and logs entry when valid token is provided', async () => {
      const result = await webhooksService.handleDeployWebhook(config.deployCiToken);

      expect(result.status).toBe('success');
      expect(result.deployment_id).toBeDefined();
      expect(result.message).toContain('initiated successfully');
      expect(mockModel.createDeployment).toHaveBeenCalled();
      expect(mockModel.addLog).toHaveBeenCalled();
    });
  });
});
