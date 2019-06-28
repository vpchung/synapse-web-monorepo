import * as React from 'react'
import HeaderCard from './HeaderCard'
import { CardFooter, ShowMore, Icon } from './row_renderers/utils'
import { InternalLinkConfiguration } from './CardContainerLogic'

export type KeyToAlias = {
  key: string
  alias?: string
}

export type KeyToAliasMap = {
  [index: number]: KeyToAlias
  [index: string]: KeyToAlias
}

export type GenericCardSchema = {
  type: string
  title: string
  subTitle?: string
  description?: string
  icon?: string
  secondaryLabels?: KeyToAliasMap
  link?: string
}

export type IconOptions = {
  [index: string]: string
}
export type GenericCardProps = {
  iconOptions?: IconOptions
  backgroundColor?: string
  isHeader?: boolean
  genericCardSchema: GenericCardSchema,
  schema: any,
  data: any
  secondaryLabelLimit?: number
  hasInternalLink?: boolean
  internalLinkConfiguration?: InternalLinkConfiguration
}

export type GenericCardState = {
  showMoreDescription: boolean
}

// doi regex here - https://www.crossref.org/blog/dois-and-matching-regular-expressions/
// note - had to add an escape character for the second slash in the regex above
const DOI_REGEX = /^10.\d{4,9}\/[-._;()/:a-z0-9]+$/
// check for 'syn' followed and ended by a digit of unlimited length
const SYNAPSE_REGX = /syn\d+$/

export default class GenericCard extends React.Component<GenericCardProps, GenericCardState> {

  constructor(props: GenericCardProps) {
    super(props)
    this.state = {
      showMoreDescription: false,
    }
  }

  public toggleShowMoreDescription = (_event: React.SyntheticEvent) => {
    this.setState({
      showMoreDescription: !this.state.showMoreDescription
    })
  }

  public getLink (link: string, internalLinkConfiguration?: InternalLinkConfiguration, data?: string [], schema?: any) {
    let linkDisplay = link
    let target = '_self'
    if (link.match(SYNAPSE_REGX)) {
      // its a synId
      linkDisplay = `https://www.synapse.org/#!Synapse:${link}`
    } else if (link.match(DOI_REGEX)) {
      target = '_blank'
      linkDisplay = `https://dx.doi.org/${link}`
    } else if (!internalLinkConfiguration) {
      target = '_blank'
    } else if (internalLinkConfiguration) {
      if (!data || !schema) {
        throw Error('Must specify internalLinkConfiguration and data for linking to work')
      }
      const columnValuesLength = internalLinkConfiguration.columnValues.length
      const urlParams = internalLinkConfiguration.columnValues.map(
        (el, index) => {
          if (!schema.hasOwnProperty(el)) {
            console.error(`Could not find match for data: ${data} with columnName ${el}`)
          }
          const stringEnd = index < columnValuesLength - 1 ? '&' : ''
          return `${el}=${data[schema[el]]}${stringEnd}`
        }
      ).join('')
      // tested this link on the browser, there's no need to encode the URL, the browser picks up on that automatically
      linkDisplay = `#/${internalLinkConfiguration.baseURL}?${urlParams}`
    }
    return { linkDisplay, target }
  }

  render() {
    const {
      schema,
      data,
      genericCardSchema,
      secondaryLabelLimit,
      backgroundColor,
      iconOptions,
      isHeader = false,
      internalLinkConfiguration
    } = this.props
    const { link = '' } = genericCardSchema
    const type = genericCardSchema.type
    const title = data[schema[genericCardSchema.title]]
    const subTitle = genericCardSchema.subTitle && data[schema[genericCardSchema.subTitle]]
    const description = data[schema[genericCardSchema.description || '']]
    const iconValue = data[schema[genericCardSchema.icon || '']]
    // wrap link in parens because undefined would throw an error
    const linkValue: string = data[schema[link]] || ''
    const { linkDisplay, target } = this.getLink(linkValue.toLowerCase(), internalLinkConfiguration, data, schema)
    const values: string [][] = []
    if (genericCardSchema.secondaryLabels) {
      for (let i = 0; i < Object.keys(genericCardSchema.secondaryLabels).length; i += 1) {
        if (!genericCardSchema.secondaryLabels[i]) {
          throw Error(`Keys in genericCardSchema.secondaryLabels must be sequential, missing key: ${i}`)
        }
        const { key, alias = '' } =  genericCardSchema.secondaryLabels[i]
        const displayValue = alias ? alias : key
        const keyValue = [displayValue, data[schema[key]]]
        values.push(keyValue)
      }
    }

    const style: React.CSSProperties = {
      background: backgroundColor,
      // undefined, take default value from class
      marginTop: isHeader ? '0px' : undefined,
      marginBottom: isHeader ? '0px' : undefined
    }
    if (isHeader) {
      return (
        <HeaderCard
          type={type}
          title={title}
          subTitle={subTitle}
          backgroundColor={backgroundColor}
          description={description}
          iconValue={iconValue}
          iconOptions={iconOptions}
          values={values}
          secondaryLabelLimit={secondaryLabelLimit}
        />
      )
    }
    return (
      <div
        style={style}
        className={'SRC-portalCard'}
      >
        <div className="SRC-cardThumbnail">
          <Icon iconOptions={iconOptions} value={iconValue} type={type} />
        </div>
        <div className="SRC-cardContent">
          <div className="SRC-type">{type}</div>
          <div className="SRC-title">
            <h3 className="SRC-boldText SRC-blackText" style={{ margin: 'none' }}>
              {linkDisplay ?
                <a className="SRC-primary-text-color" target={target} href={linkDisplay}>
                  {title}
                </a>
                :
                title
              }
            </h3>
          </div>
          {subTitle && <div className="SRC-author"> {subTitle} </div>}
          {
            description &&
              <span className="SRC-font-size-base">
                <ShowMore onClick={this.toggleShowMoreDescription} summary={description} />
              </span>
          }
        </div>
        {genericCardSchema.secondaryLabels && <CardFooter secondaryLabelLimit={secondaryLabelLimit} values={values}/>}
      </div>
    )
  }
}
