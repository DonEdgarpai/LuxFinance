import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useUser } from '@clerk/nextjs';
import { auth } from '@/src/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

export function useFirebaseAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    const signInToFirebase = async () => {
      if (isSignedIn && user) {
        try {
          setLoading(true);
          setError(null);
          
          const response = await fetch('/api/getFirebaseToken', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
          });
          
          if (!response.ok) {
            throw new Error(`Error al obtener el token de Firebase: ${response.status} ${response.statusText}`);
          }
          
          const { token } = await response.json();
          
          const firebaseCredential = await signInWithCustomToken(auth, token);
          setFirebaseUser(firebaseCredential.user);
        } catch (error) {
          console.error("Error al iniciar sesión en Firebase:", error);
          setError(error instanceof Error ? error.message : 'Error desconocido al autenticar con Firebase');
          setFirebaseUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setFirebaseUser(null);
        setLoading(false);
      }
    };

    if (isLoaded) {
      signInToFirebase();
    }
  }, [isLoaded, isSignedIn, user]);

  return { firebaseUser, loading, error };
}