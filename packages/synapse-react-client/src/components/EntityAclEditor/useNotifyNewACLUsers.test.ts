import { server } from '../../mocks/msw/server'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '../../testutils/TestingLibraryUtils'
import useNotifyNewACLUsers, {
  shouldNotifyUserInNewResourceAccess,
} from './useNotifyNewACLUsers'
import SynapseClient from '../../synapse-client'
import { ResourceAccess } from '@sage-bionetworks/synapse-types'
import {
  mockUserData1,
  mockUserData2,
  mockUserData3,
} from '../../mocks/user/mock_user_profile'
import { getAccessTypeFromPermissionLevel } from '../../utils/PermissionLevelToAccessType'
import { MOCK_ACCESS_TOKEN } from '../../mocks/MockSynapseContext'
import { MOCK_TEAM_ID, mockTeamUserGroups } from '../../mocks/team/mockTeam'
import {
  ANONYMOUS_PRINCIPAL_ID,
  AUTHENTICATED_PRINCIPAL_ID,
  PUBLIC_PRINCIPAL_ID,
} from '../../utils/SynapseConstants'
import {
  mockAnonymousUserGroupData,
  mockAuthenticatedGroupData,
  mockPublicGroupData,
} from '../../mocks/usergroup/mockUserGroup'

const subject = 'the message subject'
const body = 'the message body'

const CURRENT_USER_RESOURCE_ACCESS: ResourceAccess = {
  principalId: mockUserData1.id,
  accessType: getAccessTypeFromPermissionLevel('CAN_ADMINISTER'),
}

const sendMessageSpy = jest.spyOn(SynapseClient, 'sendMessage')

describe('useNotifyNewACLUsers', () => {
  beforeEach(() => jest.clearAllMocks())
  beforeAll(() => server.listen())
  afterEach(() => server.restoreHandlers())
  afterAll(() => server.close())

  it('Sends a notification to new users', async () => {
    const initialResourceAccessList: ResourceAccess[] = [
      CURRENT_USER_RESOURCE_ACCESS,
    ]
    const newResourceAccessList: ResourceAccess[] = [
      CURRENT_USER_RESOURCE_ACCESS,
      // add user 2
      {
        principalId: mockUserData2.id,
        accessType: getAccessTypeFromPermissionLevel('CAN_DOWNLOAD'),
      },
    ]

    const { result } = renderHook(
      () =>
        useNotifyNewACLUsers({
          subject,
          body,
          initialResourceAccessList,
          newResourceAccessList,
        }),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.sendNotification()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
      expect(sendMessageSpy).toHaveBeenCalledTimes(1)
      expect(sendMessageSpy).toHaveBeenCalledWith(
        [String(mockUserData2.id)],
        subject,
        body,
        MOCK_ACCESS_TOKEN,
      )
    })
  })

  it('Does not send a notification if no users should be notified', async () => {
    const initialResourceAccessList: ResourceAccess[] = [
      CURRENT_USER_RESOURCE_ACCESS,
      {
        principalId: mockUserData2.id,
        accessType: getAccessTypeFromPermissionLevel('CAN_DOWNLOAD'),
      },
    ]
    const newResourceAccessList: ResourceAccess[] = [
      CURRENT_USER_RESOURCE_ACCESS,
      // change permission of user 2
      {
        principalId: mockUserData2.id,
        accessType: getAccessTypeFromPermissionLevel('CAN_EDIT_DELETE'),
      },
    ]

    const { result } = renderHook(
      () =>
        useNotifyNewACLUsers({
          subject,
          body,
          initialResourceAccessList,
          newResourceAccessList,
        }),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.sendNotification()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
      expect(sendMessageSpy).toHaveBeenCalledTimes(0)
    })
  })
})

describe('shouldNotifyUserInNewResourceAccess', () => {
  it('is true for new users and false for existing users', () => {
    const initialResourceAccessList: ResourceAccess[] = [
      CURRENT_USER_RESOURCE_ACCESS,
      {
        principalId: mockUserData2.id,
        accessType: getAccessTypeFromPermissionLevel('CAN_DOWNLOAD'),
      },
    ]

    // User 1 is in the list (and is the current user)
    expect(
      shouldNotifyUserInNewResourceAccess(
        mockUserData1.id,
        initialResourceAccessList,
        mockUserData2.userGroupHeader,
        String(mockUserData1.id),
      ),
    ).toBe(false)
    // User 2 is in the list
    expect(
      shouldNotifyUserInNewResourceAccess(
        mockUserData2.id,
        initialResourceAccessList,
        mockUserData2.userGroupHeader,
        String(mockUserData1.id),
      ),
    ).toBe(false)
    // User 3 is not in the list
    expect(
      shouldNotifyUserInNewResourceAccess(
        mockUserData3.id,
        initialResourceAccessList,
        mockUserData3.userGroupHeader,
        String(mockUserData1.id),
      ),
    ).toBe(true)
  })

  it('Does not send a notification to the current user', () => {
    const initialResourceAccessList: ResourceAccess[] = [
      {
        principalId: MOCK_TEAM_ID,
        accessType: getAccessTypeFromPermissionLevel('CAN_ADMINISTER'),
      },
    ]
    // The team is in the list (and is a team) so it should not be notified
    expect(
      shouldNotifyUserInNewResourceAccess(
        MOCK_TEAM_ID,
        initialResourceAccessList,
        mockTeamUserGroups.find(team => team.id === MOCK_TEAM_ID)!
          .userGroupHeader,
        String(mockUserData1.id),
      ),
    ).toBe(false)
    // User 1 is not in the list, but is the current user, so they should not be notified
    expect(
      shouldNotifyUserInNewResourceAccess(
        mockUserData1.id,
        initialResourceAccessList,
        mockUserData1.userGroupHeader,
        String(mockUserData1.id),
      ),
    ).toBe(false)
  })

  it('Does not send a notification to public users or groups', () => {
    const initialResourceAccessList: ResourceAccess[] = [
      CURRENT_USER_RESOURCE_ACCESS,
    ]

    expect(
      shouldNotifyUserInNewResourceAccess(
        AUTHENTICATED_PRINCIPAL_ID,
        initialResourceAccessList,
        mockAuthenticatedGroupData.userGroupHeader,
        String(mockUserData1.id),
      ),
    ).toBe(false)
    expect(
      shouldNotifyUserInNewResourceAccess(
        PUBLIC_PRINCIPAL_ID,
        initialResourceAccessList,
        mockPublicGroupData.userGroupHeader,
        String(mockUserData1.id),
      ),
    ).toBe(false)
    expect(
      shouldNotifyUserInNewResourceAccess(
        ANONYMOUS_PRINCIPAL_ID,
        initialResourceAccessList,
        mockAnonymousUserGroupData.userGroupHeader,
        String(mockUserData1.id),
      ),
    ).toBe(false)
  })

  it('Does not send a notification to teams', () => {
    const initialResourceAccessList: ResourceAccess[] = [
      CURRENT_USER_RESOURCE_ACCESS,
    ]

    expect(
      shouldNotifyUserInNewResourceAccess(
        MOCK_TEAM_ID,
        initialResourceAccessList,
        mockTeamUserGroups.find(team => team.id === MOCK_TEAM_ID)!
          .userGroupHeader,
        String(mockUserData1.id),
      ),
    ).toBe(false)
  })
})
