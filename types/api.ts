// API Response Types

export interface Message {
  _id: string
  messageId: number
  sender: string
  content: string
  timestamp: number
  createdAt: string
  transactionHash?: string
}

export interface MessageCountResponse {
  address: string
  messageCount: number
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface MessagesResponse {
  address: string
  messages: Message[]
  pagination: PaginationInfo
}

export interface SaveMessageRequest {
  messageId: number
  sender: string
  content: string
  timestamp: number
  transactionHash?: string
}

export interface SaveMessageResponse {
  success: boolean
  messageId: number
  inserted: boolean
  updated: boolean
}

export interface ApiError {
  error: string
}

// API Client Options
export interface ApiClientOptions {
  baseUrl?: string
  timeout?: number
}

// Verification result
export interface VerificationResult<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}
