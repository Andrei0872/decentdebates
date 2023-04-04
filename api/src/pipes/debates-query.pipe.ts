import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { Filters, RawFilters, TagsMatchingStrategy } from 'src/entities/debates/debates.service';

// TODO: make sure no other filter keys beyond the established ones are accepted.

const tagsMatchingStrategyMap = {
  'any': TagsMatchingStrategy.ANY,
  'all': TagsMatchingStrategy.ALL,
};

@Injectable()
export class DebatesQueryPipe implements PipeTransform {
  transform(encodedQuery: any, metadata: ArgumentMetadata): Filters {
    if (!encodedQuery) {
      return null;
    }

    const decodedQuery = Buffer.from(encodedQuery, 'base64').toString();
    const rawFilters = JSON.parse(decodedQuery) as RawFilters;

    const filters: Filters = {
      tags: {}
    };

    if ('queryStr' in rawFilters && !rawFilters.queryStr) {
      delete rawFilters.queryStr;
    }

    if (!Object.keys(rawFilters).length) {
      return null;
    }

    if (rawFilters.queryStr) {
      filters.queryStr = rawFilters.queryStr;
    }

    if (rawFilters.tags) {
      filters.tags.values = rawFilters.tags;
      filters.tags.matchingStrategy = tagsMatchingStrategyMap[rawFilters.tags_match] ?? TagsMatchingStrategy.ANY;
    }

    if (!Object.keys(filters.tags).length) {
      delete filters.tags;
    }

    return filters;
  }
}
