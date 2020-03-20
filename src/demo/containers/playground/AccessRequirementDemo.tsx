import * as React from 'react'
import AccessRequirementList from 'lib/containers/access_requirement_list/AccessRequirementList'

type AccessRequirementDemoProps = {
  token: string
}

export const AccessRequirementDemo: React.FunctionComponent<AccessRequirementDemoProps> = props => {
  const { token } = props
  const [
    displayAccessRequirement,
    setDisplayAccessRequirement,
  ] = React.useState<boolean>(false)
  const [inputValue, setInputValue] = React.useState<string>('')

  const getAccessRequirement = () => {
    if (inputValue !== '' && inputValue.startsWith('syn')) {
      setDisplayAccessRequirement(!displayAccessRequirement)
    }
  }

  return (
    <div>
      {displayAccessRequirement ? (
        <AccessRequirementList
          onHide={() => {
            window.location.href = 'http://localhost:3000/Playground'
            setDisplayAccessRequirement(false)
          }}
          entityId={inputValue}
          token={token}
        />
      ) : (
        <>
          <p>SynId for Self Sign Access: syn3850484</p>
          <p>SynId for Terms Of Use: syn2426398</p>
          <p>SynId for Managed ACT Access: syn3191087</p>
          <p>SynId for ACT Access: syn12634840</p>

          <input
            id="AccessRequirementInput"
            type="text"
            placeholder="Synapse Id"
            onChange={event => {
              setInputValue(event.target.value)
            }}
          ></input>
          <button
            className="get-access-requirement-button"
            onClick={getAccessRequirement}
          >
            Get Access Requirement
          </button>
        </>
      )}
    </div>
  )
}
