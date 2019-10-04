import React from "react"

import VenueChooser from "./VenueChooser"

const App: React.FC = () => {
  return (
    <div
      className="app"
      style={{
        margin: "auto",
        maxWidth: "1080px",
        paddingTop: 20,
      }}
    >
      <VenueChooser />
    </div>
  )
}

export default App
