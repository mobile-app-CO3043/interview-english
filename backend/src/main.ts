import 'dotenv/config';
import { createApp } from './app';

async function bootstrap() {
  const app = await createApp();
  const port = Number(process.env.PORT || 3100);
  await app.listen(port, '0.0.0.0');
  console.log(`Swagger Docs: http://localhost:${port}/docs`);
}

void bootstrap().catch(error => { console.error(error); process.exitCode = 1; });
