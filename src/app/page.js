"use client";
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    // You can replace this with your real auth check
    const isLoggedIn = false;
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [router]);
  return null;
}
