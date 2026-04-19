"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "../store/slices/user.slice";

const LS_KEY = "@@user";

export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const storedUser = localStorage.getItem(LS_KEY);

    if (storedUser) {
      dispatch(setCurrentUser(JSON.parse(storedUser)));
    }
  }, [dispatch]);

  return children;
}
