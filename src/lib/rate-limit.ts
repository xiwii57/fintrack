import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// ephemeralCache: menyimpan hasil limit check di memori edge selama beberapa
// detik, jadi request beruntun dari identifier yang sama tidak selalu
// round-trip ke Redis — inilah yang bikin middleware tetap ringan/cepat.
const ephemeralCache = new Map()

export const authRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '60 s'),
                                           analytics: false,
                                           ephemeralCache,
                                           prefix: 'ratelimit:auth',
})

export const accountRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
                                              analytics: false,
                                              ephemeralCache,
                                              prefix: 'ratelimit:account',
})

export const passwordResetRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '15 m'),
                                                    analytics: false,
                                                    ephemeralCache,
                                                    prefix: 'ratelimit:password-reset',
})
