import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`[server] running on http://localhost:${env.port}${env.apiPrefix}`);
});
