import { useState, useEffect } from 'react';

const useUserPermissions = (moduleName) => {
    const [permissions, setPermissions] = useState({
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        isAdmin: false
    });

    useEffect(() => {
        const checkPermissions = () => {
            const userStr = localStorage.getItem('currentUser');
            if (!userStr) {
                setPermissions({ canView: false, canCreate: false, canEdit: false, canDelete: false, isAdmin: false });
                return;
            }

            try {
                const user = JSON.parse(userStr);
                
                // 1. Admin Access
                if (user.role === 'admin' || user.username === 'admin') {
                    setPermissions({
                        canView: true,
                        canCreate: true,
                        canEdit: true,
                        canDelete: true,
                        isAdmin: true
                    });
                    return;
                }

                // 2. Branch Access (Array of Objects)
                if (Array.isArray(user.permissions) && user.permissions.length > 0 && typeof user.permissions[0] === 'object') {
                    const modulePerms = user.permissions.find(p => p.module === moduleName);
                    if (modulePerms && modulePerms.actions) {
                        setPermissions({
                            canView: !!modulePerms.actions.view,
                            canCreate: !!modulePerms.actions.create,
                            canEdit: !!modulePerms.actions.edit,
                            canDelete: !!modulePerms.actions.delete,
                            isAdmin: false
                        });
                    } else {
                        // Module not found in permissions list -> No access
                        setPermissions({
                            canView: false,
                            canCreate: false,
                            canEdit: false,
                            canDelete: false,
                            isAdmin: false
                        });
                    }
                    return;
                }

                // 3. Simple Access (Array of Strings) - Fallback for other staff
                // If permissions is just a list of modules, assume full access if present
                if (Array.isArray(user.permissions) && user.permissions.includes(moduleName)) {
                     setPermissions({
                        canView: true,
                        canCreate: true,
                        canEdit: true,
                        canDelete: true,
                        isAdmin: false
                    });
                    return;
                }
                
                // Default: User exists but no permission for this module
                setPermissions({
                    canView: false,
                    canCreate: false,
                    canEdit: false,
                    canDelete: false,
                    isAdmin: false
                });

            } catch (e) {
                console.error("Error parsing user permissions", e);
            }
        };

        checkPermissions();
    }, [moduleName]);

    return permissions;
};

export default useUserPermissions;
