import {
  Card as ThorinCard,
  Helper as ThorinHelper,
  mq,
} from '@ensdomains/thorin'
import styled, { css } from 'styled-components'

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1rem;
`

export const Card = styled(ThorinCard)`
  width: 120%;
  align-items: center;
  gap: 1.5rem;
  @media only screen and (max-width: 600px) {
    width: 100%;
  }
`

export const Link = styled.a.attrs({
  target: '_blank',
  rel: 'noopener noreferrer',
})(
  ({ theme }) => css`
    color: ${theme.colors.accent};
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  `
)

export const SetupInfo = styled(ThorinHelper)`
  width: 120%;

  @media only screen and (max-width: 600px) {
    width: 100%;
    font-size: 9pt;
  }
`

export const CodeLayout = styled.pre`
  width: 100%;
  background-color: #2c203b;
  padding: 10px;
  font-size: 10pt;
  line-height: 18pt;
  border-radius: 8px;
  overflow-x: scroll;
  .key {
    color: #f000a8;
  }

  .value {
    color: #f6f6f6;
    text-shadow: 0 0 3px #0073e6;
  }

  @media only screen and (max-width: 600px) {
    line-height: 1rem;
    span {
      display: block;
    }
    .key {
      margin-top: 10px;
    }
  }
`

export const Helper = styled(ThorinHelper)`
  svg {
    display: none;
  }
`

export const Spacer = styled.div`
  display: block;
  width: 100%;
  height: 1rem;

  ${mq.sm.max(css`
    height: 0;
  `)}
`
