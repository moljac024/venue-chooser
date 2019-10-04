import React from "react"
import { Icon, Table, Button, Input, Header } from "semantic-ui-react"

import useVenues from "./use-venue-vote"
import { FourSquareVenues, MockInMemoryVenues } from "./venue-service"

export default () => {
  // I implemented this abstraction and this mock because I ran into a rate
  // limit on the foursquare API and I didn't want to wait around for that to
  // become available again. Also, I like the hexagonal architecture and
  // actually use this pattern quite often now.
  const VenueService =
    process.env.REACT_APP_MOCK_API === "1"
      ? MockInMemoryVenues()
      : FourSquareVenues()

  const {
    query,
    updateQuery,
    venues,
    participants,
    addParticipant,
    removeAllParticipants,
  } = useVenues(VenueService)

  return (
    <div>
      <span style={{ marginRight: 5 }}>
        <Input
          onChange={e => updateQuery(e.target.value)}
          placeholder="Search venues..."
          value={query}
          loading={venues == null}
        />
      </span>
      <Button.Group>
        <Button primary onClick={addParticipant}>
          Add a participant
        </Button>
        <Button.Or />
        <Button negative onClick={removeAllParticipants}>
          Remove all participants
        </Button>
      </Button.Group>

      <Table celled structured>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell
              rowSpan={venues != null && venues.length > 0 ? 2 : 1}
            >
              Name
            </Table.HeaderCell>
            {venues != null && venues.length > 0 ? (
              <Table.HeaderCell colSpan={venues.length || 1} textAlign="center">
                Venues
              </Table.HeaderCell>
            ) : null}
          </Table.Row>
          <Table.Row>
            {(venues || []).map(venue => {
              return (
                <Table.HeaderCell key={venue.id} positive={venue.winner}>
                  <Header as="h3">
                    {venue.url ? (
                      <a
                        target="_blank"
                        href={venue.url}
                        rel="noopener noreferrer"
                      >
                        {venue.name}
                      </a>
                    ) : (
                      venue.name
                    )}{" "}
                    {venue.winner && (
                      <Icon color="green" name="checkmark" size="large" />
                    )}
                  </Header>

                  <Header as="h4">
                    {venue.categories.length > 0
                      ? venue.categories.join(", ")
                      : "Uncategorized"}
                  </Header>

                  {venue.rating || "Unrated"}
                </Table.HeaderCell>
              )
            })}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {participants.map(participant => {
            return (
              <Table.Row key={participant.id}>
                <Table.Cell>
                  <Button
                    onClick={() => participant.remove()}
                    circular
                    icon="trash"
                    color="red"
                  />
                  <Input
                    onChange={e => participant.rename(e.target.value)}
                    value={participant.name}
                  />
                </Table.Cell>

                {venues
                  ? venues.map(venue => {
                      const votedFor = participant.votedFor === venue.id
                      return (
                        <Table.Cell
                          positive={venue.winner}
                          key={venue.id}
                          textAlign="center"
                          onClick={() => participant.voteFor(venue.id)}
                        >
                          {votedFor ? (
                            <Icon color="green" name="checkmark" size="large" />
                          ) : null}
                        </Table.Cell>
                      )
                    })
                  : null}
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
    </div>
  )
}
