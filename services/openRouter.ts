import { OpenRouter } from '@openrouter/sdk';

const openRouter = new OpenRouter({
  apiKey: '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'
});

const response = await openRouter.chat.send({
  model: 'google/gemma-3-12b-it:free',
  messages: [
    {
      role: 'user',
      content: 'What is the meaning of life?',
    },
  ],
  stream: false,
});

console.log(response.choices[0].message.content);
