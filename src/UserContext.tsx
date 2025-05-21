<<<<<<< HEAD

import React, { createContext, useContext, useState, ReactNode } from "react";

interface UserData {
  id: string;
  phone: string;
  accessToken: string | null;
  isRegistered: boolean;
  username: string;
  bio: string;
  wallet: number;
  isPremium: boolean;
  referralEarnings: number;
  name?: string;
  gender?: string;
  dateOfBirth?: string;
  profession?: string;
  profilePic?: string;
  interests?: string[];
  maritalStatus?: string;
}

interface UserContextType {
  user: UserData;
  setUser: (user: UserData) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData>({
    id: "",
    phone: "",
    accessToken: null,
    isRegistered: false,
    username: "newuser",
    bio: "Welcome to AdTip!",
    wallet: 0,
    isPremium: false,
    referralEarnings: 0,
  });

=======
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

>>>>>>> bffb8d82164a4e29ac985da94d8b6a3e8e279e2c
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
<<<<<<< HEAD
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
=======
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
>>>>>>> bffb8d82164a4e29ac985da94d8b6a3e8e279e2c
