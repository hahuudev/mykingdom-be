import { SetMetadata } from '@nestjs/common';

import { AdminRoles } from '../enums';

export const ROLES_KEY = 'roles';
export const AdminRolesAllowed = (...roles: AdminRoles[]) => SetMetadata(ROLES_KEY, roles);
