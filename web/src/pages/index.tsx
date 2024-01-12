import { Button, Input } from '@ensdomains/thorin'
import { ConnectButton } from '@rainbow-me/rainbowkit'
// @ts-ignore
import ch from 'content-hash'
import Head from 'next/head'
import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

import { Footer } from '@/components/Footer'
import { useDebounce } from '@/hooks/useDebounce'
import { useFetch } from '@/hooks/useFetch'
import { Card, Form, Helper, Link, SetupInfo, Spacer } from '@/styles'
import { WorkerRequest } from '@/types'

export default function App() {
  const { address } = useAccount()

  const [name, setName] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState<string | undefined>(undefined)
  const [contentHash, setContentHash] = useState<string | undefined>(undefined)

  const regex = new RegExp('^[a-z0-9-.]+$')
  const debouncedName = useDebounce(name, 500)
  const debouncedContentHash = useDebounce(contentHash, 500)
  const enabled = !!debouncedName && regex.test(debouncedName)

  const { data, isLoading, signMessage, variables } = useSignMessage()

  const requestBody: WorkerRequest = {
    name: `${debouncedName}`,
    owner: address!,
    addresses: { '60': address },
    texts: { description },
    contenthash:
      debouncedContentHash && `0x${ch.fromIpfs(debouncedContentHash)}`,
    signature: {
      hash: data!,
      message: variables?.message!,
    },
  }

  const {
    data: gatewayData,
    error: gatewayError,
    isLoading: gatewayIsLoading,
  } = useFetch(
    data &&
      'https://offchain-resolver-for-dns-names.ensdomains.workers.dev/set',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  )

  return (
    <>
      <Head>
        <title>Offchain DNS Record Registrar</title>
        <meta property="og:title" content="Offchain DNS Record Registrar" />
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

      <SetupInfo type="info">
        <b>Configure ENS records for your DNS name.</b>
        <hr />
        Be sure to enable DNSSEC on your service provider and add
        <br />
        <pre
          style={{
            backgroundColor: '#ececec',
            padding: '2px 8px',
            fontWeight: 'bold',
            borderRadius: '4px',
          }}
        >
          ENS1 0xA137071Ff11A8bC6931Bb4e6cAFbe08877c47465
        </pre>
        <br />
        as your TXT record before.
      </SetupInfo>

      <Card>
        <ConnectButton showBalance={false} />

        <Form
          onSubmit={(e) => {
            e.preventDefault()
            signMessage({
              message: `Register ${debouncedName}`,
            })
          }}
        >
          <Input
            type="text"
            label="Name"
            placeholder="ens.xyz"
            required
            disabled={!!data || !address}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            type="text"
            label="Description"
            placeholder="Your portable web3 profile"
            disabled={!!data || !address}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            type="text"
            label="Content hash"
            placeholder=""
            disabled={!!data || !address}
            onChange={(e) => setContentHash(e.target.value)}
          />

          <Button
            type="submit"
            disabled={!enabled || !!data}
            loading={isLoading || gatewayIsLoading}
          >
            Save Records
          </Button>
        </Form>

        {gatewayError ? (
          <Helper type="error">
            {gatewayError.message === 'Conflict'
              ? 'Somebody already registered that name'
              : 'Something went wrong'}
          </Helper>
        ) : gatewayData ? (
          <Helper>
            <p>
              Visit the <Link href={`/query/${debouncedName}`}>query page</Link>{' '}
              to see your name
            </p>
          </Helper>
        ) : !!debouncedName && !enabled ? (
          <Helper type="error">Name must be lowercase alphanumeric</Helper>
        ) : null}
      </Card>

      <Footer />
    </>
  )
}
