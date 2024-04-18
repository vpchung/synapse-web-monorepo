import { screen, waitFor } from '@testing-library/react'
import SynapseClient from '../synapse-client'

const getEntityWikiSpy = jest.spyOn(SynapseClient, 'getEntityWiki')
const getWikiAttachmentsFromEntitySpy = jest.spyOn(
  SynapseClient,
  'getWikiAttachmentsFromEntity',
)

export function expectMarkdownSynapseNotToGetWiki() {
  expect(getEntityWikiSpy).toHaveBeenCalledTimes(0)
  expect(getWikiAttachmentsFromEntitySpy).toHaveBeenCalledTimes(0)
}

export async function waitForMarkdownSynapseToGetWiki(times: number = 1) {
  await waitFor(() => {
    expect(getEntityWikiSpy).toHaveBeenCalledTimes(times)
    expect(getWikiAttachmentsFromEntitySpy).toHaveBeenCalledTimes(times)
  })
}

// Note - matches text content rendered by MarkdownSynapse, but does not
// confirm that formatting was applied or widgets embedded
export async function confirmMarkdownSynapseTextContent(textContent: string) {
  const markdownField = await screen.findByLabelText('markdown')
  expect(markdownField).toHaveTextContent(textContent)
}
