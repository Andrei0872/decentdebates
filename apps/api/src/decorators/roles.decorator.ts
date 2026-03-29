import { SetMetadata } from "@nestjs/common";
import { UserRoles } from "src/entities/user/user.model";

export const Roles = (...roles: UserRoles[]) => SetMetadata('roles', roles);
