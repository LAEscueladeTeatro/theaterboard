import React, { createContext, useState, useContext } from 'react';

const GroupContext = createContext();

export const useGroup = () => useContext(GroupContext);

export const GroupProvider = ({ children }) => {
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
