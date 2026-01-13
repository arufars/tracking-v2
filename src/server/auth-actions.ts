"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FormState = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function registerEmail(prevState: FormState | null, formData: FormData): Promise<FormState> {
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validasi input
  if (!email || !password || !full_name) {
    return {
      success: false,
      error: "Semua field harus diisi",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Password minimal 6 karakter",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          // Role akan dibaca oleh trigger database
          role: "production", // Default role untuk new user
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Return success, redirect akan di-handle di client side
    return {
      success: true,
      message: "Registrasi berhasil! Mengalihkan ke dashboard...",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat registrasi",
    };
  }
}

export async function loginEmail(prevState: FormState | null, formData: FormData): Promise<FormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validasi input
  if (!email || !password) {
    return {
      success: false,
      error: "Email dan password harus diisi",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Login dengan Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: "Email atau password salah",
      };
    }

    // Return success, redirect akan di-handle di client side
    return {
      success: true,
      message: "Login berhasil! Mengalihkan ke dashboard...",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat login",
    };
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Sign out dari Supabase Auth
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  // Redirect ke halaman login
  redirect("/");
}
