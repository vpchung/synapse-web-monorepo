import { library } from '@fortawesome/fontawesome-svg-core'
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import * as PropTypes from 'prop-types'
import * as React from 'react'
import { SynapseConstants } from '..'
import { getColorPallette } from './ColorGradient'
import { Facets } from './Facets'
import QueryWrapper from './QueryWrapper'
import StackedRowHomebrew from './StackedRowHomebrew'
import SynapseTable from './SynapseTable'
import SynapseTableCardView from './SynapseTableCardView'

library.add(faAngleLeft)
library.add(faAngleRight)

type MenuState = {
  menuIndex: number
}

type MenuConfig = {
  sql: string
  facetName: string
  facetDisplayValue?: string
  title?: string
  visibleColumnCount?: number
  unitDescription?: string
  synapseId: string
}

type Props = {
  menuConfig: MenuConfig []
  token: string
  type?: string
  rgbIndex: number
  loadingScreen?: JSX.Element
}

type Info = {
  isSelected: boolean
  originalColor: string
}

export default class Menu extends React.Component<Props, MenuState> {

  public static propTypes = {
    facetName: PropTypes.string,
    menuConfig: PropTypes.arrayOf(PropTypes.any),
    rgbIndex: PropTypes.number,
    token: PropTypes.string
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      menuIndex: 0
    }
    this.handleHoverLogic = this.handleHoverLogic.bind(this)
    this.switchFacet = this.switchFacet.bind(this)
  }

  /**
   * Handle the user hovering over a facet selection, it must be programatically
   * handled because the color used is dynamic
   *
   * @memberof Menu
   */
  public handleHoverLogic = (info: Info) => (event: React.MouseEvent<HTMLDivElement>) => {
    if (!info.isSelected && event.currentTarget.tagName === 'DIV') {
      event.currentTarget.style.backgroundColor = info.originalColor
    }
  }

  /**
   * Handle user clicking menu item, event isn't used so we denote it as an _
   *
   * @memberof Menu
   */
  public switchFacet = (menuIndex: number) => (_: React.MouseEvent<HTMLDivElement>) => {
    this.setState({ menuIndex })
  }

  public render() {
    const { token, menuConfig, rgbIndex, type, loadingScreen } = this.props

    const { colorPalette } = getColorPallette(rgbIndex, 1)
    const originalColor = colorPalette[0]

    const menuDropdown = menuConfig.map(
      (config: MenuConfig, index: number) => {

        const isSelected: boolean = (index === this.state.menuIndex)
        const style: any = {}
        let selectedStyling: string = ''

        if (isSelected) {
          // we have to programatically set the style since the color is chosen from a color
          // wheel
          style.background = originalColor
          // below has to be set so the pseudo element created will inherit its color
          // appropriately
          style.borderLeftColor = originalColor
          selectedStyling = 'SRC-pointed SRC-whiteText'
        } else {
          // change background to class
          selectedStyling = 'SRC-blackText SRC-light-background'
        }

        const infoEnter: Info = { isSelected, originalColor }
        const infoLeave: Info = { isSelected, originalColor: '#F5F5F5' }

        let facetDisplayValue: string = config.facetDisplayValue || ''
        if (!facetDisplayValue) {
          facetDisplayValue = config.facetName
        }

        return (
          <div
            onMouseEnter={this.handleHoverLogic(infoEnter)}
            onMouseLeave={this.handleHoverLogic(infoLeave)}
            key={config.facetName}
            className={`SRC-hoverWhiteText SRC-menu SRC-hand-cursor SRC-menu-hover SRC-hoverBox SRC-text-chart ${selectedStyling}`}
            onClick={this.switchFacet(index)}
            style={style}
          >
            {facetDisplayValue}
          </div>
        )
      }
    )
    const queryWrapper = menuConfig.map(
      (config: MenuConfig, index: number) => {
        const isSelected: boolean = (this.state.menuIndex === index)
        let className = ''
        if (!isSelected) {
          className = 'SRC-hidden'
        }
        let showSynTable = <div />
        if (config.title) {
          showSynTable = (
            <SynapseTable
              title={config.title}
              synapseId={config.synapseId}
              // specify visible column count
              visibleColumnCount={config.visibleColumnCount || 0}
            />)
        }
        return (
          <span key={config.facetName} className={className} >
            <QueryWrapper
              showMenu={true}
              initQueryRequest={{
                concreteType: 'org.sagebionetworks.repo.model.table.QueryBundleRequest',
                partMask:
                  // tslint:disable-next-line
                  SynapseConstants.BUNDLE_MASK_QUERY_COLUMN_MODELS |
                  SynapseConstants.BUNDLE_MASK_QUERY_FACETS |
                  SynapseConstants.BUNDLE_MASK_QUERY_RESULTS,
                query: {
                  isConsistent: false,
                  limit: 25,
                  offset: 0,
                  sql: config.sql,
                }
              }}
              unitDescription={config.unitDescription || ''}
              facetName={config.facetName}
              token={token}
              rgbIndex={rgbIndex}
            >
              <StackedRowHomebrew
                synapseId={config.synapseId}
                unitDescription={(config.unitDescription || '')}
                loadingScreen={loadingScreen}
              />
              <Facets />
              {showSynTable}
              {type ? <SynapseTableCardView type={type} /> : (<div />)}
            </QueryWrapper>
          </span>
        )
      }
    )

    return (
      <div className="container-fluid">
          <div className="col-xs-2 SRC-paddingTopNoMargin">
              {menuDropdown}
          </div>
          <div className="col-xs-10">
              {queryWrapper}
          </div>
      </div>
    )
  }
}
