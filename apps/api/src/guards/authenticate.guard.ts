import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class AuthenticateGuard implements CanActivate {
  constructor (private reflector: Reflector) { }
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const hasSkipFlagOnController = !!this.reflector.get<boolean>('skipAuth', context.getClass());
    const hasSkipFlagOnHandler = !!this.reflector.get<boolean>('skipAuth', context.getHandler());
    const shouldSkipAuth = hasSkipFlagOnController || hasSkipFlagOnHandler;
    if (shouldSkipAuth) {
      return true;
    }
    
    const req = context.switchToHttp().getRequest();

    if (!req.session || !req.session.user) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
