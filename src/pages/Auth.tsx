import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Bitte gib eine gültige E-Mail-Adresse ein");
const passwordSchema = z.string().min(6, "Passwort muss mindestens 6 Zeichen haben");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successType, setSuccessType] = useState<'login' | 'signup'>('signup');

  const { user, signIn, signUp, signInWithGoogle, signInWithSpotify, signInWithApple, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only auto-redirect if not showing success screen
    if (user && !showSuccessScreen) {
      navigate("/");
    }
  }, [user, showSuccessScreen, navigate]);

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
    } catch {
      toast.error("Bitte gib eine gültige E-Mail-Adresse ein");
      return false;
    }
    
    try {
      passwordSchema.parse(password);
    } catch {
      toast.error("Passwort muss mindestens 6 Zeichen haben");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInputs()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("E-Mail oder Passwort falsch. Bist du schon registriert?");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Bitte bestätige zuerst deine E-Mail-Adresse");
          } else if (error.message.includes("User not found")) {
            toast.error("Diese E-Mail ist noch nicht registriert. Erstelle zuerst ein Konto.");
          } else {
            toast.error("Login fehlgeschlagen: " + error.message);
          }
        } else {
          setSuccessType('login');
          setShowSuccessScreen(true);
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered") || error.message.includes("User already registered")) {
            toast.error("Diese E-Mail ist bereits registriert. Melde dich stattdessen an.");
          } else {
            toast.error("Registrierung fehlgeschlagen: " + error.message);
          }
        } else {
          // Successful signup - show success screen
          setSuccessType('signup');
          setShowSuccessScreen(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch {
      toast.error("Bitte gib eine gültige E-Mail-Adresse ein");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error("Fehler beim Senden der E-Mail: " + error.message);
      } else {
        toast.success("E-Mail zum Zurücksetzen des Passworts wurde gesendet!");
        setIsForgotPassword(false);
        setIsLogin(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error("Google Login fehlgeschlagen: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpotifySignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithSpotify();
      if (error) {
        toast.error("Spotify Login fehlgeschlagen: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        toast.error("Apple Login fehlgeschlagen: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message after login or signup
  if (showSuccessScreen) {
    const isSignup = successType === 'signup';
    // Get name from user metadata (for login) or from fullName state (for signup)
    const displayName = isSignup
      ? fullName
      : (user?.user_metadata?.full_name || email.split('@')[0]);

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif text-4xl text-foreground italic mb-4">
              {isSignup ? 'Account erstellt! 🎉' : 'Willkommen zurück! 👋'}
            </h1>
            <p className="text-muted-foreground mb-2">
              {isSignup
                ? `Willkommen bei EventBuzzer, ${displayName}!`
                : `Schön, dass du wieder da bist, ${displayName}!`
              }
            </p>
            <p className="font-medium text-foreground mb-4">
              {email}
            </p>
            {isSignup ? (
              <div className="text-left space-y-2 mb-4">
                <p className="text-muted-foreground text-center mb-3">
                  Du kannst jetzt diese Vorteile nutzen:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Favoriten dauerhaft speichern</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Trips planen und synchronisieren</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Event-Bewertungen speichern</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Benachrichtigungen erhalten</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">
                Du hast jetzt Zugriff auf all deine gespeicherten Favoriten und Trips.
              </p>
            )}
          </div>
          <Button
            onClick={() => navigate("/")}
            className="w-full h-12"
          >
            Zu den Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Benefits Section - Left Side (only show on signup) */}
        {!isLogin && !isForgotPassword && (
          <div className="order-2 lg:order-1 space-y-8">
            <div>
              <h2 className="font-serif text-3xl lg:text-4xl text-foreground italic mb-4">
                Deine Vorteile mit einem Konto
              </h2>
              <p className="text-muted-foreground text-lg">
                Entdecke Schweizer Events personalisiert und ohne Limits
              </p>
            </div>

            <div className="space-y-6">
              {/* Benefit 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Favoriten dauerhaft speichern</h3>
                  <p className="text-muted-foreground">
                    Speichere deine liebsten Events und greife von überall darauf zu
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Trip-Planer nutzen</h3>
                  <p className="text-muted-foreground">
                    Plane deine Trips mit mehreren Events und speichere sie dauerhaft
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Benachrichtigungen erhalten</h3>
                  <p className="text-muted-foreground">
                    Verpasse keine neuen Events in deinen Lieblingskategorien
                  </p>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Geräte-übergreifend synchronisieren</h3>
                  <p className="text-muted-foreground">
                    Nutze EventBuzzer auf allen deinen Geräten mit synchronisierten Daten
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                ✓ Kostenlos · ✓ Keine Kreditkarte nötig · ✓ Jederzeit kündbar
              </p>
            </div>
          </div>
        )}

        {/* Form Section */}
        <div className={`w-full max-w-md mx-auto ${!isLogin && !isForgotPassword ? 'order-1 lg:order-2' : ''}`}>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl text-foreground italic mb-2">
              {isForgotPassword
                ? "Passwort zurücksetzen"
                : isLogin
                  ? "Willkommen zurück"
                  : "Konto erstellen"}
            </h1>
            <p className="text-muted-foreground">
              {isForgotPassword
                ? "Gib deine E-Mail-Adresse ein, um dein Passwort zurückzusetzen"
                : isLogin
                  ? "Logge dich ein, um deine Favoriten zu sehen"
                  : "Registriere dich für personalisierte Empfehlungen"}
            </p>
          </div>

        {/* Social Login Buttons - only show if not forgot password */}
        {!isForgotPassword && (
          <>
            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full mb-3 h-11 text-sm font-medium bg-white hover:bg-gray-50"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Mit Google fortfahren
            </Button>

            {/* Spotify */}
            <Button
              type="button"
              variant="outline"
              className="w-full mb-3 h-11 text-sm font-medium bg-white hover:bg-gray-50"
              onClick={handleSpotifySignIn}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Mit Spotify fortfahren
            </Button>

            {/* Apple */}
            <Button
              type="button"
              variant="outline"
              className="hidden w-full mb-6 h-11 text-sm font-medium bg-white hover:bg-gray-50"
              onClick={handleAppleSignIn}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Mit Apple fortfahren
            </Button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">oder</span>
              </div>
            </div>
          </>
        )}

        {/* Form */}
        <form
          onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}
          className="space-y-4"
        >
          {!isLogin && !isForgotPassword && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Dein Name"
                value={fullName}
                onChange={(e) => {
                  // Capitalize first letter of each word, keep rest as typed
                  const formatted = e.target.value
                    .split(' ')
                    .map(word => {
                      if (word.length === 0) return word;
                      return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(' ');
                  setFullName(formatted);
                }}
                className="h-12"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="deine@email.ch"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
          </div>

          {!isForgotPassword && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Passwort vergessen?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading
              ? "Laden..."
              : isForgotPassword
                ? "Link senden"
                : isLogin
                  ? "Einloggen"
                  : "Registrieren"}
          </Button>
        </form>

        {/* Toggle */}
        <p className="text-center mt-6 text-muted-foreground">
          {isForgotPassword ? (
            <>
              Zurück zur{" "}
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                }}
                className="text-primary hover:underline font-medium"
              >
                Anmeldung
              </button>
            </>
          ) : (
            <>
              {isLogin ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Jetzt registrieren" : "Einloggen"}
              </button>
            </>
          )}
        </p>

          {/* Back Link */}
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ← Zurück zur Startseite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
