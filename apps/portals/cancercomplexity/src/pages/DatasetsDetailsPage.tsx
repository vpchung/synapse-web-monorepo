import { DetailsPageContent } from '@sage-bionetworks/synapse-portal-framework/components/DetailsPage/DetailsPageContentLayout'
import { DetailsPageContextConsumer } from '@sage-bionetworks/synapse-portal-framework/components/DetailsPage/DetailsPageContext'
import DetailsPage from '@sage-bionetworks/synapse-portal-framework/components/DetailsPage/index'
import { useGetPortalComponentSearchParams } from '@sage-bionetworks/synapse-portal-framework/utils/UseGetPortalComponentSearchParams'
import { ColumnSingleValueFilterOperator } from '@sage-bionetworks/synapse-types'
import {
  CardContainerLogic,
  ErrorPage,
  SynapseErrorType,
} from 'synapse-react-client'
import columnAliases from '../config/columnAliases'
import {
  datasetsSql,
  grantsSql,
  peopleSql,
  publicationSql,
} from '../config/resources'
import DatasetSvg from '../config/style/Dataset.svg?url'
import { datasetCardConfiguration } from '../config/synapseConfigs/datasets'
import { grantsCardConfiguration } from '../config/synapseConfigs/grants'
import { peopleCardConfiguration } from '../config/synapseConfigs/people'
import { publicationsCardConfiguration } from '../config/synapseConfigs/publications'
import { SharePageLinkButton } from 'synapse-react-client'
import { sharePageLinkButtonDetailPageProps } from '@sage-bionetworks/synapse-portal-framework/shared-config/SharePageLinkButtonConfig'

export default function DatasetsDetailsPage() {
  const { datasetId } = useGetPortalComponentSearchParams()

  if (!datasetId) {
    return <ErrorPage type={SynapseErrorType.NOT_FOUND} gotoPlace={() => {}} />
  }

  return (
    <>
      <SharePageLinkButton {...sharePageLinkButtonDetailPageProps} />
      <CardContainerLogic
        cardConfiguration={{
          ...datasetCardConfiguration,
          secondaryLabelLimit: Infinity,
          iconOptions: { dataset: DatasetSvg },
          isHeader: true,
        }}
        sql={datasetsSql}
        columnAliases={columnAliases}
        sqlOperator={ColumnSingleValueFilterOperator.EQUAL}
        searchParams={{ datasetId }}
      />
      <DetailsPage
        sql={datasetsSql}
        sqlOperator={ColumnSingleValueFilterOperator.EQUAL}
      >
        <DetailsPageContent
          content={[
            {
              id: 'Related Grants',
              title: 'Related Grants',
              helpText:
                'MC2 Center member grant(s) that supported development of the resource',
              element: (
                <DetailsPageContextConsumer columnName={'grantNumber'}>
                  {({ value }) => (
                    <CardContainerLogic
                      cardConfiguration={grantsCardConfiguration}
                      sql={grantsSql}
                      columnAliases={columnAliases}
                      sqlOperator={ColumnSingleValueFilterOperator.IN}
                      searchParams={{
                        grantNumber: value!,
                      }}
                    />
                  )}
                </DetailsPageContextConsumer>
              ),
            },
            {
              id: 'Related People',
              title: 'Related People',
              helpText:
                'Individual(s) that contributed to the development of the resource',
              element: (
                <DetailsPageContextConsumer columnName={'pubMedId'}>
                  {({ value }) => (
                    <CardContainerLogic
                      cardConfiguration={peopleCardConfiguration}
                      sql={peopleSql}
                      columnAliases={columnAliases}
                      sqlOperator={ColumnSingleValueFilterOperator.LIKE}
                      searchParams={{
                        publicationId: value!,
                      }}
                    />
                  )}
                </DetailsPageContextConsumer>
              ),
            },
            {
              id: 'Related Publications',
              title: 'Related Publications',
              helpText:
                'The publication in which the resource was first reported',
              element: (
                <DetailsPageContextConsumer columnName={'pubMedId'}>
                  {({ value }) => (
                    <CardContainerLogic
                      cardConfiguration={publicationsCardConfiguration}
                      sql={publicationSql}
                      columnAliases={columnAliases}
                      sqlOperator={ColumnSingleValueFilterOperator.EQUAL}
                      searchParams={{
                        pubMedId: value!,
                      }}
                    />
                  )}
                </DetailsPageContextConsumer>
              ),
            },
          ]}
        />
      </DetailsPage>
    </>
  )
}
