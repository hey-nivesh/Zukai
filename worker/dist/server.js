import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { startWorkerLoop, stopWorker } from './worker.js';
import { logger } from './logger.js';
import { supabaseAdmin } from './supabase/client.js';
const fastify = Fastify({
    loggerInstance: logger,
});
await fastify.register(cors, {
    origin: '*',
});
// GET /healthz: Basic liveness check
fastify.get('/healthz', async () => {
    return {
        status: 'ok',
        service: 'zukai-worker',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    };
});
// GET /readyz: Deep readiness check (verifies Supabase database connection)
fastify.get('/readyz', async (_request, reply) => {
    try {
        const { error } = await supabaseAdmin.from('plans').select('tier').limit(1);
        if (error) {
            reply.status(503);
            return {
                status: 'unready',
                error: 'Database connection check failed',
            };
        }
        return {
            status: 'ready',
            database: 'connected',
            geminiConfigured: Boolean(config.GEMINI_API_KEY && config.GEMINI_API_KEY.length > 5),
        };
    }
    catch (err) {
        reply.status(503);
        return {
            status: 'unready',
            error: err instanceof Error ? err.message : String(err),
        };
    }
});
// Graceful shutdown handling
let isShuttingDown = false;
async function gracefulShutdown(signal) {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    logger.info({ signal }, 'Received shutdown signal, initiating graceful stop...');
    try {
        await stopWorker();
        await fastify.close();
        logger.info('Fastify server closed cleanly');
        process.exit(0);
    }
    catch (err) {
        logger.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
    }
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
async function main() {
    try {
        await fastify.listen({ port: config.PORT, host: config.HOST });
        logger.info(`Worker listening on http://${config.HOST}:${config.PORT}`);
        // Start background queue polling loop
        startWorkerLoop();
    }
    catch (err) {
        logger.error({ err }, 'Failed to start Fastify worker');
        process.exit(1);
    }
}
main();
