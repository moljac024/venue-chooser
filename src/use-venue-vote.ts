import { useEffect, useState, useReducer } from "react"
import { useDebounce } from "rooks"
import uuid from "uuid/v4"
import lodash from "lodash"

import { Venue, VenueService, VenueId } from "./venue-service"
import { assertNever } from "./utils"

function useVenues(Service: VenueService) {
  const [queryInput, setQueryInput] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [venues, setVenues] = useState<Venue[] | null>([])

  const updateQuery = (value: string) => {
    setQueryInput(value)
    updateAutocomplete(value)
  }
  const updateAutocomplete = useDebounce((value: string) => {
    setSearchValue(value)
  }, 500)

  useEffect(() => {
    let canceled = false

    const fetchVenues = async () => {
      if (searchValue === "") {
        return
      }
      try {
        setVenues(null)
        const venues = await Service.searchVenues(searchValue)
        if (!canceled) {
          setVenues(venues)
        }
      } catch (e) {
        setVenues([])
      }
    }

    fetchVenues()
    return () => {
      canceled = true
    }
  }, [searchValue])

  return {
    query: queryInput,
    updateQuery,
    venues,
  }
}

type TalliedVenue = Venue & {
  votes: number
  winner: boolean
}
type ParticipantId = string
type Participant = {
  id: ParticipantId
  name: string
  votedFor: VenueId | null
  voteFor: (venueId: VenueId) => void
  rename: (name: string) => void
  remove: () => void
}

type State = Participant[]
type Action =
  | {
      type: "ADDED_PARTICIPANT"
      payload: Participant
    }
  | {
      type: "REMOVED_PARTICIPANT"
      payload: ParticipantId
    }
  | {
      type: "RENAMED_PARTICIPANT"
      payload: { participantId: ParticipantId; name: string }
    }
  | {
      type: "VOTED"
      payload: {
        participantId: ParticipantId
        venueId: VenueId
      }
    }
  | {
      type: "RESET_VOTES"
    }
  | {
      type: "RESET_ALL"
    }

const initialState: State = []
const Reducer = (state: State, action: Action): State => {
  const participants = state
  if (action.type === "ADDED_PARTICIPANT") {
    return [...participants, action.payload]
  }

  if (action.type === "REMOVED_PARTICIPANT") {
    return participants.filter(participant => participant.id !== action.payload)
  }

  if (action.type === "RENAMED_PARTICIPANT") {
    return participants.map(participant => {
      if (participant.id === action.payload.participantId) {
        return { ...participant, name: action.payload.name }
      } else {
        return participant
      }
    })
  }

  if (action.type === "VOTED") {
    return participants.map(participant => {
      if (participant.id === action.payload.participantId) {
        return { ...participant, votedFor: action.payload.venueId }
      } else {
        return participant
      }
    })
  }

  if (action.type === "RESET_VOTES") {
    return participants.map(participant => ({ ...participant, vote: null }))
  }

  if (action.type === "RESET_ALL") {
    return initialState
  }

  return assertNever(action, state)
}

const tallyVotes = (
  venues: Venue[],
  participants: Participant[],
): TalliedVenue[] => {
  const venuesWithVotes = venues.map(venue => {
    return {
      ...venue,
      votes: lodash.sum(
        participants.map(p => (p.votedFor === venue.id ? 1 : 0)),
      ),
    }
  })

  const maxVotes = lodash.max(venuesWithVotes.map(v => v.votes)) || 0

  const talliedVenues: TalliedVenue[] = venuesWithVotes.map(venue => {
    return {
      ...venue,
      winner: venue.votes === maxVotes,
    }
  })

  // If more than one venue "won", then it's a tie and no one won.
  const winners = lodash.sum(talliedVenues.map(v => (v.winner ? 1 : 0)))
  if (winners > 1) {
    return talliedVenues.map(venue => ({ ...venue, winner: false }))
  }

  return talliedVenues
}

export default function useVenueVote(VenueService: VenueService) {
  const { query, updateQuery, venues } = useVenues(VenueService)
  const [participants, dispatch] = useReducer(Reducer, initialState)

  const voteFor = (participantId: string) => (venueId: VenueId) => {
    dispatch({
      type: "VOTED",
      payload: {
        participantId,
        venueId,
      },
    })
  }

  const removeParticipant = (participantId: ParticipantId) => () => {
    dispatch({
      type: "REMOVED_PARTICIPANT",
      payload: participantId,
    })
  }

  const renameParticipant = (participantId: ParticipantId) => (
    name: string,
  ) => {
    dispatch({
      type: "RENAMED_PARTICIPANT",
      payload: {
        participantId,
        name,
      },
    })
  }

  const addParticipant = () => {
    const id = uuid()
    const newParticipant = {
      id,
      name: "",
      votedFor: null,
      voteFor: voteFor(id),
      rename: renameParticipant(id),
      remove: removeParticipant(id),
    }
    dispatch({
      type: "ADDED_PARTICIPANT",
      payload: newParticipant,
    })
  }

  useEffect(() => {
    // When venues change, clear the votes. Note there is a small detail here
    // that I am not thrilled about. The component will render with the new
    // venues and the old participants once, before clearing the participants
    // and rendering again. It is too fast to be noticed by the human eye, but
    // it could be a potential for bugs.
    dispatch({ type: "RESET_VOTES" })
  }, [venues])

  return {
    query,
    updateQuery,

    venues: venues ? tallyVotes(venues, participants) : venues,

    participants,
    addParticipant,
    removeAllParticipants: () => dispatch({ type: "RESET_ALL" }),
  }
}
