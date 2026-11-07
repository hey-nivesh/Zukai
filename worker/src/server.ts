import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { startWorkerLoop, runWorkerPollCycle } from './worker.js';

const fastify = Fastify({
  logger: {
    level: 'info',
  },
});

fastify.register(cors, {
  origin: '*',
});

// Health check endpoint
fastify.get('/health', async () => {
  return {
    status: 'ok',
    service: 'zukai-ai-audio-worker',
    timestamp: new Date().toISOString(),
    config: {
      port: config.PORT,
      supabaseUrl: config.SUPABASE_URL,
      geminiConfigured: Boolean(config.GEMINI_API_KEY && config.GEMINI_API_KEY.length > 5),
    },
  };
});

// Manual trigger endpoint for testing or webhook triggers
fastify.post('/jobs/trigger', async () => {
  const processed = await runWorkerPollCycle();
  return {
    success: true,
    jobProcessed: processed,
    timestamp: new Date().toISOString(),
  };
});

async function main() {
  try {
    await fastify.listen({ port: config.PORT, host: config.HOST });
    console.log(`[Worker] Fastify server running on http://${config.HOST}:${config.PORT}`);
    startWorkerLoop();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();

