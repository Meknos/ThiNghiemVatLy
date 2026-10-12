import { z } from 'zod';
import { dispatchContextToTemplate } from '../src/ai/dispatcher';

export const AiResponseSchema = z.object({
  status: z.enum(['success', 'unsupported']),
  templateId: z.string(),
  params: z.record(z.string(), z.number()).default({}),
  asks: z.array(z.string()).default([]),
  summary: z.string(),
  suggestedTemplateId: z.string().optional()
});

export type AiResponse = z.infer<typeof AiResponseSchema>;

export interface AiProvider {
  extractExperiment(prompt: string): Promise<AiResponse>;
}

export class MockAiProvider implements AiProvider {
  async extractExperiment(prompt: string): Promise<AiResponse> {
    const dispatch = dispatchContextToTemplate(prompt);

    if (dispatch.confidence < 0.6) {
      return {
        status: 'unsupported',
        templateId: '',
        params: {},
        asks: [],
        summary: `Hệ thống chưa hỗ trợ mẫu riêng cho yêu cầu: "${prompt}".`,
        suggestedTemplateId: 'luc-va-chuyen-dong'
      };
    }

    return {
      status: 'success',
      templateId: dispatch.templateId,
      params: dispatch.extractedParams ?? {},
      asks: ['Xác định các đại lượng vật lý theo SGK'],
      summary: dispatch.message
    };
  }
}

export function getAiProvider(): AiProvider {
  // If an API key is present in env, can route to real LLM, otherwise use mock/heuristic
  return new MockAiProvider();
}
