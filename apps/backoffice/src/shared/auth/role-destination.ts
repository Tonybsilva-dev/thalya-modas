export const roleSegments: Record<string,string> = {
 ROLE_SUPER_ADMIN:"backoffice",ROLE_ADMIN:"admin",ROLE_MANAGER:"manager",ROLE_EMPLOYEE:"employee",ROLE_CUSTOMER:"customer",
};
export function getBackofficeDestination(role:string) {
 const segment=roleSegments[role];
 return segment === "backoffice" ? "/backoffice" : segment ? `/${segment}/dashboard` : "/unauthorized";
}
