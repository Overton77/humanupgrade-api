import {
  UpsertPlatformInput,
  UpsertChannelInput,
  UpsertSeriesInput,
  UpsertEpisodeInput,
  UpsertEpisodeSegmentsInput,
} from "../inputs/MediaInputs.js";
import { Platform } from "../types/PlatformModel.js";
import { Channel } from "../types/ChannelModel.js";
import { Series } from "../types/SeriesModel.js";
import { Episode } from "../types/EpisodeModel.js";
import {
  upsertPlatform,
  upsertChannel,
  upsertEpisode,
  upsertEpisodeSegments,
  upsertSeries,
} from "../../services/Media/mediaService.js";
import { type GraphQLContext } from "../context.js";

export const MediaResolvers = {
  upsertPlatform: async (
    _parent: unknown,
    args: { input: UpsertPlatformInput },
    ctx: GraphQLContext,
  ): Promise<Platform> => {
    const platform = await upsertPlatform(args.input);
    return platform;
  },
  upsertChannel: async (
    _parent: unknown,
    args: { input: UpsertChannelInput },
    ctx: GraphQLContext,
  ): Promise<Channel> => {
    const channel = await upsertChannel(args.input);
    return channel;
  },
  upsertSeries: async (
    _parent: unknown,
    args: { input: UpsertSeriesInput },
    ctx: GraphQLContext,
  ): Promise<Series> => {
    const series = await upsertSeries(args.input);
    return series;
  },
  upsertEpisode: async (
    _parent: unknown,
    args: { input: UpsertEpisodeInput },
    ctx: GraphQLContext,
  ): Promise<Episode> => {
    const episode = await upsertEpisode(args.input);
    return episode;
  },
  upsertEpisodeSegments: async (
    _parent: unknown,
    args: { input: UpsertEpisodeSegmentsInput },
    ctx: GraphQLContext,
  ): Promise<Episode> => {
    const episode = await upsertEpisodeSegments(args.input);
    return episode;
  },
};
