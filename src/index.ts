import { app } from './app';
import { env } from './config/env';
import { prisma } from './prisma';

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`SiNutre back rodando em http://localhost:${env.port}`);
});

async function shutdown(signal: string) {
  console.log(`[${signal}] encerrando o servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
