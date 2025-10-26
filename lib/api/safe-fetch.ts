/**
 * Safe Fetch Utility with Circuit Breaker
 *
 * Prevents excessive retries when API is down
 */

interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  isOpen: boolean
}

const circuitBreakers = new Map<string, CircuitBreakerState>()

const CIRCUIT_BREAKER_THRESHOLD = 3 // Open circuit after 3 failures
const CIRCUIT_BREAKER_TIMEOUT = 60000 // Reset after 1 minute

function getCircuitBreaker(url: string): CircuitBreakerState {
  if (!circuitBreakers.has(url)) {
    circuitBreakers.set(url, {
      failures: 0,
      lastFailureTime: 0,
      isOpen: false,
    })
  }
  return circuitBreakers.get(url)!
}

function recordFailure(url: string) {
  const breaker = getCircuitBreaker(url)
  breaker.failures++
  breaker.lastFailureTime = Date.now()

  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    breaker.isOpen = true
    console.warn(`Circuit breaker opened for ${url}`)
  }
}

function recordSuccess(url: string) {
  const breaker = getCircuitBreaker(url)
  breaker.failures = 0
  breaker.isOpen = false
}

function shouldAllowRequest(url: string): boolean {
  const breaker = getCircuitBreaker(url)

  if (!breaker.isOpen) {
    return true
  }

  // Check if enough time has passed to try again
  const timeSinceLastFailure = Date.now() - breaker.lastFailureTime
  if (timeSinceLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
    console.log(`Circuit breaker half-open for ${url}, allowing retry`)
    breaker.isOpen = false
    breaker.failures = 0
    return true
  }

  return false
}

/**
 * Safe fetch wrapper with circuit breaker and error handling
 */
export async function safeFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Check circuit breaker
  if (!shouldAllowRequest(url)) {
    throw new Error(
      'Service temporarily unavailable. Circuit breaker is open.'
    )
  }

  try {
    const response = await fetch(url, {
      ...options,
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    // Record success if 2xx
    if (response.ok) {
      recordSuccess(url)
    } else {
      // Record failure for 5xx errors
      if (response.status >= 500) {
        recordFailure(url)
      }
    }

    return response
  } catch (error: any) {
    // Record failure for network errors
    if (error.name === 'AbortError' || error.name === 'TypeError') {
      recordFailure(url)
    }
    throw error
  }
}

/**
 * Safe JSON fetch with automatic error handling
 */
export async function safeFetchJSON<T>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const response = await safeFetch(url, options)

    if (!response.ok) {
      console.error(
        `API error: ${response.status} ${response.statusText} for ${url}`
      )
      return null
    }

    return await response.json()
  } catch (error: any) {
    console.error(`Failed to fetch ${url}:`, error.message)
    return null
  }
}

/**
 * Reset all circuit breakers (useful for testing)
 */
export function resetCircuitBreakers() {
  circuitBreakers.clear()
}
