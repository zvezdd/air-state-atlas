import { USMap } from "@/components/USMap";
import { Header } from "@/components/Header";
import { ProfileSheet } from "@/components/ProfileSheet";
import { AQIHeader } from "@/components/AQIHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Redirect to auth if not logged in
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!user) {
    return null; // Will redirect to /auth
  }

  return (
    <>
      <AQIHeader open={profileSheetOpen} />
      <ProfileSheet
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        user={user}
      />
      <div className={profileSheetOpen ? "opacity-40" : ""}>
        <Header user={user} onMenuClick={() => setProfileSheetOpen(true)} />
        <main className="min-h-screen bg-background">
          <USMap />
        </main>
      </div>
    </>
  );
};

export default Index;
