import Image from "next/image"
import Link from "next/link"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
    </svg>
  )
}

type Member = {
  name: string
  title: string
  description: string
  image: string
  linkedin?: string
  github?: string
  email?: string
}

const teamMembers: Member[] = [
  {
    name: "Hiren Solanki",
    title: "PhD Research Scholar, IIT Gandhinagar",
    description: "Machine Learning, Deep Learning, Hydroclimatic extremes, Remote Sensing, Paleoclimate",
    image: "/Hiren Solanki.6de65781a4ed43991632.jpg",
    linkedin: "https://www.linkedin.com/in/hiren-solanki-831286135",
    email: "hiren.solanki@iitgn.ac.in",
  },
  {
    name: "Aravinthakshan",
    title: "B.Tech CSE, Manipal Institute of Technology",
    description: "AI Researcher, Software and Machine Learning Engineer",
    image: "/aravinthakshan.jpg",
    linkedin: "https://www.linkedin.com/in/aravinthakshan/",
    github: "https://github.com/aravinthakshan/",
    email: "aravinthakshanmain@gmail.com",
  },
  {
    name: "Sayuj Gupta",
    title: "B.Tech CSE, IIT Jammu",
    description: "AI Researcher, Software and Machine Learning Engineer",
    image: "/sayuj.png",
    linkedin: "https://www.linkedin.com/in/sayuj-gupta-14a4b42b9",
    email: "sayuj.gupta@iitgn.ac.in",
  },
]

const sources = [
  {
    name: "Taluka rainfall",
    detail: "State Emergency Operation Centre (SEOC), Gujarat — daily 24-hour rainfall report",
    href: "https://www.gujaratweather.com/?page_id=14577",
  },
  {
    name: "Reservoir storage",
    detail: "Narmada, Water Resources, Water Supply & Kalpsar Dept. — daily dam storage report",
    href: "https://wrd-dam.gujarat.gov.in/",
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Water and Climate Lab</h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          The Water and Climate Lab at IIT Gandhinagar studies how water resources and the climate system interact. We
          combine hydrological modelling, remote sensing and machine learning to work on water security, climate
          adaptation and extreme events.
        </p>
        <p className="mt-3 leading-7 text-muted-foreground">
          This site tracks the monsoon across Gujarat: taluka-level rainfall and reservoir storage, updated
          automatically every day from official state reports.
        </p>
        <div className="mt-6 flex gap-2">
          <Button asChild>
            <Link href="/maps">Explore maps</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/blog">Read the blog</Link>
          </Button>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-semibold">Team</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {teamMembers.map((m) => (
            <div key={m.name} className="rounded-lg border p-5">
              <Image
                src={m.image}
                alt={m.name}
                width={72}
                height={72}
                className="h-16 w-16 rounded-full object-cover"
              />
              <h3 className="mt-4 font-medium">{m.name}</h3>
              <p className="text-sm text-primary">{m.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
              <div className="mt-3 flex gap-1 text-muted-foreground">
                {m.linkedin && (
                  <a href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="rounded p-1.5 hover:bg-muted hover:text-foreground">
                    <LinkedinIcon />
                  </a>
                )}
                {m.github && (
                  <a href={m.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="rounded p-1.5 hover:bg-muted hover:text-foreground">
                    <GithubIcon />
                  </a>
                )}
                {m.email && (
                  <a href={`mailto:${m.email}`} aria-label="Email" className="rounded p-1.5 hover:bg-muted hover:text-foreground">
                    <Mail className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-semibold">Data sources</h2>
        <ul className="mt-4 divide-y border-y text-sm">
          {sources.map((s) => (
            <li key={s.name} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
              <span className="w-40 shrink-0 font-medium">{s.name}</span>
              <span className="text-muted-foreground">
                {s.detail} ·{" "}
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  source
                </a>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
