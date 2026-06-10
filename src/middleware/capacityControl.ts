import { Request, Response, NextFunction } from 'express';

interface UserSession {
  firstAccess: number; // Timestamp of first access
  lastActivity: number; // Timestamp of last activity
  ip: string;
}

const MAX_CAPACITY = 25; // Example: 25 simultaneous users
const PROMOTIONAL_TIME_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

// In-memory store for active sessions. In a real-world scenario, this would be a distributed cache (e.g., Redis).
const activeSessions = new Map<string, UserSession>(); // Key: IP address

// Clean up inactive sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, session] of activeSessions.entries()) {
    // Remove sessions inactive for more than promotional time + a buffer
    if (now - session.lastActivity > PROMOTIONAL_TIME_MS + (5 * 60 * 1000)) { // 5 min buffer
      activeSessions.delete(ip);
      console.log(`[CapacityControl] Session for IP ${ip} removed due to inactivity.`);
    }
  }
}, 60 * 1000); // Run every minute

export const capacityControlMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userIp = req.ip; // Express's req.ip might need configuration for proxy headers

  // For local testing, if req.ip is '::1' or '127.0.0.1', use a mock IP or skip
  if (userIp === '::1' || userIp === '127.0.0.1') {
    // In a production environment behind a proxy, ensure 'trust proxy' is enabled in Express
    // and use req.headers['x-forwarded-for'] or similar.
    // For this example, we'll allow localhost to bypass capacity control for dev/testing.
    return next();
  }

  let session = activeSessions.get(userIp);
  const now = Date.now();

  if (!session) {
    // New session
    if (activeSessions.size >= MAX_CAPACITY) {
      console.log(`[CapacityControl] Capacity reached. Redirecting IP ${userIp} to waitlist.`);
      return res.redirect('/waitlist');
    }
    session = {
      firstAccess: now,
      lastActivity: now,
      ip: userIp,
    };
    activeSessions.set(userIp, session);
    console.log(`[CapacityControl] New session for IP ${userIp}. Active sessions: ${activeSessions.size}`);
  } else {
    // Existing session, update activity
    session.lastActivity = now;
    activeSessions.set(userIp, session);
  }

  // Check promotional time limit
  if (now - session.firstAccess > PROMOTIONAL_TIME_MS) {
    console.log(`[CapacityControl] Promotional time expired for IP ${userIp}. Redirecting to waitlist.`);
    return res.redirect('/waitlist');
  }

  // Add session info to request for other middlewares/handlers if needed
  (req as any).userSession = session;
  (req as any).activeUsersCount = activeSessions.size;
  (req as any).maxCapacity = MAX_CAPACITY;

  next();
};

export const getActiveUsersCount = () => activeSessions.size;
export const getMaxCapacity = () => MAX_CAPACITY;
