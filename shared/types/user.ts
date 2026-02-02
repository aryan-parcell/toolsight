export type UserRole = 'admin' | 'maintainer';

export interface User {
    id?: string;
    email: string;
    displayName: string;
    organizationId: string;
    role: UserRole;
    fcmToken?: string;
    lastLogin?: Date;
}