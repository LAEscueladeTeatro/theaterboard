import React, { createContext, useState } from 'react';

export const GroupContext = createContext();

const GroupProvider = ({ children }) => {
    const [selectedGroupId, setSelectedGroupId] = useState('all'); // 'all' o un ID de grupo

    const value = {
        selectedGroupId,
        setSelectedGroupId,
    };

    return (
        <GroupContext.Provider value={value}>
            {children}
        </GroupContext.Provider>
    );
};

export default GroupProvider;
