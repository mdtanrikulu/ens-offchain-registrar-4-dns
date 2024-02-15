import { encodeContentHash } from '@ensdomains/ensjs/utils'
import { Button, Input } from '@ensdomains/thorin'
import { ConnectButton } from '@rainbow-me/rainbowkit'
// @ts-ignore
import Head from 'next/head'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

import { Footer } from '@/components/Footer'
import { fullMap } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'
import { useFetch } from '@/hooks/useFetch'
import { Card, Form, Helper, Link, SetupInfo, Spacer } from '@/styles'
import { WorkerRequest } from '@/types'

function validateInput(ref: MutableRefObject<null>, conditionMet: boolean) {
  if (conditionMet) {
    ;(ref.current as any).style.border = ''
  } else {
    ;(ref.current as any).style.border = '2px solid red'
    ;(ref.current as any).style.borderRadius = '8px'
  }
}

export default function App() {
  const { address } = useAccount()

  const nameRef = useRef(null)
  const contentHashRef = useRef(null)

  const [name, setName] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState<string | undefined>(undefined)
  const [contentHash, setContentHash] = useState<string | undefined>(undefined)
  const [isNameValid, setNameValid] = useState<boolean>(true)
  const [isContentHashValid, setContentHashValid] = useState<boolean>(true)

  const regex = new RegExp('^[a-z0-9-.]+$')
  const debouncedName = useDebounce(name, 500)
  const debouncedContentHash = useDebounce(contentHash, 500)
  const enabled = !!debouncedName && regex.test(debouncedName)

  const { data, isLoading, signMessage, variables } = useSignMessage()

  let contentHashEncoded = ''

  useEffect(() => {
    validateInput(contentHashRef, isContentHashValid)
    if (!isContentHashValid) contentHashEncoded = ''
  }, [isContentHashValid])

  useEffect(() => {
    validateInput(nameRef, isNameValid)
  }, [isNameValid])

  useEffect(() => {
    if (debouncedContentHash) {
      try {
        contentHashEncoded = encodeContentHash(debouncedContentHash)
        setContentHashValid(true)
      } catch (error) {
        console.log('error', error)
        setContentHashValid(false)
      }
    } else {
      setContentHashValid(true)
    }
  }, [debouncedContentHash])

  useEffect(() => {
    if (debouncedName) {
      const parts = debouncedName?.split('.')
      setNameValid(
        debouncedName.endsWith('.eth')
          ? parts.length === 3
          : fullMap.includes(parts.at(-1) || '') && parts.length === 2
      )
    } else {
      setNameValid(true)
    }
  }, [debouncedName])

  const requestBody: WorkerRequest = {
    name: `${debouncedName}`,
    owner: address!,
    addresses: { '60': address },
    texts: { description },
    contenthash: contentHashEncoded,
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
            ref={nameRef}
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
            ref={contentHashRef}
            type="text"
            label="Content hash"
            placeholder=""
            disabled={!!data || !address}
            onChange={(e) => setContentHash(e.target.value)}
          />

          <Button
            type="submit"
            disabled={!enabled || !!data || !isNameValid || !isContentHashValid}
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
