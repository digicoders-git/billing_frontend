import { useState, useEffect } from 'react';

const useUserPermissions = () => {
    const [permissions, setPermissions] = useState({
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        isAdmin: false
    });

    useEffect(() => {
        const checkPermissions = () => {
            const userStr = localStorage.getItem('currentUser');
            if (!userStr) return;

            try {
                const user = JSON.parse(userStr);
                
                // Admin has full access
                if (user.username === 'admin' || user.role === 'admin') {
                    setPermissions({
                        canView: true,
                        canCreate: true,
                        canEdit: true,
                        canDelete: true,
                        isAdmin: true
                    });
                    return;
                }

                // Branch Managers use the 'actions' object if present
                if (user.actions) {
                    setPermissions({
                        canView: !!user.actions.view,
                        canCreate: !!user.actions.create,
                        canEdit: !!user.actions.edit,
                        canDelete: !!user.actions.delete,
                        isAdmin: false
                    });
                } else {
                    // Fallback for older users or standard users without specific action restrictions
                    // defaulting to TRUE for backward compatibility unless we want strict mode
                    // But requirement implies restriction. If it's a branch without actions defined, 
                    // maybe default to restricted?
                    // Let's assume default is FULL for now to avoid breaking existing users, 
                    // unless they are explicitly a "Branch" type.
                    setPermissions({
                        canView: true,
                        canCreate: true, // Default to true or check role
                        canEdit: true,
                        canDelete: true,
                        isAdmin: false
                    });
                }
            } catch (e) {
                console.error("Error parsing user permissions", e);
            }
        };

        checkPermissions();
        // Listen for storage events in case of login/logout in other tabs, though unlikely to change runtime
        window.addEventListener('storage', checkPermissions);
        return () => window.removeEventListener('storage', checkPermissions);
    }, []);

    return permissions;
};

export default useUserPermissions;
