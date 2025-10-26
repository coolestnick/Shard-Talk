'use client'

import { WagmiProvider, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'

// Define Shardeum EVM Testnet (Mezame) custom chain
const shardeumEvmTestnet = {
  id: 8119,
  name: 'Shardeum EVM Testnet',
  network: 'shardeum-evm-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Shardeum',
    symbol: 'SHM',
  },
  rpcUrls: {
    default: {
      http: ['https://api-mezame.shardeum.org'],
    },
    public: {
      http: ['https://api-mezame.shardeum.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shardeum Explorer',
      url: 'https://explorer-mezame.shardeum.org',
    },
  },
  testnet: true,
} as const

// Create wagmi config with RainbowKit
const config = getDefaultConfig({
  appName: 'ShardTalk',
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE',
  chains: [shardeumEvmTestnet as any, mainnet, polygon, optimism, arbitrum],
  ssr: true, // Enable SSR support
})

// Create query client with aggressive error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx or 5xx errors from the server
        if (error?.status >= 400 && error?.status < 600) {
          return false
        }
        // Only retry once for network errors
        return failureCount < 1
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          showRecentTransactions
          theme={darkTheme({
            accentColor: '#6366f1', // indigo-500
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'rounded',
            overlayBlur: 'small', // ✅ gives blurred modal background
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
