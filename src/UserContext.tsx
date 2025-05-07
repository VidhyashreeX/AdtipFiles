import React, { createContext, useContext, useEffect, useState } from "react";

type UserData = {
  id: string | null;
  accessToken: string | null;
  phone: string | null;
  isRegistered?: boolean;
  username?: string;
  bio?: string;
  wallet?: number;
  isPremium?: boolean;
  referralEarnings?: number;
  name?: string;
  gender?: string;
  dateOfBirth?: string;
  profession?: string;
  profilePic?: string;
  interests?: string[];
};

const UserContext = createContext<{
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
}>({
  user: { id: null, accessToken: null, phone: null },
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser
      ? JSON.parse(storedUser)
      : { id: null, accessToken: null, phone: null };
  });

  useEffect(() => {
    if (user.id !== null && user.accessToken !== null) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};