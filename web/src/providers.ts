import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig } from 'wagmi'
import { goerli } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

export const chains = [goerli]

const { publicClient, webSocketPublicClient } = configureChains(chains, [
  publicProvider(),
])

const { connectors } = getDefaultWallets({
  appName: 'Web3 Starter',
  chains,
})

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})