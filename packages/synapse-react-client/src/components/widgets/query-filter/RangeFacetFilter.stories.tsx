import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { QueryVisualizationWrapper } from '../../QueryVisualizationWrapper'
import { QueryWrapper } from '../../QueryWrapper'
import { RangeFacetFilterUI } from './RangeFacetFilterUI'
import { VALUE_NOT_SET } from '../../../utils/SynapseConstants'
import { fn } from '@storybook/test'

const meta = {
  title: 'Explore/Components/Facets/RangeFacetFilter',
  component: RangeFacetFilterUI,
  decorators: [
    Story => (
      <QueryWrapper
        initQueryRequest={{
          concreteType:
            'org.sagebionetworks.repo.model.table.QueryBundleRequest',
          entityId: 'syn123',
          partMask: 0,
          query: {
            sql: 'select * from syn123',
          },
        }}
      >
        <QueryVisualizationWrapper>
          <Story />
        </QueryVisualizationWrapper>
      </QueryWrapper>
    ),
  ],
  args: {
    onAnySelected: fn(),
    onNotSetSelected: fn(),
    onRangeValueSelected: fn(),
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const NoneSelected: Story = {
  args: {
    label: 'foo',
    columnType: 'INTEGER',
    facetResult: {
      columnMin: '0',
      columnMax: '100',
    },
  },
}

export const NotAssignedSelected: Story = {
  args: {
    label: 'foo',
    columnType: 'INTEGER',
    facetResult: {
      columnMin: '0',
      columnMax: '100',
      selectedMin: VALUE_NOT_SET,
      selectedMax: VALUE_NOT_SET,
    },
  },
}

export const SelectedInteger: Story = {
  args: {
    label: 'foo',
    columnType: 'INTEGER',
    facetResult: {
      columnMin: '0',
      columnMax: '100',
      selectedMin: '5',
      selectedMax: '95',
    },
  },
}

export const SelectedDouble: Story = {
  args: {
    label: 'foo',
    columnType: 'DOUBLE',
    facetResult: {
      columnMin: '0',
      columnMax: '100',
      selectedMin: '5',
      selectedMax: '95',
    },
  },
}

export const SelectedDate: Story = {
  args: {
    label: 'foo',
    columnType: 'DATE',
    facetResult: {
      columnMin: '0',
      columnMax: '100',
      selectedMin: '5',
      selectedMax: '95',
    },
  },
}
