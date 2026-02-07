import { useState, useEffect } from "react";
import { useTravelpayoutsVerification } from "@/hooks/useTravelpayoutsVerification";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/config/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useProfile } from "@/hooks/useProfile";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Smartphone, Star, Bell, Trash2, KeyRound, LogOut } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const Profile = () => {
  useTravelpayoutsVerification();
  useScrollToTop();
  const { user, signOut, resetPassword, deleteAccount } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !profileLoading) {
      navigate("/auth");
    }
  }, [user, profileLoading, navigate]);

  // Set reset email when user is available
  useEffect(() => {
    if (user?.email) {
      setResetEmail(user.email);
    }
  }, [user]);

  const getAvatarSrc = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    if (profile?.avatar_url) {
      return profile.avatar_url;
    }
    return null;
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat("de-CH", {
      year: "numeric",
      month: "long",
    });
    return `Mitglied seit ${formatter.format(date)}`;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error("Bitte gib eine E-Mail-Adresse ein");
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        toast.error("Fehler beim Senden der E-Mail: " + error.message);
      } else {
        toast.success("E-Mail zum Zurücksetzen des Passworts wurde gesendet!");
        setShowPasswordDialog(false);
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        toast.error("Fehler beim Löschen des Accounts: " + error.message);
      } else {
        toast.success("Account wurde gelöscht");
        navigate("/");
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const benefits = [
    {
      icon: Heart,
      title: "Favoriten dauerhaft speichern",
      description: "Deine Favoriten gehen nicht verloren, wenn du den Tab schliesst",
    },
    {
      icon: Smartphone,
      title: "Geräteübergreifend synchronisieren",
      description: "Greife von Handy und Desktop auf deine Trips zu",
    },
    {
      icon: Star,
      title: "Event-Bewertungen speichern",
      description: "Deine Bewertungen werden langfristig gespeichert",
    },
    {
      icon: Bell,
      title: "Benachrichtigungen erhalten",
      description: "Bald: Erhalte Updates zu neuen Events in deiner Region",
    },
  ];

  if (profileLoading || !user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Laden...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mein Profil - EventBuzzer</title>
        <meta name="description" content="Verwalte dein EventBuzzer Profil, deine Favoriten und gespeicherten Trips. Synchronisiere deine Events geräteübergreifend." />
        <meta property="og:title" content="Mein Profil - EventBuzzer" />
        <meta property="og:description" content="Verwalte dein EventBuzzer Profil und deine gespeicherten Events." />
        <meta property="og:url" content={`${SITE_URL}/profile`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <link rel="canonical" href={`${SITE_URL}/profile`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={getAvatarSrc() || undefined} alt={profile?.full_name || user.email || "User"} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <h1 className="font-serif text-4xl text-foreground italic mb-2">
              {profile?.full_name || `Hallo, ${user.email?.split("@")[0]}`}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 bg-white border border-neutral-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{favorites.length}</p>
                  <p className="text-sm text-muted-foreground">Favoriten</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border border-neutral-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Gespeicherte Trips</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border border-neutral-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">-</p>
                  <p className="text-sm text-muted-foreground">Event-Bewertungen</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Benefits Section */}
          <div className="mb-12">
            <h2 className="font-serif text-3xl text-foreground italic text-center mb-8">
              Deine Vorteile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="p-6 bg-white border border-neutral-100">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Account Info */}
          <Card className="p-6 bg-white border border-neutral-100 mb-8">
            <h2 className="font-serif text-2xl text-foreground italic mb-6">
              Account-Informationen
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">E-Mail</Label>
                <p className="text-foreground">{user.email}</p>
              </div>
              {profile?.full_name && (
                <div>
                  <Label className="text-sm text-muted-foreground">Name</Label>
                  <p className="text-foreground">{profile.full_name}</p>
                </div>
              )}
              {profile?.created_at && (
                <div>
                  <Label className="text-sm text-muted-foreground">Mitglied</Label>
                  <p className="text-foreground">{formatJoinDate(profile.created_at)}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowPasswordDialog(true)}
            >
              <KeyRound size={16} />
              Passwort ändern
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleSignOut}>
              <LogOut size={16} />
              Ausloggen
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 size={16} />
              Account löschen
            </Button>
          </div>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passwort ändern</DialogTitle>
            <DialogDescription>
              Wir senden dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-Mail</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="deine@email.ch"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handlePasswordReset} disabled={isResettingPassword}>
              {isResettingPassword ? "Sende..." : "Link senden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dies kann nicht rückgängig gemacht werden. Alle deine Favoriten, Trips und
              Bewertungen werden gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Lösche..." : "Ja, Account löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Profile;
