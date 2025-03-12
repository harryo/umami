import { z } from 'zod';
import thenby from 'thenby';
import { canViewWebsite } from '@/lib/auth';
import {
  SESSION_COLUMNS,
  EVENT_COLUMNS,
  FILTER_COLUMNS,
  OPERATORS,
  SEARCH_DOMAINS,
  SOCIAL_DOMAINS,
  EMAIL_DOMAINS,
  SHOPPING_DOMAINS,
  VIDEO_DOMAINS,
  PAID_AD_PARAMS,
} from '@/lib/constants';
import { getRequestFilters, getRequestDateRange, parseRequest } from '@/lib/request';
import { json, unauthorized, badRequest } from '@/lib/response';
import { getPageviewMetrics, getSessionMetrics, getChannelMetrics } from '@/queries';
import { filterParams } from '@/lib/schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const schema = z.object({
    type: z.string(),
    startAt: z.coerce.number().int(),
    endAt: z.coerce.number().int(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
    search: z.string().optional(),
    ...filterParams,
  });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { websiteId } = await params;
  const { type, limit, offset, search } = query;

  if (!(await canViewWebsite(auth, websiteId))) {
    return unauthorized();
  }

  const { startDate, endDate } = await getRequestDateRange(query);
  const column = FILTER_COLUMNS[type] || type;
  const filters = {
    ...getRequestFilters(query),
    startDate,
    endDate,
  };

  if (search) {
    filters[type] = {
      name: type,
      column,
      operator: OPERATORS.contains,
      value: search,
    };
  }

  if (SESSION_COLUMNS.includes(type)) {
    const data = await getSessionMetrics(websiteId, type, filters, limit, offset);

    if (type === 'language') {
      const combined = {};

      for (const { x, y } of data) {
        const key = String(x).toLowerCase().split('-')[0];

        if (combined[key] === undefined) {
          combined[key] = { x: key, y };
        } else {
          combined[key].y += y;
        }
      }

      return json(Object.values(combined));
    }

    return json(data);
  }

  if (EVENT_COLUMNS.includes(type)) {
    const data = await getPageviewMetrics(websiteId, type, filters, limit, offset);

    return json(data);
  }

  if (type === 'channel') {
    const data = await getChannelMetrics(websiteId, filters);

    const channels = getChannels(data);

    return json(
      Object.keys(channels)
        .map(key => ({ x: key, y: channels[key] }))
        .sort(thenby.firstBy('y', -1)),
    );
  }

  return badRequest();
}

const match = (value: string) => {
  return (str: string | RegExp) => {
    return typeof str === 'string' ? value?.includes(str) : (str as RegExp).test(value);
  };
};

function getChannel(domain, query) {
  if (!domain && !query) {
    return 'direct';
  }
  const prefix = /utm_medium=(.*cp.*|ppc|retargeting|paid.*)/.test(query) ? 'paid' : 'organic';

  if (SEARCH_DOMAINS.some(match(domain)) || /utm_medium=organic/.test(query)) {
    return `${prefix}Search`;
  }
  if (
    SOCIAL_DOMAINS.some(match(domain)) ||
    /utm_medium=(social|social-network|social-media|sm|social network|social media)/.test(query)
  ) {
    return `${prefix}Social`;
  }
  if (EMAIL_DOMAINS.some(match(domain)) || /utm_medium=(.*e[-_ ]?mail.*)/.test(query)) {
    return 'email';
  }
  if (
    SHOPPING_DOMAINS.some(match(domain)) ||
    /utm_campaign=(.*(([^a-df-z]|^)shop|shopping).*)/.test(query)
  ) {
    return `${prefix}Shopping`;
  }
  if (VIDEO_DOMAINS.some(match(domain)) || /utm_medium=(.*video.*)/.test(query)) {
    return `${prefix}Video`;
  }
  if (PAID_AD_PARAMS.some(match(query))) {
    return 'paidAds';
  }
  if (/utm_medium=affiliate/.test(query)) {
    return 'affiliate';
  }
  if (/utm_(source|medium)=sms/.test(query)) {
    return 'sms';
  }
  return 'referral';
}

function getChannels(data: { domain: string; query: string; visitors: number }[]) {
  const channels = {};

  for (const { domain, query, visitors } of data) {
    const channel = getChannel(domain, query);

    if (channel) {
      if (!channels[channel]) {
        channels[channel] = 0;
      }
      channels[channel] += Number(visitors);
    }
  }

  return channels;
}
