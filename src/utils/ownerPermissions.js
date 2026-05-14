export function hasOwnerPermission(permissionBundle, permissionKey) {
    if (!permissionBundle) return false;
  
    if (permissionBundle.owner === true) return true;
  
    const permissions = Array.isArray(permissionBundle.permissions)
      ? permissionBundle.permissions
      : [];
  
    return permissions.includes(
      String(permissionKey || '').trim().toUpperCase()
    );
  }
  
  export function hasAnyOwnerPermission(permissionBundle, permissionKeys = []) {
    if (!permissionBundle) return false;
  
    if (permissionBundle.owner === true) return true;
  
    return permissionKeys.some((key) =>
      hasOwnerPermission(permissionBundle, key)
    );
  }