import React, { useCallback, useState } from 'react'
import { Alert } from 'react-bootstrap'
import useDeepCompareEffect from 'use-deep-compare-effect'
import { SynapseClient } from '../../utils'
import { useGetDownloadListStatistics } from '../../utils/hooks/SynapseAPI/useGetDownloadListStatistics'
import { useGetEntityChildren } from '../../utils/hooks/SynapseAPI/useGetEntityChildren'
import { useSynapseContext } from '../../utils/SynapseContext'
import { EntityType, QueryBundleRequest } from '../../utils/synapseTypes/'
import { AddToDownloadListRequest } from '../../utils/synapseTypes/DownloadListV2/AddToDownloadListRequest'
import { FilesStatisticsResponse } from '../../utils/synapseTypes/DownloadListV2/QueryResponseDetails'
import {
  QUERY_FILTERS_COLLAPSED_CSS,
  QUERY_FILTERS_EXPANDED_CSS,
} from '../QueryWrapper'
import { useQueryWrapperContext } from '../QueryWrapper'
import SignInButton from '../SignInButton'
import { displayToast } from '../ToastMessage'
import DownloadDetails from './DownloadDetails'

enum StatusEnum {
  LOADING_INFO,
  PROCESSING,
  INFO,
  INFO_ITEMS_IN_LIST,
  SIGNED_OUT,
}

export type DownloadConfirmationProps = {
  fnClose?: () => void
  folderId?: string
  downloadCartPageUrl?: string
}

// add files to download list
async function addToDownload(
  token: string,
  closeConfirmationFn: () => void,
  queryBundleRequest?: QueryBundleRequest,
  folderId?: string,
  goToDownloadListFn?: () => void,
): Promise<[StatusEnum, string]> {
  try {
    const req: AddToDownloadListRequest = {
      query: queryBundleRequest?.query,
      concreteType:
        'org.sagebionetworks.repo.model.download.AddToDownloadListRequest',
      parentId: folderId,
    }
    await SynapseClient.addFilesToDownloadListV2(req, token)
    displayToast(
      'File(s) were successfully added to your Download List.',
      'success',
      {
        primaryButtonConfig: {
          text: 'View Download List',
          onClick: goToDownloadListFn,
        },
      },
    )
    closeConfirmationFn()
    return [StatusEnum.LOADING_INFO, '']
  } catch (error) {
    displayToast('danger', undefined, error.reason)
    closeConfirmationFn()
    return [StatusEnum.LOADING_INFO, '']
  }
}

type UiStateDictionary = {
  [key: string]: {
    className: string
    infoText: string | JSX.Element
    closeText: string
  }
}

// css classes, text, and close button text associated with different stages
const StatusConstruct: UiStateDictionary = {
  [StatusEnum.INFO]: {
    className: 'alert-info',
    infoText: 'Would you like to add all files to the download list?',
    closeText: 'Cancel',
  },
  [StatusEnum.INFO_ITEMS_IN_LIST]: {
    className: 'alert-info',
    infoText: (
      <>
        You already have files in your download list, which will be mixed with
        new files added to your download list.
        <br />
        We recommend completing or clearing your download list before adding
        these files.
      </>
    ),
    closeText: 'Cancel',
  },
  [StatusEnum.PROCESSING]: {
    className: 'alert-info',
    infoText: 'Adding Files To List',
    closeText: 'Cancel',
  },

  [StatusEnum.LOADING_INFO]: {
    className: 'alert-info',
    infoText: 'Calculating File Size',
    closeText: 'Cancel',
  },
  [StatusEnum.SIGNED_OUT]: {
    className: 'alert-danger',
    closeText: 'Close',
    infoText: (
      <>
        Please <SignInButton style={{ color: '#337ab7' }} /> to add files to
        your download list.
      </>
    ),
  },
}

const DownloadConfirmationContent = (props: {
  status: StatusEnum
  fileCount: number
  fileSize: number
}): JSX.Element => {
  switch (props.status) {
    case StatusEnum.LOADING_INFO:
    case StatusEnum.PROCESSING:
      return (
        <div>
          <span className={'spinner white'} />
          <span className={'spinner__text'}>
            {StatusConstruct[props.status].infoText}
          </span>
        </div>
      )

    case StatusEnum.SIGNED_OUT:
      return <>{StatusConstruct[props.status].infoText}</>
    case StatusEnum.INFO:
    case StatusEnum.INFO_ITEMS_IN_LIST:
      return (
        <>
          <DownloadDetails
            numFiles={props.fileCount}
            numBytes={props.fileSize}
          ></DownloadDetails>
          <span className="download-confirmation-infoText">
            {StatusConstruct[props.status].infoText}
          </span>
        </>
      )

    default:
      return <></>
  }
}

