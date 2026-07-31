import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useLang } from "@/i18n/LangContext";
import { fetchPublicReviews, submitReview } from "@/lib/api";
import { z } from "zod";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  service_type: string | null;
  travel_period: string | null;
  created_at: string;
}

const reviewSchema = z.object({
  author_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1000),
  service_type: z.string().trim().max(50).optional().or(z.literal("")),
  travel_period: z.string().trim().max(80).optional().or(z.literal("")),
});

export function Reviews() {
  const { t } = useLang();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    (async () => {
      try {
        setReviews(await fetchPublicReviews(3));
      } catch (err) {
        console.error("chargement des avis impossible", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const raw = {
      author_name: String(fd.get("author_name") || ""),
      email: String(fd.get("email") || ""),
      rating,
      comment: String(fd.get("comment") || ""),
      service_type: String(fd.get("service_type") || ""),
      travel_period: String(fd.get("travel_period") || ""),
    };
    const parsed = reviewSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || t.reviews.reviewError);
      return;
    }
    setSubmitting(true);
    try {
      await submitReview({
        author_name: parsed.data.author_name,
        email: parsed.data.email || null,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        service_type: parsed.data.service_type || null,
        travel_period: parsed.data.travel_period || null,
      });
      setDone(true);
      (e.target as HTMLFormElement).reset();
      setRating(5);
    } catch (err) {
      console.error(err);
      setError(t.reviews.reviewError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.reviews.title} subtitle={t.reviews.subtitle} />

        <div className="mt-10 flex justify-center">
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setDone(false);
            }}
            className="bg-gradient-gold text-gold-foreground px-6 py-3 rounded-full font-semibold shadow-gold hover:scale-105 transition-all"
          >
            {showForm ? t.reviews.cancel : t.reviews.leave}
          </button>
        </div>

        {showForm && (
          <div className="mt-8 max-w-2xl mx-auto bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-elegant">
            {done ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✓</div>
                <p className="text-foreground">{t.reviews.thankYou}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input name="author_name" label={t.reviews.yourName} required />
                  <Input name="email" type="email" label={t.reviews.yourEmail} />
                  <Input name="travel_period" label={t.reviews.travelPeriod} placeholder={t.reviews.travelPeriodPlaceholder} />
                  <Input name="service_type" label={t.reviews.serviceUsed} />
                </div>

                <div>
                  <span className="block text-xs font-semibold text-foreground/80 mb-1.5">{t.reviews.rating}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className="p-1"
                        aria-label={`${n} stars`}
                      >
                        <Star className={`w-7 h-7 ${n <= rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="block text-xs font-semibold text-foreground/80 mb-1.5">{t.reviews.yourReview} *</span>
                  <textarea
                    name="comment"
                    required
                    rows={4}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </label>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-primary text-primary-foreground py-3 rounded-full font-semibold disabled:opacity-60"
                >
                  {submitting ? t.reviews.submitting : t.reviews.submit}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse h-48" />
            ))
          ) : reviews.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground italic">{t.reviews.noReviews}</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-6 shadow-soft hover:shadow-elegant transition-all">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(r.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-foreground italic leading-relaxed mb-4">"{r.comment}"</p>
                <div className="text-sm font-semibold text-primary">— {r.author_name}</div>
                {r.travel_period && <div className="text-xs text-muted-foreground mt-1">{r.travel_period}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function Input({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-foreground/80 mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
      />
    </label>
  );
}
