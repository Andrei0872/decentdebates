import { ArgumentMetadata, HttpException, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { isNumber } from 'src/utils';

@Injectable()
export class DebateDraftPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const { debateId, draftId } = value;
    
    if (!isNumber(debateId)) {
      throw new HttpException(`'debateId' is expected to be a number.`, HttpStatus.BAD_REQUEST);
    }

    if (!isNumber(draftId)) {
      throw new HttpException(`'draftId' is expected to be a number.`, HttpStatus.BAD_REQUEST);
    }
    
    return value;
  }
}
