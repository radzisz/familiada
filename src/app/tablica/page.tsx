import { redirect } from "next/navigation";

/** Bez id rozgrywki nie wiadomo, co pokazać – lista rozgrywek ma linki do tablicy i kodu QR. */
export default function WithoutEvent() {
  redirect("/admin");
}
