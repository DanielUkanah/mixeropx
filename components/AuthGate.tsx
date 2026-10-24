"use client";
import { useStore } from "@/lib/store";
import { firebaseReady } from "@/lib/firebase";
import Login from "./Login";

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="panel w-full max-w-md space-y-3">
        <p className="text-lg font-semibold">{title}</p>
        <div className="space-y-3 text-sm text-ink/70">{children}</div>
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, authReady, ready, dataError, signOut } = useStore();

  if (!firebaseReady) {
    return (
      <Message title="Firebase isn't connected yet">
        <p>Create a file called <code>.env.local</code> in the project folder, paste your Firebase values in, then stop and restart <code>npm run dev</code>.</p>
      </Message>
    );
  }
  if (!authReady) return null;
  if (!user) return <Login />;
  if (dataError) {
    return (
      <Message title="This account can't open the books">
        <p>Signed in as {user.email}. Ask the owner to add this email to the Firestore rules, or check that the rules were published.</p>
        <button className="btn-quiet" onClick={() => signOut()}>Sign out</button>
      </Message>
    );
  }
  if (!ready) return <Message title="Loading the books…"><p>One moment.</p></Message>;
  return <>{children}</>;
}