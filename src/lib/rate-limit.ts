import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Sliding window: paling akurat, tidak ada "reset tiba-tiba" di batas window.
// Cache di edge selama beberapa detik agar IP yang sama beruntun tidak selalu
// round-trip ke Redis — ini yang bikin middleware tetap ringan.
export const authRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '60 s'),
                                           analytics: false, // matikan biar tidak nambah 1 request tambahan per call
                                           prefix: 'ratelimit:auth',
})

export const accountRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
                                              analytics: false,
                                              prefix: 'ratelimit:account',
})
