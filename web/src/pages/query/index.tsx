import { Button, Input } from '@ensdomains/thorin'
// @ts-ignore
import { EnsPlugin, Network, ethers } from 'ethers'
import Head from 'next/head'
import { useState } from 'react'

import { Footer } from '@/components/Footer'
import { useDebounce } from '@/hooks/useDebounce'
import { Card, CodeLayout, Form, Helper, Spacer } from '@/styles'

const ens = new EnsPlugin('0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e')
const network = new Network('sepolia', 11155111).attachPlugin(ens)
const rpc = 'https://rpc.ankr.com/eth_sepolia'

const provider = new ethers.JsonRpcProvider(rpc, network)

interface Result {
  resolver?: string | null | undefined
  address?: string | null | undefined
  description?: string | null | undefined
  contentHash?: string | null | undefined
}

export default function App() {
  const [name, setName] = useState<string | undefined>(undefined)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [queryError, setQueryError] = useState<any>(undefined)
  const [result, setResult] = useState<Result>({})

  const regex = new RegExp('^[a-z0-9-.]+$')
  const debouncedName = useDebounce(name, 300)
  const enabled = !!debouncedName && regex.test(debouncedName)

  const queryName = async (dnsName: string) => {
    setLoading(true)
    setQueryError(undefined)
    setResult({})
    try {
      const resolver = await provider.getResolver(dnsName)
      console.log(resolver?.address)
      setResult({
        ...(resolver && { resolver: resolver.address }),
      })
      const address = await provider.resolveName(dnsName)
      console.log(`The ENS name ${dnsName} resolves to ${address}`)
      setResult({
        ...(resolver && { resolver: resolver.address }),
        ...(address && { address }),
      })
      const description = await resolver?.getText('description')
      console.log(description)
      setResult({
        ...(resolver && { resolver: resolver.address }),
        ...(address && { address }),
        ...(description && { description }),
      })
      const contentHash = await resolver?.getContentHash()
      console.log(contentHash)
      setResult({
        ...(resolver && { resolver: resolver.address }),
        ...(address && { address }),
        ...(description ? { description } : { description: '---' }),
        ...(contentHash ? { contentHash } : { contentHash: '---' }),
      })
    } catch (error) {
      console.log('error', error)
      setQueryError(error)
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Offchain DNS Record Query</title>
        <meta property="og:title" content="Offchain DNS Record Query" />
        <meta
          name="description"
          content="Quick demo of how offchain DNS records work"
        />
        <meta
          property="og:description"
          content="Quick demo of how offchain DNS records work"
        />
      </Head>

      <Spacer />

      <Card>
        <Form
          onSubmit={(e) => {
            e.preventDefault()
            name && queryName(name)
          }}
        >
          <Input
            type="text"
            label="Name"
            placeholder="ens.xyz"
            required
            onChange={(e) => setName(e.target.value)}
          />

          <Button type="submit" disabled={!enabled} loading={isLoading}>
            Query
          </Button>
        </Form>

        {Object.keys(result).length > 1 && result.address ? (
          <CodeLayout>
            <div>
              <span className="key">Resolver Address{`\t`}{' '}</span>
              <span className="value">{result.resolver}</span>
            </div>
            <div>
              <span className="key">Wallet Address{`\t`}{' '}</span>
              <span className="value">{result.address}</span>
            </div>
            <div>
              <span className="key">Description{`\t\t`}{' '}</span>
              <span className="value">{result.description}</span>
            </div>
            <div>
              <span className="key">Content Hash{`\t\t`}{' '}</span>
              <span className="value">{result.contentHash}</span>
            </div>
          </CodeLayout>
        ) : null}
        {queryError || (Object.keys(result).length > 1 && !result.address) ? (
          <Helper type="error">
            {queryError?.message === 'Conflict'
              ? 'Somebody already registered that name'
              : 'Be sure DNS TXT record set to "ENS1 0xA137071Ff11A8bC6931Bb4e6cAFbe08877c47465"'}
          </Helper>
        ) : !!debouncedName && !enabled ? (
          <Helper type="error">Name must be lowercase alphanumeric</Helper>
        ) : null}
      </Card>

      <Footer />
    </>
  )
}
