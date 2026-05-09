import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from '../services/firebaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const accessToken = await firebaseUser.getIdToken();
        const firebaseSession = {
          user: firebaseUser,
          access_token: accessToken,
        };
        setSession(firebaseSession);
        setUser(firebaseUser);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading,
    signIn: async (email, password) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const accessToken = await userCredential.user.getIdToken();
        return {
          data: {
            user: userCredential.user,
            session: {
              user: userCredential.user,
              access_token: accessToken,
            },
          },
          error: null,
        };
      } catch (error) {
        return { data: null, error };
      }
    },
    signUp: async (email, password) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const accessToken = await userCredential.user.getIdToken();
        return {
          data: {
            user: userCredential.user,
            session: {
              user: userCredential.user,
              access_token: accessToken,
            },
          },
          error: null,
        };
      } catch (error) {
        return { data: null, error };
      }
    },
    signOut: async () => {
      try {
        await firebaseSignOut(auth);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
