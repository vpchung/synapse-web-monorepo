import { createWrapper } from '../../testutils/TestingLibraryUtils'
import React from 'react'
import { act, render, screen, within } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
import SynapseClient from '../../synapse-client'
import userEvent from '@testing-library/user-event'
import mockTableEntityData, {
  mockTableEntity,
} from '../../mocks/entity/mockTableEntity'
import {
  ACCESS_TYPE,
  Entity,
  SUBMISSION_VIEW_CONCRETE_TYPE_VALUE,
} from '@sage-bionetworks/synapse-types'
import { SynapseClientError } from '../../utils'
import SubmissionViewScopeEditorModal, {
  SubmissionViewScopeEditorModalProps,
} from './SubmissionViewScopeEditorModal'
import EvaluationFinder from '../EvaluationFinder/EvaluationFinder'
import { MOCK_ACCESS_TOKEN } from '../../mocks/MockSynapseContext'

jest.mock('../EvaluationFinder/EvaluationFinder', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid={'EvaluationFinderMocked'} />),
}))

const mockEvaluationFinder = jest.mocked(EvaluationFinder)
const mockUpdateEntity = jest.spyOn(SynapseClient, 'updateEntity')
const mockTableEntityInstance = mockTableEntityData.entity

function renderComponent(props: SubmissionViewScopeEditorModalProps) {
  return render(<SubmissionViewScopeEditorModal {...props} />, {
    wrapper: createWrapper(),
  })
}

describe('SubmissionViewScopeEditorModal tests', () => {
  const mockOnCancel = jest.fn()
  const mockOnUpdate = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(SynapseClient, 'getEntity').mockResolvedValue({
      ...mockTableEntity,
      scopeIds: ['123', '456'],
      concreteType: SUBMISSION_VIEW_CONCRETE_TYPE_VALUE,
    } as Entity)
    renderComponent({
      entityId: mockTableEntity.id,
      open: true,
      onCancel: mockOnCancel,
      onUpdate: mockOnUpdate,
    })
  })

  it('displays the correct scope editor which can modify selection', async () => {
    jest.spyOn(SynapseClient, 'getEvaluation').mockImplementation(id => {
      return Promise.resolve({
        id: id,
        name: `Evaluation ${id}`,
      })
    })

    await screen.findByTestId('EvaluationFinderMocked')

    await waitFor(() => {
      expect(mockEvaluationFinder).toHaveBeenLastCalledWith(
        {
          activeOnly: false,
          accessType: ACCESS_TYPE.READ_PRIVATE_SUBMISSION,
          selectedIds: ['123', '456'],
          onChange: expect.anything(),
        },
        expect.anything(),
      )
    })

    expect(screen.findByRole('dialog')).toBeVisible
    expect(screen.findByRole('heading')).toBeVisible
    expect(screen.findByRole('button', { name: 'Save' })).toBeVisible
    expect(screen.findByRole('button', { name: 'Cancel' })).toBeVisible

    await screen.findByText('Evaluation 123')
    await screen.findByLabelText('Remove Evaluation 123 from scope')

    await screen.findByText('Evaluation 456')
    await screen.findByLabelText('Remove Evaluation 456 from scope')

    await expect(screen.queryByText('Evaluation 789')).not.toBeInTheDocument()

    const onChangePassedToEvaluationFinder =
      mockEvaluationFinder.mock.lastCall![0].onChange

    act(() => {
      onChangePassedToEvaluationFinder(['789'])
    })

    await screen.findByText('Evaluation 789')
    await screen.findByLabelText('Remove Evaluation 789 from scope')
  })

  it('display error for response returned by update call', async () => {
    const user = userEvent.setup()
    const saveButton = await screen.findByRole('button', { name: 'Save' })

    const errorMessage = 'Error with scope'
    mockUpdateEntity.mockRejectedValue(
      new SynapseClientError(
        404,
        'Error with scope',
        expect.getState().currentTestName!,
      ),
    )

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })
    await user.click(saveButton)

    const alert = await screen.findByRole('alert')
    within(alert).getByText(errorMessage)

    expect(mockOnUpdate).not.toHaveBeenCalled()
  })

  it('validate onCancel is correctly called', async () => {
    const user = userEvent.setup()
    const cancelButton = await screen.findByRole('button', { name: 'Cancel' })

    await waitFor(() => expect(cancelButton).not.toBeDisabled())
    await user.click(cancelButton)
    expect(mockOnCancel).toHaveBeenCalled()
  })
  it('successfully submit new scope and call the onUpdate callback', async () => {
    const user = userEvent.setup()
    const newScopeIds = ['123', '456', '789']

    await waitFor(() => {
      expect(mockEvaluationFinder).toHaveBeenLastCalledWith(
        {
          activeOnly: false,
          accessType: ACCESS_TYPE.READ_PRIVATE_SUBMISSION,
          selectedIds: ['123', '456'],
          onChange: expect.anything(),
        },
        expect.anything(),
      )
    })
    const mockSubmissionView = {
      ...mockTableEntityInstance,
      sceopIds: newScopeIds,
    }

    mockUpdateEntity.mockResolvedValue(mockSubmissionView)

    const saveButton = await screen.findByRole('button', { name: 'Save' })

    await screen.findByText('Evaluation 123')
    await screen.findByLabelText('Remove Evaluation 123 from scope')

    await screen.findByText('Evaluation 456')
    await screen.findByLabelText('Remove Evaluation 456 from scope')

    await expect(screen.queryByText('Evaluation 789')).not.toBeInTheDocument()

    const onChangePassedToEvaluationFinder =
      mockEvaluationFinder.mock.lastCall![0].onChange

    act(() => {
      onChangePassedToEvaluationFinder(newScopeIds)
    })

    await screen.findByText('Evaluation 789')
    await screen.findByLabelText('Remove Evaluation 789 from scope')

    await user.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          scopeIds: newScopeIds,
        }),
        MOCK_ACCESS_TOKEN,
      )
      expect(mockOnUpdate).toHaveBeenCalled()
    })
  })
})
