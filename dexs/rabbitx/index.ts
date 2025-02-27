import fetchURL from "../../utils/fetchURL"
import { FetchResultVolume, SimpleAdapter } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";

const historicalVolumeEndpoint = "https://api.prod.rabbitx.io/markets"
const candles = (market: string, timestampFrom: number, timestampTo: number) => {
  const url = `https://api.prod.rabbitx.io/candles?market_id=${market}&timestamp_from=${timestampFrom}&timestamp_to=${timestampTo}&period=1440`;
  return url;

}

interface IVolumeall {
  volume: string;
  time: string;
  close: string;
}

const fetchVolume = async (timestamp: number): Promise<FetchResultVolume> => {
  const fromTimestamp = timestamp - 60 * 60 * 24
  const toTimestamp = timestamp

  // Get market data
  const response = await fetchURL(historicalVolumeEndpoint);
  const marketsData = response.data.result;

  // Fetch candles for each USD market
  const historical: IVolumeall[] = (await Promise.all(marketsData.map((market: any) => fetchURL(candles(market.id, fromTimestamp, toTimestamp)))))
    .map((e: any) => e.data.result)
    .flat();

  // Calculate daily volume
  const dailyVolume = historical
    .filter((e: IVolumeall) => Number(e.time) >= fromTimestamp )
    .filter((e: IVolumeall) => Number(e.time) <= toTimestamp)
    .reduce((a: number, b: IVolumeall) => a + Number(b.volume), 0)

  return {
    dailyVolume: dailyVolume ? `${dailyVolume}` : undefined,
    timestamp: timestamp,
  };
};

const adapter: SimpleAdapter = {
  adapter: {
    [CHAIN.STARKNET]: {
      fetch: fetchVolume,
      start: async () => 1700179200, // Replace with actual start timestamp
    },
  },
};

export default adapter;
