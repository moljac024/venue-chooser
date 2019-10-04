// I would usually reach for axios and this is the first I heard of this
// library, but recently it has become clear that axios is pretty dead and a
// potential security risk.
import ky from "ky"
import uuid from "uuid/v4"
import Chance from "chance"

export type VenueId = string
export type Venue = {
  id: VenueId
  name: string
  url: string | null
  rating: number | null
  categories: string[]
}

export type VenueService = {
  getVenue: (id: string) => Promise<Venue>
  searchVenues: (location: string) => Promise<Venue[]>
}

export type VenueServiceFactory = () => VenueService

export const FourSquareVenues: VenueServiceFactory = () => {
  const FOURSQUARE_FOOD_CATEGORY_ID = "4d4b7105d754a06374d81259"

  type SearchParams = {
    [key: string]: string
  }

  // Obviously a very small subset of api calls is supported via this. Only GET
  // requests, for instance.
  const doFoursquareApiCall = async (
    url: string,
    searchParams: SearchParams = {},
  ) => {
    const CLIENT_ID = process.env.REACT_APP_FOURSQUARE_CLIENT_ID || ""
    const CLIENT_SECRET = process.env.REACT_APP_FOURSQUARE_CLIENT_SECRET || ""
    const baseParams = {
      client_secret: CLIENT_SECRET,
      client_id: CLIENT_ID,
      v: "20190724",
    }

    const response = await ky.get(url, {
      searchParams: {
        ...baseParams,
        ...searchParams,
      },
    })
    const json = await response.json()

    return json.response
  }

  const getVenue = async (id: string): Promise<Venue> => {
    const url = `https://api.foursquare.com/v2/venues/${id}`
    const response = await doFoursquareApiCall(url)
    const venue = response.venue

    return {
      id: venue.id,
      name: venue.name,
      url: venue.url || venue.canonicalUrl || null,
      rating: venue.rating || null,
      categories: (venue.categories || []).map((c: any) => c.name),
    }
  }

  const searchVenues = async (address: string): Promise<Venue[]> => {
    const url = "https://api.foursquare.com/v2/venues/search"
    const params = {
      // I am unsure about this query here, the results seem better without it
      query: "lunch",
      near: address,
      limit: "3",
      // Why this category limit? Because, when searching for Berlin I kept
      // getting a "secret lunch place", which was just a pin in a park.
      // Probably someone tagged that as a picnic location or something. Not a
      // suitable venue for the purposes of this app IMO.
      categoryId: FOURSQUARE_FOOD_CATEGORY_ID,
    }

    try {
      const data = await doFoursquareApiCall(url, params)

      const venues = await Promise.all(
        data.venues.map((venue: any) => getVenue(venue.id)),
      )

      return venues as Venue[]
    } catch (e) {
      // Not enough time to handle this error. In real use, I would wrap the
      // whole thing in a Result type, with distinct success and error tracks,
      // forcing error handling at all call-sites. You can get a sneak peak,
      // because I added the Result type/"monad" but converting everything to it
      // would have taken too much time.
      return []
    }
  }
  return {
    getVenue,
    searchVenues,
  }
}

export const MockInMemoryVenues: VenueServiceFactory = () => {
  function RandomGeneratedVenue(): Venue {
    const chance = new Chance()
    const coinFlip = (weight: number = 0.5) => Math.random() <= weight

    const generateRating = () => {
      const rating = chance.floating({ min: 2, max: 9.5 })
      return parseFloat(rating.toFixed(1))
    }

    return {
      id: uuid(),
      name: chance.name(),
      url: coinFlip(0.8) ? chance.url() : null,
      rating: coinFlip(0.7) ? generateRating() : null,
      categories: coinFlip(0.3) ? [] : [chance.word()],
    }
  }

  async function delay(ms: number, value?: any) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(value || null)
      }, ms)
    })
  }

  const getVenue = async (_id: string) => {
    await delay(200)
    return RandomGeneratedVenue()
  }

  const searchVenues = async (_location: string) => {
    await delay(200)
    return [
      RandomGeneratedVenue(),
      RandomGeneratedVenue(),
      RandomGeneratedVenue(),
    ]
  }

  return {
    getVenue,
    searchVenues,
  }
}
