import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Check, MapPin, AlertCircle, Loader2, Upload, X } from "lucide-react";
import { partnerEventSchema } from "@/utils/partnerFormValidation";
import Navbar from "@/components/Navbar";

interface TaxonomyItem {
  id: number;
  name: string;
  slug: string;
  type: "main" | "sub";
  parent_id: number | null;
}

const PartnerUpload = () => {
  // Form state - Required fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryMainId, setCategoryMainId] = useState<number | null>(null);
  const [categorySubId, setCategorySubId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Location state
  const [venueName, setVenueName] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [addressCountry, setAddressCountry] = useState("CH");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Pricing state
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");

  // Links state
  const [url, setUrl] = useState("");
  const [ticketLink, setTicketLink] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load taxonomy on mount
  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const { data, error } = await externalSupabase
          .from("taxonomy")
          .select("id, name, slug, type, parent_id")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) {
          console.error("Taxonomy error:", error);
          toast.error("Kategorien konnten nicht geladen werden");
          return;
        }

        if (data) {
          setTaxonomy(data);
        }
      } catch (err) {
        console.error("Taxonomy fetch error:", err);
        toast.error("Fehler beim Laden der Kategorien");
      } finally {
        setLoadingTaxonomy(false);
      }
    };

    loadTaxonomy();
  }, []);

  // Get filtered categories
  const mainCategories = taxonomy.filter((t) => t.type === "main");
  const subCategories = taxonomy.filter(
    (t) => t.type === "sub" && t.parent_id === categoryMainId
  );

  // Helper function to auto-generate price label from price_from
  const generatePriceLabel = (price: number | null): string | null => {
    if (price === null || price === undefined) return null;
    if (price === 0) return "Gratis";
    if (price <= 50) return "$";
    if (price <= 150) return "$$";
    if (price <= 300) return "$$$";
    return "$$$$";
  };

  const handleMainCategoryChange = (value: string) => {
    setCategoryMainId(parseInt(value));
    setCategorySubId(null); // Reset subcategory when main changes
  };

  // Handle image file selection and upload
  const handleImageSelect = async (file: File) => {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!validTypes.includes(file.type)) {
      toast.error("Nur JPG, PNG, WebP oder GIF erlaubt");
      return;
    }

    if (file.size > maxSize) {
      toast.error("Datei zu groß (max 5MB)");
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploadingImage(true);
    try {
      const fileName = `partner-events/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;

      const { data, error } = await externalSupabase.storage
        .from("events")
        .upload(fileName, file);

      if (error) {
        toast.error("Bild-Upload fehlgeschlagen: " + error.message);
        setImageFile(null);
        setImagePreview("");
        setUploadingImage(false);
        return;
      }

      // Get public URL
      const { data: publicData } = externalSupabase.storage
        .from("events")
        .getPublicUrl(fileName);

      setImageUrl(publicData.publicUrl);
      toast.success("Bild hochgeladen!");
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("Fehler beim Bild-Upload");
      setImageFile(null);
      setImagePreview("");
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setShortDescription("");
    setImageUrl("");
    setImageFile(null);
    setImagePreview("");
    setCategoryMainId(null);
    setCategorySubId(null);
    setStartDate("");
    setEndDate("");
    setVenueName("");
    setAddressStreet("");
    setAddressCity("");
    setAddressZip("");
    setAddressCountry("CH");
    setLatitude("");
    setLongitude("");
    setPriceFrom("");
    setPriceTo("");
    setUrl("");
    setTicketLink("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 0. Validate image is uploaded
    if (!imageUrl) {
      toast.error("Bild ist erforderlich");
      setIsSubmitting(false);
      return;
    }

    // 1. Build form data object
    const formData = {
      title,
      description: description || null,
      short_description: shortDescription || null,
      image_url: imageUrl || null,
      category_main_id: categoryMainId,
      category_sub_id: categorySubId || null,
      start_date: startDate,
      end_date: endDate || null,
      venue_name: venueName || null,
      address_street: addressStreet,
      address_city: addressCity || null,
      address_zip: addressZip || null,
      address_country: addressCountry,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      price_from: priceFrom ? parseFloat(priceFrom) : null,
      price_to: priceTo ? parseFloat(priceTo) : null,
      price_label: priceFrom ? generatePriceLabel(parseFloat(priceFrom)) : null,
      url: url || null,
      ticket_link: ticketLink || null,
    };

    // 2. Validate with Zod
    try {
      partnerEventSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
        setIsSubmitting(false);
        return;
      }
    }

    // 3. Generate unique external_id
    const externalId = `partner_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // 4. Prepare insert payload
    const insertPayload = {
      ...formData,
      external_id: externalId,
      status: "pending",
      source: "partner",
      buzz_score: null,
      favorite_count: null,
      click_count: null,
      referral_count: null,
    };

    // 5. Insert to Supabase
    try {
      const { data, error } = await externalSupabase
        .from("events")
        .insert([insertPayload])
        .select();

      if (error) {
        console.error("Insert error:", error);
        toast.error("Fehler beim Einreichen: " + error.message);
        setIsSubmitting(false);
        return;
      }

      // 6. Success
      toast.success("Event erfolgreich eingereicht!");
      setSubmitSuccess(true);
      resetForm();

      // 7. Send admin notification (non-blocking)
      if (data && data[0]) {
        const eventId = data[0].id;
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/partner-event-notification`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: eventId }),
          }
        ).catch((err) =>
          console.error("Email notification failed:", err)
        );
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (submitSuccess) {
    return (
      <>
        <Helmet>
          <title>Event eingereicht - EventBuzzer</title>
          <meta
            name="description"
            content="Ihr Event wurde erfolgreich eingereicht. Wir prüfen es und schalten es frei."
          />
          <meta name="robots" content="noindex" />
        </Helmet>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="font-serif text-4xl text-foreground italic mb-4">
              Event eingereicht!
            </h1>
            <p className="text-muted-foreground mb-8">
              Vielen Dank für Ihre Einreichung. Wir prüfen Ihr Event und
              schalten es innerhalb von 24 Stunden frei.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => setSubmitSuccess(false)}
                className="w-full sm:w-auto"
              >
                Weiteres Event einreichen
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/">Zur Startseite</Link>
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Event hochladen - EventBuzzer Partner</title>
        <meta
          name="description"
          content="Laden Sie Ihr Event kostenlos hoch und erreichen Sie monatlich tausende Event-Suchende in der Schweiz."
        />
        <meta name="robots" content="noindex" />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 py-12 md:py-16 mb-8 md:mb-12">
          <div className="max-w-3xl mx-auto text-center px-4">
            <h1 className="font-serif text-4xl md:text-5xl text-foreground italic mb-4">
              Erreichen Sie monatlich tausende Event-Suchende in der Schweiz
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Kostenloses Event-Listing für Veranstalter, Locations und Partner
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>100% kostenlos</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Sofortige Sichtbarkeit</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>SEO-optimiert</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="max-w-3xl mx-auto px-4 pb-12 md:pb-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Required Fields */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  Pflichtfelder
                </h2>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Event Bild *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview("");
                            setImageUrl("");
                          }}
                          disabled={uploadingImage}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Ändern
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            Bild hier hochladen
                          </p>
                          <p className="text-sm text-muted-foreground">
                            JPG, PNG, WebP oder GIF (max 5MB)
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageSelect(file);
                          }
                        }}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                  {uploadingImage && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird hochgeladen...
                    </div>
                  )}
                </div>
                {!imageUrl && (
                  <p className="text-sm text-red-600">Bild erforderlich</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Event Titel *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Sommerfest am Zürichsee"
                  required
                  className="h-11"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Beschreibung (empfohlen)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreiben Sie das Event in 3-5 Sätzen. Was ist besonders daran?"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/5000 Zeichen
                </p>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Category */}
                <div className="space-y-2">
                  <Label
                    htmlFor="category-main"
                    className="text-base font-medium"
                  >
                    Hauptkategorie *
                  </Label>
                  <Select
                    value={categoryMainId?.toString() || ""}
                    onValueChange={handleMainCategoryChange}
                    disabled={loadingTaxonomy}
                  >
                    <SelectTrigger id="category-main" className="h-11">
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sub Category */}
                <div className="space-y-2">
                  <Label
                    htmlFor="category-sub"
                    className="text-base font-medium"
                  >
                    Unterkategorie (optional)
                  </Label>
                  <Select
                    value={categorySubId?.toString() || ""}
                    onValueChange={(value) => setCategorySubId(parseInt(value))}
                    disabled={!categoryMainId || subCategories.length === 0}
                  >
                    <SelectTrigger id="category-sub" className="h-11">
                      <SelectValue placeholder="Unterkategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-base font-medium">
                    Startdatum & Uhrzeit *
                  </Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-base font-medium">
                    Enddatum & Uhrzeit (optional)
                  </Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Location */}
            <div className="space-y-6 border-t pt-8">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  Veranstaltungsort
                </h2>
              </div>

              {/* Address Street */}
              <div className="space-y-2">
                <Label
                  htmlFor="address-street"
                  className="text-base font-medium"
                >
                  Strassenadresse *
                </Label>
                <Input
                  id="address-street"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  placeholder="z.B. Bahnhofstrasse 123"
                  required
                  className="h-11"
                />
              </div>

              {/* City, ZIP, Country Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address-city" className="text-base font-medium">
                    Stadt
                  </Label>
                  <Input
                    id="address-city"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    placeholder="z.B. Zürich"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address-zip" className="text-base font-medium">
                    PLZ
                  </Label>
                  <Input
                    id="address-zip"
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value)}
                    placeholder="z.B. 8000"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address-country" className="text-base font-medium">
                    Land
                  </Label>
                  <Input
                    id="address-country"
                    value={addressCountry}
                    disabled
                    className="h-11 bg-muted cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Venue Name */}
              <div className="space-y-2">
                <Label htmlFor="venue-name" className="text-base font-medium">
                  Venue/Location Name (optional)
                </Label>
                <Input
                  id="venue-name"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="z.B. Hallenstadion"
                  className="h-11"
                />
              </div>

              {/* Coordinates Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div className="flex gap-2">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 text-sm mb-2">
                      Koordinaten (optional aber empfohlen)
                    </p>
                    <p className="text-xs text-blue-700">
                      Koordinaten finden Sie auf{" "}
                      <a
                        href="https://maps.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-900"
                      >
                        Google Maps
                      </a>
                      : Rechtsklick auf den Ort → "Was ist hier?" → Koordinaten kopieren
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="latitude"
                      className="text-sm font-medium"
                    >
                      Breitengrad
                    </Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="z.B. 47.3686"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="longitude"
                      className="text-sm font-medium"
                    >
                      Längengrad
                    </Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="z.B. 8.5391"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Optional Details */}
            <div className="space-y-6 border-t pt-8">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  Optionale Angaben
                </h2>
              </div>

              {/* Short Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="short-description"
                  className="text-base font-medium"
                >
                  Kurzbeschreibung (max. 2 Sätze)
                </Label>
                <Textarea
                  id="short-description"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Kurze Zusammenfassung für die Eventliste"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  {shortDescription.length}/200 Zeichen
                </p>
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image-url" className="text-base font-medium">
                  Event-Bild URL (optional)
                </Label>
                <Input
                  id="image-url"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/bild.jpg"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Datei-Upload kommt bald. Für jetzt bitte einen Link zu einem Bild verwenden.
                </p>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-3">Preis (optional)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price-from" className="text-sm font-medium">
                      Preis von (CHF)
                    </Label>
                    <Input
                      id="price-from"
                      type="number"
                      step="0.01"
                      min="0"
                      value={priceFrom}
                      onChange={(e) => setPriceFrom(e.target.value)}
                      placeholder="0"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price-to" className="text-sm font-medium">
                      Preis bis (CHF)
                    </Label>
                    <Input
                      id="price-to"
                      type="number"
                      step="0.01"
                      min="0"
                      value={priceTo}
                      onChange={(e) => setPriceTo(e.target.value)}
                      placeholder="0"
                      className="h-11"
                    />
                  </div>
                </div>

                {priceFrom && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
                    <p className="font-medium mb-1">Automatische Kategorie:</p>
                    <p>
                      {generatePriceLabel(parseFloat(priceFrom)) === "Gratis"
                        ? "✓ Gratis"
                        : generatePriceLabel(parseFloat(priceFrom)) === "$"
                        ? "✓ $ (Budget: bis CHF 50)"
                        : generatePriceLabel(parseFloat(priceFrom)) === "$$"
                        ? "✓ $$ (Mittel: CHF 50-150)"
                        : generatePriceLabel(parseFloat(priceFrom)) === "$$$"
                        ? "✓ $$$ (Premium: CHF 150-300)"
                        : "✓ $$$$ (Luxus: über CHF 300)"}
                    </p>
                  </div>
                )}
              </div>

              {/* Event Website */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-base font-medium">
                  Event-Webseite (optional)
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="h-11"
                />
              </div>

              {/* Ticket Link */}
              <div className="space-y-2">
                <Label
                  htmlFor="ticket-link"
                  className="text-base font-medium"
                >
                  Ticket-Link (optional)
                </Label>
                <Input
                  id="ticket-link"
                  type="url"
                  value={ticketLink}
                  onChange={(e) => setTicketLink(e.target.value)}
                  placeholder="https://tickets.example.com"
                  className="h-11"
                />
              </div>
            </div>

            {/* Submit Section */}
            <div className="border-t pt-8 flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                disabled={isSubmitting || loadingTaxonomy}
                size="lg"
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird eingereicht...
                  </>
                ) : (
                  "Event einreichen"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={resetForm}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Formular leeren
              </Button>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-medium mb-1">Nach der Einreichung:</p>
                <p>
                  Ihr Event wird von unserem Team geprüft und innerhalb von 24 Stunden
                  freigeschaltet. Nur Events mit vollständigen Informationen werden
                  genehmigt.
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default PartnerUpload;
