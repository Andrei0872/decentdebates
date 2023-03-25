import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserCookieData, UserRoles } from 'src/entities/user/user.model';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor (private reflector: Reflector) { }
  
  // TODO: should take into account decorators placed on both the class & handler?
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const classRoles = this.reflector.get<UserRoles[]>('roles', context.getClass());
    const handlerRoles = this.reflector.get<UserRoles[]>('roles', context.getHandler());
    const hasRoles = classRoles || handlerRoles;
    if (!hasRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.session.user as UserCookieData;

    return this.doRolesMatch(classRoles || handlerRoles, user.role);
  }

  private doRolesMatch (acceptedRoles: UserRoles[], currentUserRole: UserRoles): boolean {
    return acceptedRoles.includes(currentUserRole);
  }
  
}
