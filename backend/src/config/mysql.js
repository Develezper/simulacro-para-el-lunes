import { env } from './env.js';

let mysqlPoolPromise;

async function getMySQLPool() {
  if (!mysqlPoolPromise) {
    mysqlPoolPromise = (async () => {
      let mysql;

      try {
        const mysqlModule = await import('mysql2/promise');
        mysql = mysqlModule.default ?? mysqlModule;
      } catch (error) {
        if (error?.code === 'ERR_MODULE_NOT_FOUND') {
          const dependencyError = new Error('Dependencia mysql2 no instalada. Ejecuta: npm install mysql2');
          dependencyError.statusCode = 500;
          throw dependencyError;
        }

        throw error;
      }

      return mysql.createPool({
        user: env.mysqlUser,
        password: env.mysqlPassword,
        database: env.mysqlDatabase,
        connectionLimit: env.mysqlConnectionLimit,
        ...(env.mysqlSocket
          ? { socketPath: env.mysqlSocket }
          : { host: env.mysqlHost, port: env.mysqlPort }),
        decimalNumbers: true,
        namedPlaceholders: false
      });
    })();
  }

  return mysqlPoolPromise;
}

async function executeQuery(sql, params = []) {
  const pool = await getMySQLPool();
  const [result] = await pool.execute(sql, params);
  return result;
}

export { executeQuery, getMySQLPool };
