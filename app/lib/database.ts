// lib/database.ts
import mysql from 'mysql2/promise';

// Configuration avec vos paramètres spécifiques
const dbConfig = {
  host: process.env.DB_HOST || 'immolion-scolarion.f.aivencloud.com',
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'defaultdb',
  port: parseInt(process.env.DB_PORT || '23990'),
  
  // Configuration du pool - robuste
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  maxIdle: 5,
  idleTimeout: 30000,
  
  // Timeouts pour éviter les ETIMEDOUT
  connectTimeout: 20000,
  acquireTimeout: 20000,
  
  // Keep alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  charset: 'utf8mb4',
  timezone: '+00:00',
  
  // SSL
  ssl: {
    rejectUnauthorized: false
  }
};

let pool: mysql.Pool;

try {
  pool = mysql.createPool(dbConfig);
  
  // Test immédiat de la connexion
  pool.getConnection()
    .then(conn => {
      console.log('✅ ImmoLion - Connexion MySQL réussie');
      conn.release();
    })
    .catch(err => {
      console.error('❌ ImmoLion - Échec de connexion:', err.message);
    });
    
  console.log('✅ ImmoLion - Pool de connexions créé');
} catch (error) {
  console.error('❌ ImmoLion - Erreur création pool:', error);
  throw error;
}

function cleanParams(params: any[]): any[] {
  return params.map(param => param === undefined ? null : param);
}

// Fonction query ultra-robuste
export async function query(sql: string, params: any[] = []) {
  console.log('📝 ImmoLion SQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
  
  let connection;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount <= maxRetries) {
    try {
      connection = await pool.getConnection();
      const cleanedParams = cleanParams(params);
      
      const [rows] = await connection.query(sql, cleanedParams);
      
      return rows;
      
    } catch (error: any) {
      console.error(`❌ Tentative ${retryCount + 1}/${maxRetries + 1}:`, error.message);
      
      if (error.code === 'ETIMEDOUT' || error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET') {
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`🔄 Nouvelle tentative dans 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
      
      throw error;
      
    } finally {
      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          console.error('❌ Erreur libération:', releaseError);
        }
      }
    }
  }
  
  throw new Error('Échec après plusieurs tentatives');
}

export async function queryRows(sql: string, params: any[] = []) {
  const result = await query(sql, params);
  return Array.isArray(result) ? result : [];
}

export async function queryInsert(sql: string, params: any[] = []) {
  const result = await query(sql, params) as any;
  return {
    insertId: result?.insertId || 0,
    affectedRows: result?.affectedRows || 0,
    success: !!(result?.insertId || result?.affectedRows)
  };
}

export async function checkConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as test');
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error('❌ Échec checkConnection:', error);
    return false;
  }
}

export async function runTransaction(callback: (connection: mysql.PoolConnection) => Promise<any>) {
  const connection = await pool.getConnection();
  try {
    await connection.query('START TRANSACTION');
    const result = await callback(connection);
    await connection.query('COMMIT');
    return result;
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('❌ Erreur libération transaction:', releaseError);
      }
    }
  }
}

// Nettoyage périodique
setInterval(() => {
  if (pool) {
    checkConnection().then(ok => {
      if (ok) console.log('✅ Pool ImmoLion OK');
    });
  }
}, 60000);

export default pool;
export { pool };