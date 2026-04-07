import { Request, Response, NextFunction } from 'express'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export function rateLimit(options: {
  windowMs: number
  max: number
  message?: string
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP address as key (localhost for local development)
    const key = req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs
      }
      return next()
    }

    store[key].count++

    if (store[key].count > options.max) {
      return res.status(429).json({
        error: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      })
    }

    next()
  }
}

// Preset rate limiters
export const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later.'
})

export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  message: 'Too many requests, please try again later.'
})
