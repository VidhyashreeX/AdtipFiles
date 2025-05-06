import React, { createContext, useContext, useEffect, useState } from 'react';

type UserData = {
  id: number | null;
  accessToken: string | null;
  phone: string | null;
};

const UserContext = createContext<{
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
}>({
  user: { id: null, accessToken: null, phone: null },
  setUser: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData>(() => {
    // ✅ Load from localStorage on first load
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : { id: null, accessToken: null, phone: null };
  });

  // ✅ Save to localStorage whenever user changes
  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}



/*
import React, { createContext, useContext, useState } from 'react';

type UserData = {
  id: number | null;
  accessToken: string | null;
  phone: string | null;
};

const UserContext = createContext<{
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
}>({
  user: { id: null, accessToken: null, phone: null },
  setUser: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData>({
    id: null,
    accessToken: null,
    phone: null,
  });
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
*/

//This will store user id + token globally