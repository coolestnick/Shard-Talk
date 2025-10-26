/**
 * Messages API Client
 *
 * Utility functions to interact with the Messages API and verify responses.
 * Works with both local development and production environments.
 */

import {
  MessageCountResponse,
  MessagesResponse,
  SaveMessageRequest,
  SaveMessageResponse,
  ApiError,
  ApiClientOptions,
  VerificationResult,
} from '@/types/api'

// Default configuration
const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
const DEFAULT_TIMEOUT = 10000 // 10 seconds

export class MessagesApiClient {
  private baseUrl: string
  private timeout: number

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL
    this.timeout = options.timeout || DEFAULT_TIMEOUT
  }

  /**
   * Fetch with timeout and error handling
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  /**
   * Get message count for a wallet address
   *
   * @param address - Wallet address (case-insensitive)
   * @returns Verification result with message count
   *
   * @example
   * const result = await client.getMessageCount('0x123...')
   * if (result.success) {
   *   console.log(`Messages: ${result.data.messageCount}`)
   * }
   */
  async getMessageCount(
    address: string
  ): Promise<VerificationResult<MessageCountResponse>> {
    try {
      // Validate address format
      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return {
          success: false,
          error: 'Invalid Ethereum address format',
        }
      }

      const url = `${this.baseUrl}/api/messages?address=${encodeURIComponent(
        address
      )}&count=true`

      const response = await this.fetchWithTimeout(url)
      const statusCode = response.status

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        return {
          success: false,
          error: errorData.error || `HTTP ${statusCode} error`,
          statusCode,
        }
      }

      const data: MessageCountResponse = await response.json()

      // Verify response structure
      if (
        typeof data.address !== 'string' ||
        typeof data.messageCount !== 'number'
      ) {
        return {
          success: false,
          error: 'Invalid response structure',
          statusCode,
        }
      }

      // Verify address matches (normalized to lowercase)
      if (data.address.toLowerCase() !== address.toLowerCase()) {
        return {
          success: false,
          error: 'Response address mismatch',
          statusCode,
        }
      }

      return {
        success: true,
        data,
        statusCode,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }
  }

  /**
   * Get messages for a wallet address with pagination
   *
   * @param address - Wallet address
   * @param page - Page number (default: 1)
   * @param limit - Messages per page (default: 20, max: 100)
   * @returns Verification result with messages and pagination
   *
   * @example
   * const result = await client.getMessages('0x123...', 1, 10)
   * if (result.success) {
   *   result.data.messages.forEach(msg => console.log(msg.content))
   * }
   */
  async getMessages(
    address: string,
    page: number = 1,
    limit: number = 20
  ): Promise<VerificationResult<MessagesResponse>> {
    try {
      // Validate inputs
      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return {
          success: false,
          error: 'Invalid Ethereum address format',
        }
      }

      if (page < 1) {
        return {
          success: false,
          error: 'Page must be >= 1',
        }
      }

      if (limit < 1 || limit > 100) {
        return {
          success: false,
          error: 'Limit must be between 1 and 100',
        }
      }

      const url = `${this.baseUrl}/api/messages?address=${encodeURIComponent(
        address
      )}&page=${page}&limit=${limit}`

      const response = await this.fetchWithTimeout(url)
      const statusCode = response.status

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        return {
          success: false,
          error: errorData.error || `HTTP ${statusCode} error`,
          statusCode,
        }
      }

      const data: MessagesResponse = await response.json()

      // Verify response structure
      if (
        typeof data.address !== 'string' ||
        !Array.isArray(data.messages) ||
        !data.pagination
      ) {
        return {
          success: false,
          error: 'Invalid response structure',
          statusCode,
        }
      }

      // Verify pagination structure
      const p = data.pagination
      if (
        typeof p.page !== 'number' ||
        typeof p.limit !== 'number' ||
        typeof p.total !== 'number' ||
        typeof p.totalPages !== 'number'
      ) {
        return {
          success: false,
          error: 'Invalid pagination structure',
          statusCode,
        }
      }

      // Verify address matches
      if (data.address.toLowerCase() !== address.toLowerCase()) {
        return {
          success: false,
          error: 'Response address mismatch',
          statusCode,
        }
      }

      // Verify each message has required fields
      for (const msg of data.messages) {
        if (
          typeof msg.messageId !== 'number' ||
          typeof msg.sender !== 'string' ||
          typeof msg.content !== 'string' ||
          typeof msg.timestamp !== 'number'
        ) {
          return {
            success: false,
            error: 'Invalid message structure',
            statusCode,
          }
        }
      }

      return {
        success: true,
        data,
        statusCode,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }
  }

  /**
   * Get all messages for a wallet address (fetches all pages)
   *
   * @param address - Wallet address
   * @param limit - Messages per page (default: 50)
   * @returns Verification result with all messages
   *
   * @example
   * const result = await client.getAllMessages('0x123...')
   * if (result.success) {
   *   console.log(`Total messages: ${result.data.messages.length}`)
   * }
   */
  async getAllMessages(
    address: string,
    limit: number = 50
  ): Promise<VerificationResult<MessagesResponse>> {
    try {
      const allMessages: MessagesResponse['messages'] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const result = await this.getMessages(address, page, limit)

        if (!result.success) {
          return result
        }

        allMessages.push(...result.data!.messages)

        hasMore = page < result.data!.pagination.totalPages
        page++
      }

      // Get the last result to use its structure
      const lastResult = await this.getMessages(address, 1, 1)

      if (!lastResult.success) {
        return lastResult
      }

      return {
        success: true,
        data: {
          address: lastResult.data!.address,
          messages: allMessages,
          pagination: {
            page: 1,
            limit: allMessages.length,
            total: allMessages.length,
            totalPages: 1,
          },
        },
        statusCode: 200,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }
  }

  /**
   * Save a message to MongoDB (internal use)
   *
   * @param message - Message data to save
   * @returns Verification result with save status
   */
  async saveMessage(
    message: SaveMessageRequest
  ): Promise<VerificationResult<SaveMessageResponse>> {
    try {
      const url = `${this.baseUrl}/api/messages`

      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })

      const statusCode = response.status

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        return {
          success: false,
          error: errorData.error || `HTTP ${statusCode} error`,
          statusCode,
        }
      }

      const data: SaveMessageResponse = await response.json()

      // Verify response structure
      if (
        typeof data.success !== 'boolean' ||
        typeof data.messageId !== 'number'
      ) {
        return {
          success: false,
          error: 'Invalid response structure',
          statusCode,
        }
      }

      return {
        success: true,
        data,
        statusCode,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }
  }

  /**
   * Verify if an address has sent messages
   *
   * @param address - Wallet address
   * @returns True if address has sent at least one message
   */
  async hasMessages(address: string): Promise<boolean> {
    const result = await this.getMessageCount(address)
    return result.success && result.data!.messageCount > 0
  }

  /**
   * Get the latest message from an address
   *
   * @param address - Wallet address
   * @returns Verification result with the latest message
   */
  async getLatestMessage(address: string): Promise<VerificationResult<MessagesResponse['messages'][0] | null>> {
    const result = await this.getMessages(address, 1, 1)

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        statusCode: result.statusCode,
      }
    }

    const latestMessage = result.data!.messages[0] || null

    return {
      success: true,
      data: latestMessage,
      statusCode: result.statusCode,
    }
  }
}

// Singleton instance for convenience
export const messagesApi = new MessagesApiClient()

// Standalone verification functions for quick use
export async function verifyMessageCount(
  address: string,
  baseUrl?: string
): Promise<VerificationResult<MessageCountResponse>> {
  const client = new MessagesApiClient({ baseUrl })
  return client.getMessageCount(address)
}

export async function verifyMessages(
  address: string,
  page?: number,
  limit?: number,
  baseUrl?: string
): Promise<VerificationResult<MessagesResponse>> {
  const client = new MessagesApiClient({ baseUrl })
  return client.getMessages(address, page, limit)
}
