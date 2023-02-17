import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { Filters } from 'src/entities/debates/debates.service';

@Injectable()
export class DebatesQueryPipe implements PipeTransform {
  transform(encodedQuery: any, metadata: ArgumentMetadata) {
    if (!encodedQuery) {
      return null;
    }

    const decodedQuery = Buffer.from(encodedQuery, 'base64').toString();
    const filters = JSON.parse(decodedQuery) as Filters;

    if ('queryStr' in filters && !filters.queryStr) {
      delete filters.queryStr;
    }

    if (!Object.keys(filters).length) {
      return null;
    }

    return filters;
  }
}
