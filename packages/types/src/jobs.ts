import { IsNotEmpty, IsString, IsOptional, IsObject, IsNumber, Min } from 'class-validator';

export class EnqueueJobDto {
  @IsNotEmpty({ message: 'Job "type" (string) is required' })
  @IsString({ message: 'Job "type" (string) is required' })
  type!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  delay?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;
}

export interface SampleJobData {
  type: string;
  payload?: Record<string, any>;
}

export interface SampleJobResult {
  success: boolean;
  processedAt: string;
  message: string;
  [key: string]: any;
}

export interface JobStatusResponse {
  id: string;
  name: string;
  queue: string;
  state: string;
  data: SampleJobData;
  returnvalue: SampleJobResult | null;
  failedReason: string | null;
  timestamp: number;
  finishedOn: number | null;
  attemptsMade: number;
}

export interface QueueMetricsResponse {
  queue: string;
  metrics: {
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    waiting: number;
  };
}
