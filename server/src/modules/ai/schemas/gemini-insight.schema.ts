import Joi from 'joi'

// Structured output controls the model's format; runtime validation also protects consumers.
export const geminiInsightsValidator = Joi.object({
  executiveSummary: Joi.string().trim().min(1).max(2000).required(),
  restockInsights: Joi.array()
    .items(
      Joi.object({
        sku: Joi.string().required(),
        reasoning: Joi.string().trim().min(1).max(1000).required(),
      }),
    )
    .max(1000)
    .required(),
  topPerformerInsights: Joi.array()
    .items(
      Joi.object({
        sku: Joi.string().required(),
        insight: Joi.string().trim().min(1).max(1000).required(),
      }),
    )
    .max(5)
    .required(),
  actionableRecommendations: Joi.array()
    .items(Joi.string().trim().min(1).max(1000))
    .min(1)
    .max(10)
    .required(),
})

export const geminiResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'executiveSummary',
    'restockInsights',
    'topPerformerInsights',
    'actionableRecommendations',
  ],
  properties: {
    executiveSummary: { type: 'string' },
    restockInsights: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['sku', 'reasoning'],
        properties: { sku: { type: 'string' }, reasoning: { type: 'string' } },
      },
    },
    topPerformerInsights: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['sku', 'insight'],
        properties: { sku: { type: 'string' }, insight: { type: 'string' } },
      },
    },
    actionableRecommendations: { type: 'array', items: { type: 'string' } },
  },
}