//============= DownloadConfirmation component =============

export const DownloadConfirmation: React.FunctionComponent<DownloadConfirmationProps> =
  ({ folderId, fnClose, downloadCartPageUrl = '/DownloadCart' }) => {
    const {
      data: queryResultBundle,
      getLastQueryRequest,
      topLevelControlsState,
      setTopLevelControlsState,
    } = useQueryWrapperContext()
    const { accessToken } = useSynapseContext()
    const [status, setStatus] = useState<StatusEnum>(
      accessToken ? StatusEnum.LOADING_INFO : StatusEnum.SIGNED_OUT,
    )

    const [fileCount, setFileCount] = useState(0)
    const [fileSize, setFileSize] = useState(0)

    const { data: downloadListStatistics, refetch } =
      useGetDownloadListStatistics()

    const lastQueryRequest = getLastQueryRequest()
    // is not defined (configured for a container)
    const [showDownloadList, setShowDownloadList] = useState(false)
    const updateStats = useCallback(
      (
        count?: number,
        bytes?: number,
        downloadListStatistics?: FilesStatisticsResponse,
      ) => {
        if (accessToken && downloadListStatistics) {
          const hasFilesInDownloadList =
            downloadListStatistics.totalNumberOfFiles > 0

          const size = bytes ?? 0
          const fileCount = count ?? 0
          setStatus(
            hasFilesInDownloadList
              ? StatusEnum.INFO_ITEMS_IN_LIST
              : StatusEnum.INFO,
          )
          setFileCount(fileCount)
          setFileSize(size)
        }
      },
      [accessToken],
    )

    const { data: entityChildrenData, isSuccess } = useGetEntityChildren({
      parentId: folderId,
      includeSumFileSizes: true,
      includeTotalChildCount: true,
      includeTypes: [EntityType.FILE],
    })
    useDeepCompareEffect(() => {
      if (isSuccess && entityChildrenData && downloadListStatistics) {
        updateStats(
          entityChildrenData.totalChildCount,
          entityChildrenData.sumFileSizesBytes,
          downloadListStatistics,
        )
      }
    }, [
      updateStats,
      folderId,
      isSuccess,
      entityChildrenData,
      downloadListStatistics,
    ])

    useDeepCompareEffect(() => {
      if (queryResultBundle && downloadListStatistics) {
        updateStats(
          queryResultBundle.queryCount,
          queryResultBundle.sumFileSizes?.sumFileSizesBytes,
          downloadListStatistics,
        )
      }
    }, [
      updateStats,
      lastQueryRequest,
      queryResultBundle,
      downloadListStatistics,
    ])

    const onCancel = fnClose
      ? () => fnClose()
      : () => {
          setTopLevelControlsState(state => ({
            ...state,
            showDownloadConfirmation: false,
          }))
        }

    const triggerAddToDownload = async () => {
      if (!accessToken) {
        setStatus(StatusEnum.SIGNED_OUT)
      } else {
        setStatus(StatusEnum.PROCESSING)
        const goToDownloadListFn = () => setShowDownloadList(true)
        const result = await addToDownload(
          accessToken,
          onCancel,
          lastQueryRequest,
          folderId,
          goToDownloadListFn,
        )
        const newStatus = result[0]
        setStatus(newStatus)
        refetch()
      }
    }

    if (showDownloadList) {
      // go to the Download Cart Page
      if (downloadCartPageUrl) window.location.href = downloadCartPageUrl
      else
        console.error(
          'Missing the Download Cart Page URL in the component configuration.',
        )
    }
    const showFacetFilter = topLevelControlsState?.showFacetFilter
    return (
      <>
        <Alert
          dismissible={false}
          show={true}
          variant={'info'}
          transition={false}
          className={`download-confirmation ${
            StatusConstruct[status].className
          } ${topLevelControlsState.showDownloadConfirmation ? '' : 'hidden'}
          ${
            showFacetFilter
              ? QUERY_FILTERS_EXPANDED_CSS
              : QUERY_FILTERS_COLLAPSED_CSS
          }
        `}
        >
          <DownloadConfirmationContent
            status={status}
            fileCount={fileCount}
            fileSize={fileSize}
          />
          <div className="download-confirmation-action">
            {status !== StatusEnum.PROCESSING && (
              <button className="btn btn-link" onClick={onCancel}>
                {StatusConstruct[status].closeText}
              </button>
            )}

            {(status === StatusEnum.INFO ||
              status === StatusEnum.INFO_ITEMS_IN_LIST) && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={triggerAddToDownload}
              >
                Add
              </button>
            )}
          </div>
        </Alert>
      </>
    )
  }
