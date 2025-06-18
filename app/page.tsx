import { redirect } from "next/navigation"

export default function Home() {
  redirect("/aboutus")
  return null
}
