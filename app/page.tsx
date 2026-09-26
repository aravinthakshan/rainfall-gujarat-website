import { redirect } from "next/navigation"

export default function Home() {
  redirect("/maps")
  return null
}
