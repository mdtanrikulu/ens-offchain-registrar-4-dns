import { verifyMessage } from 'ethers/lib/utils'
import { IRequest } from 'itty-router'

import { fullMap } from '../constants'
import { Env } from '../env'
import { ZodNameWithSignature } from '../models'
import { get } from './functions/get'
import { set } from './functions/set'
import { queryDomain } from './functions/utils'

export async function setName(request: IRequest, env: Env): Promise<Response> {
  const body = await request.json()
  const safeParse = ZodNameWithSignature.safeParse(body)

  if (!safeParse.success) {
    const response = { success: false, error: safeParse.error }
    return Response.json(response, { status: 400 })
  }

  const { name, owner, signature } = safeParse.data

  const parts = name.split('.')

  if (
    name.endsWith('.eth')
      ? parts.length !== 3
      : !fullMap.includes(parts.at(-1) || '') || parts.length !== 2
  ) {
    const response = { success: false, error: 'Invalid name' }
    return Response.json(response, { status: 400 })
  }

  // verify if dns name has dnssec enabled and set ENS1 prefixed TXT record
  if (!name.endsWith('.eth')) {
    const queryResult = await queryDomain(name)
    let isResultBoolean = typeof queryResult === 'boolean'
    if (!queryResult || !isResultBoolean) {
      const response = {
        success: false,
        error: isResultBoolean ? 'Invalid name' : queryResult,
      }
      return Response.json(response, { status: 400 })
    }
  }

  // Validate signature
  try {
    const signer = verifyMessage(signature.message, signature.hash)
    if (signer.toLowerCase() !== owner.toLowerCase()) {
      throw new Error('Invalid signer')
    }
  } catch (err) {
    console.error(err)
    const response = { success: false, error: err }
    return Response.json(response, { status: 401 })
  }

  // Check if the name is already taken
  const existingName = await get(name, env)

  // If the name is owned by someone else, return an error
  if (existingName && existingName.owner !== owner) {
    const response = { success: false, error: 'Name already taken' }
    return Response.json(response, { status: 409 })
  }

  // Save the name
  try {
    await set(safeParse.data, env)
    const response = { success: true }
    return Response.json(response, { status: 201 })
  } catch (err) {
    console.error(err)
    const response = { success: false, error: 'Error setting name' }
    return Response.json(response, { status: 500 })
  }
}
