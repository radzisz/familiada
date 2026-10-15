"use client";

import Link from "next/link";
import { postJson } from "@/lib/client/api";

async function logout() {
  const res = await postJson("/api/logout", {});
  if (!res.ok) console.warn("[admin] logout failed", res.error);
  window.location.reload();
}

interface Props {
  title: string;
  /** Pokaż link „← Rozgrywki” do listy. */
  back?: boolean;
  /** Plakietki przy tytule (np. stan ankiety). */
  badges?: React.ReactNode;
  children?: React.ReactNode;
}

/** Nagłówek panelu: tytuł, linki widoku i wylogowanie. */
export function AdminHeader({ title, back = false, badges, children }: Props) {
  return (
    <header className="ad-head">
      <div className="ad-title">
        {back && <Link className="ad-back" href="/admin">← Rozgrywki</Link>}
        <div className="ad-title-row">
          <h1>{title}</h1>
          {badges}
        </div>
      </div>
      <nav className="ad-nav">
        {children}
        <button type="button" onClick={() => void logout()}>Wyloguj</button>
      </nav>
    </header>
  );
}
