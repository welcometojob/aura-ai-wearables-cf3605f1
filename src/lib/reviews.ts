import { supabase } from "@/integrations/supabase/client";
import { uploadToR2 } from "@/lib/r2-upload";

export type Review = {
  id: string;
  authorName: string;
  title: string;
  text: string;
  rating: number;
  variant: string | null;
  images: string[];
  helpfulCount: number;
  createdAt: string;
  userId: string | null;
};

type Row = {
  id: string;
  user_id: string | null;
  author_name: string;
  title: string;
  text: string;
  rating: number;
  variant: string | null;
  images: string[] | null;
  helpful_count: number;
  created_at: string;
};

const toReview = (r: Row): Review => ({
  id: r.id,
  userId: r.user_id,
  authorName: r.author_name,
  title: r.title,
  text: r.text,
  rating: r.rating,
  variant: r.variant,
  images: r.images ?? [],
  helpfulCount: r.helpful_count,
  createdAt: r.created_at,
});

export async function fetchReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id,user_id,author_name,title,text,rating,variant,images,helpful_count,created_at")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as Row[] | null)?.map(toReview) ?? [];
}

export async function uploadReviewImage(file: File, _userId: string): Promise<string> {
  return uploadToR2(file, "review-images");
}

export async function createReview(input: {
  userId: string;
  authorName: string;
  title: string;
  text: string;
  rating: number;
  variant?: string;
  images: string[];
}): Promise<Review> {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: input.userId,
      author_name: input.authorName,
      title: input.title,
      text: input.text,
      rating: input.rating,
      variant: input.variant || null,
      images: input.images,
    })
    .select("id,user_id,author_name,title,text,rating,variant,images,helpful_count,created_at")
    .single();
  if (error) throw error;
  return toReview(data as Row);
}